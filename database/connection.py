"""Optimized Database connection management"""

import mysql.connector
from mysql.connector import pooling
import threading
from concurrent.futures import ThreadPoolExecutor
from config import Config
import logging
from contextlib import contextmanager

logger = logging.getLogger(__name__)

# Thread-local storage for database connections
thread_local = threading.local()
executor = ThreadPoolExecutor(max_workers=Config.MAX_WORKERS)

# Connection pool for better performance
_connection_pool = None
_pool_lock = threading.Lock()

# Current database configuration
db_config = Config.MYSQL_CONFIG.copy()

def _initialize_pool():
    """Initialize connection pool with optimized settings"""
    global _connection_pool
    
    if _connection_pool is None:
        with _pool_lock:
            if _connection_pool is None:  # Double-check locking
                pool_config = db_config.copy()
                pool_config.update({
                    'pool_name': 'db_pool',
                    'pool_size': min(Config.MAX_WORKERS * 2, 32),  # Optimized pool size
                    'pool_reset_session': True,
                    'autocommit': False,  # Explicit transaction control
                    'use_unicode': True,
                    'charset': 'utf8mb4',
                    'collation': 'utf8mb4_unicode_ci',
                    'sql_mode': 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO',
                    'connect_timeout': 10,
                    'buffered': True  # Enable buffered cursors by default
                })
                
                try:
                    _connection_pool = pooling.MySQLConnectionPool(**pool_config)
                    logger.info(f"Connection pool initialized with size {pool_config['pool_size']}")
                except Exception as e:
                    logger.error(f"Failed to initialize connection pool: {e}")
                    raise

def get_db_connection():
    """Get optimized database connection from pool"""
    global _connection_pool
    
    # Initialize pool if not already done
    if _connection_pool is None:
        _initialize_pool()
    
    # Use thread-local connection if available and valid
    if hasattr(thread_local, 'connection'):
        try:
            # Test connection validity
            if thread_local.connection.is_connected():
                return thread_local.connection
        except:
            # Connection is stale, remove it
            delattr(thread_local, 'connection')
    
    # Get new connection from pool
    try:
        thread_local.connection = _connection_pool.get_connection()
        return thread_local.connection
    except Exception as e:
        logger.error(f"Failed to get connection from pool: {e}")
        # Fallback to direct connection
        return mysql.connector.connect(**db_config)

@contextmanager
def get_cursor(dictionary=False, buffered=True):
    """Context manager for optimized cursor handling"""
    conn = get_db_connection()
    cursor = None
    try:
        cursor = conn.cursor(dictionary=dictionary, buffered=buffered)
        yield cursor
    except Exception as e:
        if conn.in_transaction:
            conn.rollback()
        raise e
    finally:
        if cursor:
            cursor.close()

def get_executor():
    """Get thread pool executor"""
    return executor

def update_db_config(database_name):
    """Update database configuration with selected database"""
    global db_config, _connection_pool
    
    db_config['database'] = database_name
    
    # Reset pool to use new database
    with _pool_lock:
        if _connection_pool:
            try:
                # Close existing pool connections
                _connection_pool._remove_connections()
            except:
                pass
        _connection_pool = None
    
    # Clear thread-local connections
    if hasattr(thread_local, 'connection'):
        try:
            thread_local.connection.close()
        except:
            pass
        delattr(thread_local, 'connection')

def get_current_db_name():
    """Get currently selected database name"""
    return db_config.get('database')

def close_all_connections():
    """Close all connections and cleanup"""
    global _connection_pool
    
    # Close thread-local connection
    if hasattr(thread_local, 'connection'):
        try:
            thread_local.connection.close()
        except:
            pass
        delattr(thread_local, 'connection')
    
    # Close pool connections
    with _pool_lock:
        if _connection_pool:
            try:
                _connection_pool._remove_connections()
            except:
                pass
            _connection_pool = None
    
    # Shutdown executor
    executor.shutdown(wait=True)