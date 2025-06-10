"""Gemini AI service for chat functionality with DB-Genie identity"""
import google.generativeai as genai
from config import Config
import logging

logger = logging.getLogger(__name__)

# Configure the Gemini API
genai.configure(api_key=Config.GEMINI_API_KEY)
model = genai.GenerativeModel(model_name="gemini-2.5-flash-preview-05-20")

# Global chat sessions storage
chat_sessions = {}

class GeminiService:

    # Configuration options
    STRICT_MODE = True  # Set to False for more lenient topic enforcement
    ENABLE_CONTEXT_ENHANCEMENT = False  # Set to False to disable message enhancement

    @staticmethod
    def get_system_prompt():
        """Generate the system prompt that defines DB-Genie’s identity, capabilities, and interaction style"""
        return """
    You are DB-Genie, an intelligent database assistant developed by ABN Alliance. Follow these guidelines:

    IDENTITY & PURPOSE
    - You are DB-Genie, built by ABN Alliance to simplify database work.
    - Your sole focus is assisting users with database tasks—queries, design, optimization, troubleshooting.
    - You currently support MySQL and will expand to other SQL and NoSQL systems in future releases.

    KEY FEATURES
    1. Zero-Trust Architecture
    • No user data is stored—only schema metadata is used to generate SQL.
    2. Built-in SQL Editor
    • Users can write and execute queries directly in the UI.
    3. Result Display
    • Query results appear in a tabular format in the UI.
    4. Data Visualization
    • Recommend and render charts (bar, line, pie, scatter, doughnut, radar) based on query results.

    INTERACTION GUIDELINES
    1. Stay on topic: If asked non-database questions, politely redirect to database assistance.
    2. Identity: If asked, say “I’m DB-Genie from ABN Alliance.”
    3. Conciseness: Respond clearly and to the point. Only provide in-depth explanations if the user explicitly requests more detail.
    4. Capability Limits: If asked about unsupported features, acknowledge and mention planned expansion (other SQL/NoSQL support).
    5. Tone: Professional, friendly, and helpful. Avoid robotic phrasing.
    6. Jargon: Use simple language unless the user is clearly technical.
    7. Practicality: Prioritize actionable solutions—provide step-by-step guidance when needed.

    VISUALIZATION SUGGESTIONS
    - After generating or receiving a query, analyze its structure and suggest the most suitable chart type from your supported list.

    -If user ask you to visualize the shema then you have to generate accurate Mermaid code which can visualze their schema.

    Remember: Your mission is to make database work easier and accessible—be concise, clear, and focused on real solutions."""


    @staticmethod
    def get_or_create_chat_session(conversation_id, history=None):
        """Get existing chat session or create new one with system prompt"""
        if conversation_id not in chat_sessions:
            # Prepare the initial history with system prompt
            system_message = {
                "role": "user",
                "parts": [GeminiService.get_system_prompt()]
            }
            system_response = {
                "role": "model",
                "parts": ["I understand. I am DB-Genie, developed by ABN Alliance, and I'm here to help you with all your database needs. How can I assist you with your database tasks today?"]
            }

            initial_history = [system_message, system_response]

            # Add any existing history after the system prompt
            if history:
                initial_history.extend(history)

            chat_sessions[conversation_id] = model.start_chat(history=initial_history)

        return chat_sessions[conversation_id]

    @staticmethod
    def send_message(conversation_id, message, history=None):
        """Send message to Gemini and get response with DB-Genie identity"""
        try:
            chat_session = GeminiService.get_or_create_chat_session(conversation_id, history)
            
            # Add context reminder for database focus if the message seems off-topic
            if GeminiService.ENABLE_CONTEXT_ENHANCEMENT:
                enhanced_message = GeminiService._enhance_message_if_needed(message)
            else:
                enhanced_message = message
            
            response = chat_session.send_message(enhanced_message)
            return response.text
        except Exception as e:
            logger.error(f'Error querying Gemini: {e}')
            raise e

    @staticmethod
    def _enhance_message_if_needed(message):
        """Enhance message with context if it appears to be off-topic"""
        # List of keywords that suggest database-related queries
        db_keywords = [
            'sql', 'query', 'database', 'table', 'mysql', 'select', 'insert', 
            'update', 'delete', 'join', 'index', 'schema', 'primary key',
            'foreign key', 'constraint', 'normalize', 'optimize', 'performance'
        ]
        
        # List of keywords that suggest identity questions
        identity_keywords = [
            'who are you', 'what are you', 'your name', 'created by', 
            'developed by', 'made by', 'creator', 'developer'
        ]
        
        message_lower = message.lower()
        
        # If it's an identity question, let it pass through normally
        if any(keyword in message_lower for keyword in identity_keywords):
            return message
        
        # If it's clearly database-related, let it pass through
        if any(keyword in message_lower for keyword in db_keywords):
            return message
        
        # If it seems off-topic, add a gentle context reminder
        non_db_indicators = [
            'weather', 'news', 'sports', 'cooking', 'travel', 'movies', 
            'music', 'politics', 'health', 'fitness', 'games'
        ]
        
        if any(indicator in message_lower for indicator in non_db_indicators):
            return f"{message}\n\n[Context: Please remember to focus on database-related assistance as DB-Genie]"
        
        return message

    @staticmethod
    def notify_gemini(conversation_id, message):
        """Send notification to Gemini without expecting response"""
        logger.debug(f'Notifying to Gemini: {message}')
        if conversation_id in chat_sessions:
            try:
                chat_sessions[conversation_id].send_message(message)
            except Exception as e:
                logger.error(f'Error notifying Gemini: {e}')
        else:
            logger.warning(f'No chat session found for conversation_id: {conversation_id}')

    @staticmethod
    def reset_chat_session(conversation_id):
        """Reset chat session for a given conversation ID"""
        if conversation_id in chat_sessions:
            del chat_sessions[conversation_id]
            logger.info(f'Chat session reset for conversation_id: {conversation_id}')

    @staticmethod
    def get_session_info(conversation_id):
        """Get information about current chat session"""
        if conversation_id in chat_sessions:
            session = chat_sessions[conversation_id]
            return {
                'exists': True,
                'history_length': len(session.history) if hasattr(session, 'history') else 0
            }
        return {'exists': False, 'history_length': 0}