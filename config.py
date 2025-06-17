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
    
    # Firebase credentials from environment variables
    @staticmethod
    def get_firebase_credentials():
        """Get Firebase credentials from environment variables"""
        required_env_vars = [
            'FIREBASE_TYPE',
            'FIREBASE_PROJECT_ID', 
            'FIREBASE_PRIVATE_KEY_ID',
            'FIREBASE_PRIVATE_KEY',
            'FIREBASE_CLIENT_EMAIL',
            'FIREBASE_CLIENT_ID',
            'FIREBASE_AUTH_URI',
            'FIREBASE_TOKEN_URI'
        ]
        
        # Check if all required environment variables are present
        missing_vars = [var for var in required_env_vars if not os.getenv(var)]
        if missing_vars:
            raise ValueError(f"Missing Firebase environment variables: {', '.join(missing_vars)}")
        
        # Process the private key to handle newlines correctly
        private_key = os.getenv('FIREBASE_PRIVATE_KEY')
        if private_key:
            # Replace literal \n with actual newlines
            private_key = private_key.replace('\\n', '\n')
        
        return {
            "type": os.getenv('FIREBASE_TYPE'),
            "project_id": os.getenv('FIREBASE_PROJECT_ID'),
            "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
            "private_key": private_key,
            "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
            "client_id": os.getenv('FIREBASE_CLIENT_ID'),
            "auth_uri": os.getenv('FIREBASE_AUTH_URI'),
            "token_uri": os.getenv('FIREBASE_TOKEN_URI')
        }
    
    # Validation method to check Firebase credentials at startup
    @staticmethod
    def validate_firebase_credentials():
        """Validate Firebase credentials are properly configured"""
        try:
            credentials = Config.get_firebase_credentials()
            
            # Basic validation
            if not credentials['project_id']:
                raise ValueError("Firebase project_id is empty")
            
            if not credentials['private_key'].startswith('-----BEGIN PRIVATE KEY-----'):
                raise ValueError("Firebase private_key format is invalid")
                
            if '@' not in credentials['client_email']:
                raise ValueError("Firebase client_email format is invalid")
                
            print("✅ Firebase credentials validation passed")
            return True
            
        except Exception as e:
            print(f"❌ Firebase credentials validation failed: {e}")
            return False
    
    # Thread Pool Configuration
    MAX_WORKERS = int(os.getenv('MAX_WORKERS', 32))
    
    # Logging Configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

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