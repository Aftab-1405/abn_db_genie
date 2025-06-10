# File: api/routes.py
"""API routes for the application"""

from flask import Blueprint, render_template, request, jsonify, session
from auth.decorators import login_required
from database.operations import get_databases, fetch_database_info, execute_sql_query
from database.connection import update_db_config, get_current_db_name, get_executor
from services.gemini_service import GeminiService
from services.firestore_service import FirestoreService
import uuid
import logging

logger = logging.getLogger(__name__)
api_bp = Blueprint('api_bp', __name__)

@api_bp.route('/')
def landing():
    return render_template('landing.html')

@api_bp.route('/index')
@login_required
def index():
    return render_template('index.html')

@api_bp.route('/pass_userinput_to_gemini', methods=['POST'])
def pass_userinput_to_gemini():
    data = request.get_json()
    prompt = data['prompt']
    conversation_id = data.get('conversation_id', session.get('conversation_id'))
    logger.debug(f'Received prompt: {prompt} for conversation: {conversation_id}')
    
    try:
        executor = get_executor()
        future = executor.submit(GeminiService.send_message, conversation_id, prompt)
        response = future.result()
        logger.debug(f'Gemini response: {response}')
        
        # Store the conversation in Firestore
        user_id = session['user']
        FirestoreService.store_conversation(conversation_id, 'user', prompt, user_id)
        FirestoreService.store_conversation(conversation_id, 'ai', response, user_id)
        
        return jsonify({'status': 'success', 'response': response})
    except Exception as e:
        logger.error(f'Error querying Gemini: {e}')
        return jsonify({'status': 'error', 'message': str(e)})

@api_bp.route('/get_conversations', methods=['GET'])
@login_required
def get_conversations():
    user_id = session['user']
    conversation_list = FirestoreService.get_conversations(user_id)
    return jsonify({'status': 'success', 'conversations': conversation_list})

@api_bp.route('/get_conversation/<conversation_id>', methods=['GET'])
@login_required
def get_conversation(conversation_id):
    conv_data = FirestoreService.get_conversation(conversation_id)
    if conv_data:
        session['conversation_id'] = conversation_id
        history = [
            {"role": "user" if msg["sender"] == "user" else "model", "parts": [msg["content"]]}
            for msg in conv_data.get('messages', [])
        ]
        GeminiService.get_or_create_chat_session(conversation_id, history)
        return jsonify({'status': 'success', 'conversation': conv_data})
    else:
        return jsonify({'status': 'error', 'message': 'Conversation not found'})

@api_bp.route('/new_conversation', methods=['POST'])
@login_required
def new_conversation():
    conversation_id = str(uuid.uuid4())
    session['conversation_id'] = conversation_id
    GeminiService.get_or_create_chat_session(conversation_id)
    return jsonify({'status': 'success', 'conversation_id': conversation_id})

@api_bp.route('/get_databases', methods=['GET'])
def get_databases_route():
    result = get_databases()
    return jsonify(result)

@api_bp.route('/connect_db', methods=['POST'])
def connect_db():
    data = request.get_json()
    db_name = data.get('db_name')
    conversation_id = session.get('conversation_id')

    if not db_name:
        return jsonify({'status': 'error', 'message': 'No database selected'})

    update_db_config(db_name)
    
    try:
        db_info, detailed_info = fetch_database_info(db_name)
        
        if db_info and detailed_info:
            # Send database info to Gemini
            if db_info.strip():
                GeminiService.notify_gemini(conversation_id, db_info)
            if detailed_info.strip():
                GeminiService.notify_gemini(conversation_id, detailed_info)
        
        return jsonify({'status': 'connected', 'message': f'Connected to database {db_name}'})
    except Exception as err:
        return jsonify({'status': 'error', 'message': str(err)})

@api_bp.route('/run_sql_query', methods=['POST'])
def run_sql_query():
    data = request.get_json()
    sql_query = data['sql_query']
    conversation_id = session.get('conversation_id')
    
    result = execute_sql_query(sql_query)
    
    # Notify Gemini about the query execution
    db_name = get_current_db_name()
    if result['status'] == 'success':
        if 'result' in result:  # SELECT query
            notify_msg = f'SELECT query executed on {db_name}. Retrieved {result["row_count"]} rows.'
        else:  # Other queries
            notify_msg = f'Query executed on {db_name} in table {result.get("table_name", "unknown")}. Affected rows: {result["affected_rows"]}. Query: {sql_query}'
        GeminiService.notify_gemini(conversation_id, notify_msg)
    else:
        notify_msg = f'Error executing query on {db_name}: {result["message"]}. Query: {sql_query}'
        GeminiService.notify_gemini(conversation_id, notify_msg)
    
    return jsonify(result)
