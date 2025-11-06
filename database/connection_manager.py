"""
Multi-User Connection Manager

Manages database connection pools for multiple users with different configurations.
Each unique database configuration gets its own connection pool.
"""

import mysql.connector
from mysql.connector import pooling
import threading
import hashlib
import time
from contextlib import contextmanager
from typing import Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Singleton connection manager that maintains separate connection pools
    for each unique database configuration.

    Thread-safe and supports multiple concurrent users with different database configs.
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._pools: Dict[str, pooling.MySQLConnectionPool] = {}
        self._pool_locks: Dict[str, threading.Lock] = {}
        self._pool_last_used: Dict[str, float] = {}
        self._global_lock = threading.Lock()
        self._cleanup_interval = 300  # 5 minutes
        self._pool_idle_timeout = 600  # 10 minutes
        self._thread_local = threading.local()

        # Start cleanup thread
        self._start_cleanup_thread()
        self._initialized = True

        logger.info("ConnectionManager initialized")

    def _get_pool_key(self, config: dict) -> str:
        """
        Generate unique key for a database configuration.
        Uses host, port, user, and database to create hash.
        """
        key_parts = [
            config.get('host', ''),
            str(config.get('port', 3306)),
            config.get('user', ''),
            config.get('database', '')
        ]
        key_string = '|'.join(key_parts)
        return hashlib.md5(key_string.encode()).hexdigest()

    def _create_pool(self, config: dict, pool_key: str) -> pooling.MySQLConnectionPool:
        """
        Create a new connection pool for the given configuration.
        """
        pool_config = config.copy()
        pool_config.update({
            'pool_name': f'pool_{pool_key[:8]}',
            'pool_size': 5,  # Smaller pool per config
            'pool_reset_session': True,
            'autocommit': False,
            'use_unicode': True,
            'charset': 'utf8mb4',
            'collation': 'utf8mb4_unicode_ci',
            'connect_timeout': 10,
            'buffered': True
        })

        try:
            pool = pooling.MySQLConnectionPool(**pool_config)
            logger.info(f"Created connection pool {pool_key[:8]} for {config.get('user')}@{config.get('host')}/{config.get('database', 'N/A')}")
            return pool
        except Exception as e:
            logger.error(f"Failed to create connection pool: {e}")
            raise

    def get_connection(self, config: dict):
        """
        Get a database connection for the given configuration.
        Creates pool if it doesn't exist, reuses existing pool otherwise.

        Args:
            config: Database configuration dict with host, port, user, password, database

        Returns:
            MySQL connection from the appropriate pool
        """
        # Validate config
        if not config.get('host') or not config.get('user'):
            raise ValueError("Database configuration must include 'host' and 'user'")

        pool_key = self._get_pool_key(config)

        # Get or create pool for this configuration
        if pool_key not in self._pools:
            with self._global_lock:
                if pool_key not in self._pools:
                    self._pools[pool_key] = self._create_pool(config, pool_key)
                    self._pool_locks[pool_key] = threading.Lock()

        # Update last used time
        self._pool_last_used[pool_key] = time.time()

        # Get connection from pool
        try:
            connection = self._pools[pool_key].get_connection()
            logger.debug(f"Connection acquired from pool {pool_key[:8]}")
            return connection
        except Exception as e:
            logger.error(f"Failed to get connection from pool {pool_key[:8]}: {e}")
            raise

    @contextmanager
    def get_cursor(self, config: dict, dictionary=False, buffered=True):
        """
        Context manager for getting a cursor with automatic cleanup.

        Args:
            config: Database configuration dict
            dictionary: If True, return rows as dictionaries
            buffered: If True, fetch all rows immediately

        Yields:
            MySQL cursor
        """
        conn = self.get_connection(config)
        cursor = None
        try:
            cursor = conn.cursor(dictionary=dictionary, buffered=buffered)
            yield cursor
            if conn.in_transaction:
                conn.commit()
        except Exception as e:
            if conn.in_transaction:
                conn.rollback()
            logger.error(f"Error in cursor operation: {e}")
            raise
        finally:
            if cursor:
                cursor.close()

    def close_pool(self, config: dict) -> bool:
        """
        Close and remove a specific connection pool.

        Args:
            config: Database configuration dict

        Returns:
            True if pool was closed, False if pool didn't exist
        """
        pool_key = self._get_pool_key(config)

        if pool_key not in self._pools:
            return False

        with self._global_lock:
            if pool_key in self._pools:
                try:
                    # Close all connections in the pool
                    self._pools[pool_key]._remove_connections()
                    del self._pools[pool_key]
                    del self._pool_locks[pool_key]
                    del self._pool_last_used[pool_key]
                    logger.info(f"Closed connection pool {pool_key[:8]}")
                    return True
                except Exception as e:
                    logger.error(f"Error closing pool {pool_key[:8]}: {e}")
                    raise

        return False

    def close_all_pools(self):
        """
        Close all connection pools. Use with caution!
        """
        with self._global_lock:
            pool_keys = list(self._pools.keys())
            for pool_key in pool_keys:
                try:
                    self._pools[pool_key]._remove_connections()
                    logger.info(f"Closed pool {pool_key[:8]}")
                except Exception as e:
                    logger.error(f"Error closing pool {pool_key[:8]}: {e}")

            self._pools.clear()
            self._pool_locks.clear()
            self._pool_last_used.clear()
            logger.info("All connection pools closed")

    def _cleanup_idle_pools(self):
        """
        Remove connection pools that haven't been used for a while.
        Runs periodically in background thread.
        """
        current_time = time.time()

        with self._global_lock:
            pool_keys_to_remove = []

            for pool_key, last_used in self._pool_last_used.items():
                if current_time - last_used > self._pool_idle_timeout:
                    pool_keys_to_remove.append(pool_key)

            for pool_key in pool_keys_to_remove:
                try:
                    self._pools[pool_key]._remove_connections()
                    del self._pools[pool_key]
                    del self._pool_locks[pool_key]
                    del self._pool_last_used[pool_key]
                    logger.info(f"Cleaned up idle pool {pool_key[:8]}")
                except Exception as e:
                    logger.error(f"Error cleaning up pool {pool_key[:8]}: {e}")

    def _start_cleanup_thread(self):
        """
        Start background thread for cleaning up idle pools.
        """
        def cleanup_loop():
            while True:
                time.sleep(self._cleanup_interval)
                try:
                    self._cleanup_idle_pools()
                except Exception as e:
                    logger.error(f"Error in cleanup thread: {e}")

        cleanup_thread = threading.Thread(target=cleanup_loop, daemon=True)
        cleanup_thread.start()
        logger.info("Pool cleanup thread started")

    def get_pool_stats(self) -> Dict[str, dict]:
        """
        Get statistics about all connection pools.

        Returns:
            Dict with pool keys and their stats
        """
        stats = {}
        with self._global_lock:
            for pool_key, pool in self._pools.items():
                try:
                    stats[pool_key[:8]] = {
                        'pool_size': pool.pool_size,
                        'last_used_seconds_ago': int(time.time() - self._pool_last_used.get(pool_key, 0))
                    }
                except Exception as e:
                    logger.error(f"Error getting stats for pool {pool_key[:8]}: {e}")

        return stats


# Singleton instance
_connection_manager = ConnectionManager()


def get_connection_manager() -> ConnectionManager:
    """
    Get the singleton ConnectionManager instance.
    """
    return _connection_manager
