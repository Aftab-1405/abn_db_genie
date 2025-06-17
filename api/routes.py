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
    host = data.get('host')
    port = data.get('port')
    user = data.get('user')
    password = data.get('password')
    db_name = data.get('db_name')
    conversation_id = session.get('conversation_id')

    # Case 1: Initial server connection (host, port, user, password)
    if all([host, port, user, password]):
        from database import connection as db_connection
        db_connection.db_config.update({
            'host': host,
            'port': int(port),
            'user': user,
            'password': password
        })
        # Reset pool and thread-local connection
        with db_connection._pool_lock:
            if db_connection._connection_pool:
                try:
                    db_connection._connection_pool._remove_connections()
                except:
                    pass
            db_connection._connection_pool = None
        if hasattr(db_connection.thread_local, 'connection'):
            try:
                db_connection.thread_local.connection.close()
            except:
                pass
            delattr(db_connection.thread_local, 'connection')
        # Test connection and fetch schemas
        try:
            conn = db_connection.get_db_connection()
            if conn.is_connected():
                from database.operations import get_databases
                dbs_result = get_databases()
                if dbs_result.get('status') == 'success':
                    return jsonify({'status': 'connected', 'message': f'Connected to database server at {host}:{port}', 'schemas': dbs_result['databases']})
                else:
                    return jsonify({'status': 'connected', 'message': f'Connected, but failed to fetch schemas', 'schemas': []})
            else:
                return jsonify({'status': 'error', 'message': 'Failed to connect to the database server.'})
        except Exception as err:
            return jsonify({'status': 'error', 'message': str(err)})

    # Case 2: Database selection (db_name only)
    elif db_name:
        from database.connection import update_db_config, get_current_db_name
        from database.operations import fetch_database_info
        from services.gemini_service import GeminiService
        update_db_config(db_name)
        try:
            db_info, detailed_info = fetch_database_info(db_name)
            conversation_id = session.get('conversation_id')
            if db_info and db_info.strip():
                GeminiService.notify_gemini(conversation_id, db_info)
            if detailed_info and detailed_info.strip():
                GeminiService.notify_gemini(conversation_id, detailed_info)
            return jsonify({'status': 'connected', 'message': f'Connected to database {db_name}'})
        except Exception as err:
            return jsonify({'status': 'error', 'message': str(err)})

    # Invalid request
    else:
        return jsonify({'status': 'error', 'message': 'All fields are required for server connection, or db_name for database selection.'})

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

@api_bp.route('/delete_conversation/<conversation_id>', methods=['DELETE'])
@login_required
def delete_conversation(conversation_id):
    try:
        user_id = session['user']
        FirestoreService.delete_conversation(conversation_id, user_id)
        
        # If the deleted conversation is the current one, clear it from session
        if session.get('conversation_id') == conversation_id:
            session.pop('conversation_id', None)
            
        return jsonify({'status': 'success'})
    except Exception as e:
        logger.error(f'Error deleting conversation: {e}')
        return jsonify({'status': 'error', 'message': str(e)}), 500
