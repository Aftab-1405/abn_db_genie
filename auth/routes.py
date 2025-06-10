"""Authentication routes"""

from flask import Blueprint, render_template, request, jsonify, session
import uuid
import logging

auth_bp = Blueprint('auth_bp', __name__)
logger = logging.getLogger(__name__)

@auth_bp.route('/auth')
def auth():
    session.clear()
    logger.debug('Session cleared on /auth')
    return render_template('auth.html')

@auth_bp.route('/set_session', methods=['POST'])
def set_session():
    data = request.get_json()
    session['user'] = data['user']
    session['conversation_id'] = str(uuid.uuid4())
    logger.debug(f'Session set for user: {session["user"]} with conversation_id: {session["conversation_id"]}')
    return jsonify({'status': 'success', 'conversation_id': session['conversation_id']})

@auth_bp.route('/check_session', methods=['GET'])
def check_session():
    if 'user' in session:
        return jsonify({'status': 'session_active', 'conversation_id': session.get('conversation_id')})
    else:
        return jsonify({'status': 'no_session'})