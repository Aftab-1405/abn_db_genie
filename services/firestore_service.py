# File: services/firestore_service.py
"""Firestore service for conversation storage"""

import firebase_admin
from firebase_admin import credentials, firestore
from config import Config
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class FirestoreService:
    _db = None
    
    @classmethod
    def initialize(cls):
        """Initialize Firebase Admin SDK"""
        if not firebase_admin._apps:
            cred = credentials.Certificate(Config.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
        cls._db = firestore.client()
    
    @classmethod
    def get_db(cls):
        """Get Firestore database instance"""
        if cls._db is None:
            cls.initialize()
        return cls._db
    
    @staticmethod
    def store_conversation(conversation_id, sender, message, user_id):
        """Store conversation message in Firestore"""
        db = FirestoreService.get_db()
        conversation_ref = db.collection('conversations').document(conversation_id)
        
        if not conversation_ref.get().exists:
            conversation_ref.set({
                'user_id': user_id,
                'timestamp': datetime.now(),
                'messages': []
            })
        
        conversation_ref.update({
            'messages': firestore.ArrayUnion([{
                'sender': sender,
                'content': message,
                'timestamp': datetime.now()
            }])
        })
    
    @staticmethod
    def get_conversations(user_id):
        """Get all conversations for a user"""
        db = FirestoreService.get_db()
        conversations = db.collection('conversations').where('user_id', '==', user_id).get()
        conversation_list = []
        for conv in conversations:
            conv_data = conv.to_dict()
            if conv_data.get('messages'):
                conversation_list.append({
                    'id': conv.id,
                    'timestamp': conv_data['timestamp'],
                    'preview': conv_data['messages'][0]['content'][:50] + '...'
                })
        return conversation_list
    
    @staticmethod
    def get_conversation(conversation_id):
        """Get specific conversation by ID"""
        db = FirestoreService.get_db()
        conversation = db.collection('conversations').document(conversation_id).get()
        if conversation.exists:
            return conversation.to_dict()
        return None
