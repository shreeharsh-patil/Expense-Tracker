import json
import logging
import threading
import urllib.request
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from database.db import get_db

logger = logging.getLogger(__name__)
webhooks_bp = Blueprint('webhooks', __name__)


def dispatch_webhooks(user_id, event, payload):
    """Dispatch a webhook event to all active webhooks for the user."""
    db = get_db()
    hooks = db.execute(
        "SELECT * FROM webhooks WHERE user_id = ? AND is_active = 1",
        (user_id,)
    ).fetchall()
    for hook in hooks:
        events = [e.strip() for e in hook['events'].split(',')]
        if event in events:
            threading.Thread(
                target=_send_webhook,
                args=(hook['url'], event, payload),
                daemon=True
            ).start()


def _send_webhook(url, event, payload):
    try:
        data = json.dumps({'event': event, 'data': payload}).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        logger.error(f"Webhook delivery failed to {url}: {e}")


@webhooks_bp.route('/webhooks', endpoint='list_webhooks')
def list_webhooks():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    hooks = db.execute("SELECT * FROM webhooks WHERE user_id = ? ORDER BY created_at DESC", (session['user_id'],)).fetchall()
    return render_template('webhooks.html', webhooks=hooks)


@webhooks_bp.route('/webhooks/add', methods=['POST'], endpoint='add_webhook')
def add_webhook():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    name = (request.form.get('name') or '').strip()
    url = (request.form.get('url') or '').strip()
    events = request.form.get('events', 'expense.created')
    if not name or not url:
        flash('Webhook name and URL are required.', 'danger')
        return redirect(url_for('webhooks.list_webhooks'))
    db = get_db()
    db.execute("INSERT INTO webhooks (user_id, name, url, events) VALUES (?, ?, ?, ?)",
               (session['user_id'], name, url, events))
    db.commit()
    flash(f'Webhook "{name}" created!', 'success')
    return redirect(url_for('webhooks.list_webhooks'))


@webhooks_bp.route('/webhooks/<int:id>/delete', methods=['POST'], endpoint='delete_webhook')
def delete_webhook(id):
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    db.execute("DELETE FROM webhooks WHERE id = ? AND user_id = ?", (id, session['user_id']))
    db.commit()
    flash('Webhook deleted.', 'info')
    return redirect(url_for('webhooks.list_webhooks'))


# ============ REST API ============
@webhooks_bp.route('/api/v1/expenses', methods=['GET'])
def api_list_expenses():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    db = get_db()
    rows = db.execute("SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC LIMIT 50", (session['user_id'],)).fetchall()
    return jsonify([dict(r) for r in rows])


@webhooks_bp.route('/api/v1/expenses', methods=['POST'])
def api_create_expense():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    data = request.get_json()
    if not data or 'amount' not in data:
        return jsonify({'error': 'Amount is required'}), 400
    db = get_db()
    from helpers import validate_amount
    valid, result = validate_amount(data.get('amount'))
    if not valid:
        return jsonify({'error': result}), 400
    from datetime import datetime
    db.execute(
        "INSERT INTO expenses (user_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?)",
        (session['user_id'], result, data.get('category', 'Other'), data.get('description', ''), data.get('date', datetime.now().strftime('%Y-%m-%d')))
    )
    db.commit()
    # Dispatch webhook
    dispatch_webhooks(session['user_id'], 'expense.created', data)
    return jsonify({'status': 'created'}), 201


@webhooks_bp.route('/api/v1/stats', methods=['GET'])
def api_stats():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    db = get_db()
    user_id = session['user_id']
    total = db.execute("SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE user_id = ?", (user_id,)).fetchone()['total']
    count = db.execute("SELECT COUNT(*) as cnt FROM expenses WHERE user_id = ?", (user_id,)).fetchone()['cnt']
    top_cat = db.execute("SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY category ORDER BY total DESC LIMIT 1", (user_id,)).fetchone()
    return jsonify({'total_spent': total, 'total_expenses': count, 'top_category': dict(top_cat) if top_cat else None})
