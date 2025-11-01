# File: api/routes.py
"""API routes for the application"""

from flask import Blueprint, render_template, request, jsonify, session, Response
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
    # Prefer the conversation_id explicitly provided by the client. If the
    # client omits it (null/undefined), create a fresh conversation id so the
    # prompt starts a new conversation instead of being attached to a prior
    # server-side session value.
    conversation_id = data.get('conversation_id')
    # If there's no conversation id provided by the client, create one and
    # store it in the server session so subsequent messages in this tab use it.
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        session['conversation_id'] = conversation_id
    logger.debug(f'Received prompt: {prompt} for conversation: {conversation_id}')
    
    try:
        user_id = session['user']
        FirestoreService.store_conversation(conversation_id, 'user', prompt, user_id)

        def generate():
            full_response_content = []
            responses = GeminiService.send_message(conversation_id, prompt)
            for chunk in responses:
                text_chunk = chunk.text
                full_response_content.append(text_chunk)
                yield text_chunk

            # Store the complete conversation in Firestore after streaming
            FirestoreService.store_conversation(conversation_id, 'ai', "".join(full_response_content), user_id)

        # Attach helpful headers to encourage immediate streaming through proxies
        headers = {
            'X-Conversation-Id': conversation_id,
            'Cache-Control': 'no-cache, no-transform',
            # Some reverse proxies buffer streamed responses; this header helps disable that behavior
            'X-Accel-Buffering': 'no'
        }
        return Response(generate(), mimetype='text/plain', headers=headers)
    except Exception as e:
        logger.error(f'Error querying Gemini: {e}')
        return jsonify({'status': 'error', 'message': str(e)}), 500

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

    # If all connection fields present -> treat as server connection request
    if all([host, port, user, password]):
        return _handle_server_connection(host, port, user, password)

    # If only db_name present -> treat as selecting a database on the server
    if db_name:
        return _handle_db_selection(db_name, conversation_id)

    # Invalid request
    return jsonify({'status': 'error', 'message': 'All fields are required for server connection, or db_name for database selection.'})


def _reset_db_connection_pool(db_connection):
    """Reset the module-level connection pool and any thread-local connection."""
    # Reset pool and thread-local connection
    with db_connection._pool_lock:
        if db_connection._connection_pool:
            try:
                db_connection._connection_pool._remove_connections()
            except Exception as e:
                logger.debug('Failed to remove connections from pool: %s', e)
        db_connection._connection_pool = None

    if hasattr(db_connection.thread_local, 'connection'):
        try:
            db_connection.thread_local.connection.close()
        except Exception as e:
            logger.debug('Failed to close thread-local connection: %s', e)
        try:
            delattr(db_connection.thread_local, 'connection')
        except Exception:
            # ignore if attribute already removed
            pass


def _handle_server_connection(host, port, user, password):
    """Apply new server config, reset state, test connection and return schemas."""
    from database import connection as db_connection
    # Update config
    db_connection.db_config.update({
        'host': host,
        'port': int(port),
        'user': user,
        'password': password
    })

    _reset_db_connection_pool(db_connection)

    # Test connection and fetch schemas
    try:
        conn = db_connection.get_db_connection()
        if conn.is_connected():
            from database.operations import get_databases as _get_databases
            dbs_result = _get_databases()
            if dbs_result.get('status') == 'success':
                return jsonify({'status': 'connected', 'message': 'Connected to database server at {host}:{port}'.format(host=host, port=port), 'schemas': dbs_result['databases']})
            return jsonify({'status': 'connected', 'message': 'Connected, but failed to fetch schemas', 'schemas': []})
        return jsonify({'status': 'error', 'message': 'Failed to connect to the database server.'})
    except Exception as err:
        logger.exception('Error while testing DB connection')
        return jsonify({'status': 'error', 'message': str(err)})


def _handle_db_selection(db_name, conversation_id=None):
    """Select a database, fetch its info, and notify Gemini services."""
    from database.connection import update_db_config
    from database.operations import fetch_database_info
    from services.gemini_service import GeminiService

    update_db_config(db_name)
    try:
        db_info, detailed_info = fetch_database_info(db_name)
        conversation_id = session.get('conversation_id', conversation_id)
        if db_info and db_info.strip():
            GeminiService.notify_gemini(conversation_id, db_info)
        if detailed_info and detailed_info.strip():
            GeminiService.notify_gemini(conversation_id, detailed_info)
        return jsonify({'status': 'connected', 'message': 'Connected to database {db}'.format(db=db_name)})
    except Exception as err:
        logger.exception('Error while selecting database %s', db_name)
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


@api_bp.route('/disconnect_db', methods=['POST'])
def disconnect_db():
    """Disconnect the server-side DB connection pool and thread-local connections."""
    try:
        from database.connection import close_all_connections
        from database.operations import DatabaseOperations

        close_all_connections()
        # Clear any cached DB metadata so UI cannot operate on stale data after disconnect
        try:
            DatabaseOperations.clear_cache()
        except Exception:
            logger.debug('Failed to clear DatabaseOperations cache after disconnect')
        return jsonify({'status': 'success', 'message': 'Disconnected from database server.'})
    except Exception as e:
        logger.exception('Error disconnecting DB')
        return jsonify({'status': 'error', 'message': str(e)}), 500


@api_bp.route('/db_status', methods=['GET'])
def db_status():
    """Return whether a DB connection pool exists and optionally the list of databases.

    This endpoint is intended for UI autodiscovery on page load. It will not
    expose credentials; only high-level connection state and an optional list
    of user databases (names) when available.
    """
    try:
        from database import connection as db_connection
        # Quick check: if a connection pool exists and a thread-local connection
        # is live, we consider the server connected.
        pool_exists = getattr(db_connection, '_connection_pool', None) is not None
        thread_conn_alive = False
        try:
            if hasattr(db_connection.thread_local, 'connection'):
                thread_conn_alive = bool(db_connection.thread_local.connection.is_connected())
        except Exception:
            thread_conn_alive = False

        connected = pool_exists or thread_conn_alive

        result = {'status': 'ok', 'connected': bool(connected)}

        # If connected, attempt to retrieve the database list (non-fatal)
        if connected:
            try:
                from database.operations import get_databases
                dbs = get_databases()
                if isinstance(dbs, dict) and dbs.get('status') == 'success':
                    result['databases'] = dbs.get('databases', [])
                else:
                    result['databases'] = []
            except Exception as e:
                logger.debug('db_status: failed to fetch databases: %s', e)
                result['databases'] = []

        # Provide current selected database name if present (do not expose secrets)
        try:
            current_db = db_connection.get_current_db_name()
            result['current_database'] = current_db
        except Exception:
            result['current_database'] = None

        return jsonify(result)
    except Exception as e:
        logger.exception('Error while checking DB status')
        return jsonify({'status': 'error', 'message': str(e)}), 500

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
