"""Main Flask application entry point"""

import logging
from flask import Flask
from config import Config
from auth.routes import auth_bp
from api.routes import api_bp
from services.firestore_service import FirestoreService

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Set up logging
    logging.basicConfig(level=getattr(logging, Config.LOG_LEVEL))
    
    # Initialize services
    FirestoreService.initialize()
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(api_bp)
    
    return app

# Create the app instance
app = create_app()

if __name__ == '__main__':
    app.run(debug=True)