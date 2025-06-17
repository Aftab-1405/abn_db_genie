# File: config.py
"""Application configuration settings"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Secret key - should always be set in environment
    SECRET_KEY = os.getenv('SECRET_KEY')
    if not SECRET_KEY or SECRET_KEY == 'your_secret_key_here':
        raise ValueError("SECRET_KEY environment variable must be set to a real value (not the placeholder)")
    
    # MySQL Configuration (defaults only, credentials to be set at runtime)
    MYSQL_CONFIG = {
        'user': None,  # To be set after user input
        'password': None,  # To be set after user input
        'host': os.getenv('MYSQL_HOST', 'localhost'),
        'port': int(os.getenv('MYSQL_PORT', 3306)),
        'database': None  # To be set after user input
    }
    
    # Gemini API Configuration
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    if not GEMINI_API_KEY or GEMINI_API_KEY == 'your_gemini_api_key_here':
        raise ValueError("GEMINI_API_KEY environment variable must be set to a real value (not the placeholder)")
    
    # Firebase Configuration
    FIREBASE_CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH', 'static/firebase-adminsdk.json')
    
    # Thread Pool Configuration
    MAX_WORKERS = int(os.getenv('MAX_WORKERS', 32))
    
    # Logging Configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')  # Changed default from DEBUG to INFO for production

class DevelopmentConfig(Config):
    """Development-specific configuration"""
    DEBUG = True
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'DEBUG')

class ProductionConfig(Config):
    """Production-specific configuration"""
    DEBUG = False
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'WARNING')

# Configuration selection based on environment
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}