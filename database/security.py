# File: database/security.py
"""Optimized Database security utilities - READ-ONLY VERSION"""

import re
import logging
from typing import List, Optional, Dict
from functools import lru_cache

logger = logging.getLogger(__name__)

class DatabaseSecurity:
    """Optimized database security utilities - READ-ONLY VERSION"""
    
    # Pre-compiled regex patterns for better performance
    _TABLE_NAME_PATTERN = re.compile(r'^[a-zA-Z_][a-zA-Z0-9_]{0,63}$')
    _DATABASE_NAME_PATTERN = re.compile(r'^[a-zA-Z_][a-zA-Z0-9_]{0,63}$')
    _COLUMN_NAME_PATTERN = re.compile(r'^[a-zA-Z_][a-zA-Z0-9_]*$')
    
    # Optimized keyword sets - READ-ONLY FOCUSED
    ALLOWED_KEYWORDS = frozenset({
        'SELECT', 'FROM', 'WHERE', 'ORDER', 'BY', 'GROUP', 'HAVING',
        'LIMIT', 'OFFSET', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
        'ON', 'AS', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
        'IS', 'NULL', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN',
        'DISTINCT', 'ASC', 'DESC', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'
    })
    
    # Expanded dangerous keywords to include all DML operations
    DANGEROUS_KEYWORDS = frozenset({
        'DROP', 'CREATE', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE',
        'EXEC', 'EXECUTE', 'UNION', 'SCRIPT', 'DECLARE', 'SHOW',
        'DESCRIBE', 'EXPLAIN', 'CALL', 'PROCEDURE', 'FUNCTION',
        'INSERT', 'UPDATE', 'DELETE', 'INTO', 'VALUES', 'SET'  # Added DML operations
    })
    
    # Query type detection patterns - Only SELECT is allowed
    _QUERY_TYPE_PATTERNS = {
        'SELECT': re.compile(r'^\s*SELECT\b', re.IGNORECASE),
        'INSERT': re.compile(r'^\s*INSERT\b', re.IGNORECASE),
        'UPDATE': re.compile(r'^\s*UPDATE\b', re.IGNORECASE),
        'DELETE': re.compile(r'^\s*DELETE\b', re.IGNORECASE)
    }
    
    @staticmethod
    @lru_cache(maxsize=256)
    def validate_table_name(table_name: str) -> str:
        """
        Cached validation of table names for better performance
        """
        if not table_name:
            raise ValueError("Table name cannot be empty")
        
        if not DatabaseSecurity._TABLE_NAME_PATTERN.match(table_name):
            raise ValueError(f"Invalid table name: {table_name}")
            
        return table_name
    
    @staticmethod
    @lru_cache(maxsize=128)
    def validate_database_name(db_name: str) -> str:
        """Cached validation of database names"""
        if not db_name:
            raise ValueError("Database name cannot be empty")
        
        if not DatabaseSecurity._DATABASE_NAME_PATTERN.match(db_name):
            raise ValueError(f"Invalid database name: {db_name}")
            
        return db_name
    
    @staticmethod
    @lru_cache(maxsize=512)
    def validate_column_name(column_name: str) -> str:
        """Cached validation of column names"""
        if not column_name:
            raise ValueError("Column name cannot be empty")
        
        if not DatabaseSecurity._COLUMN_NAME_PATTERN.match(column_name):
            raise ValueError(f"Invalid column name: {column_name}")
        
        return column_name
    
    @staticmethod
    def analyze_sql_query(query: str) -> Dict:
        """
        Optimized SQL query analysis for security issues - READ-ONLY VERSION
        """
        if not query:
            raise ValueError("Query cannot be empty")
        
        query_stripped = query.strip()
        query_upper = query_stripped.upper()
        
        analysis = {
            'is_safe': True,
            'warnings': [],
            'query_type': None,
            'tables_accessed': []
        }
        
        # Fast query type detection using pre-compiled patterns
        for query_type, pattern in DatabaseSecurity._QUERY_TYPE_PATTERNS.items():
            if pattern.match(query_stripped):
                analysis['query_type'] = query_type
                break
        
        if not analysis['query_type']:
            analysis['warnings'].append("Unknown or potentially unsafe query type")
            analysis['is_safe'] = False
        
        # Strict enforcement: Only SELECT queries are allowed
        if analysis['query_type'] != 'SELECT':
            analysis['warnings'].append(f"Query type '{analysis['query_type']}' is not allowed. Only SELECT queries are permitted.")
            analysis['is_safe'] = False
        
        # Optimized dangerous keyword detection
        query_words = set(query_upper.split())
        dangerous_found = query_words & DatabaseSecurity.DANGEROUS_KEYWORDS
        
        if dangerous_found:
            analysis['is_safe'] = False
            analysis['warnings'].extend([f"Dangerous keyword detected: {kw}" for kw in dangerous_found])
        
        # Fast multiple statement detection
        semicolon_count = query.count(';')
        if semicolon_count > 1 or (semicolon_count == 1 and not query.rstrip().endswith(';')):
            analysis['is_safe'] = False
            analysis['warnings'].append("Multiple SQL statements detected")
        
        # Quick comment detection
        if '--' in query or '/*' in query:
            analysis['warnings'].append("SQL comments detected")
        
        # Additional security checks for read-only operations
        if 'OUTFILE' in query_upper or 'DUMPFILE' in query_upper:
            analysis['is_safe'] = False
            analysis['warnings'].append("File operations are not allowed")
        
        if 'LOAD_FILE' in query_upper or 'LOAD DATA' in query_upper:
            analysis['is_safe'] = False
            analysis['warnings'].append("File loading operations are not allowed")
        
        return analysis
    
    @staticmethod
    @lru_cache(maxsize=64)
    def get_safe_query_template(query_type: str, table_name: str) -> str:
        """
        Generate cached safe query templates - READ-ONLY VERSION
        """
        validated_table = DatabaseSecurity.validate_table_name(table_name)
        
        # Only SELECT templates are provided
        templates = {
            'SELECT': f"SELECT {{columns}} FROM `{validated_table}` {{conditions}}",
            'COUNT': f"SELECT COUNT(*) FROM `{validated_table}` {{conditions}}"
        }
        
        return templates.get(query_type, "")
    
    @staticmethod
    def clear_cache():
        """Clear validation caches when needed"""
        DatabaseSecurity.validate_table_name.cache_clear()
        DatabaseSecurity.validate_database_name.cache_clear()
        DatabaseSecurity.validate_column_name.cache_clear()
        DatabaseSecurity.get_safe_query_template.cache_clear()