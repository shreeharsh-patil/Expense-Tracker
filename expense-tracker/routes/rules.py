import re
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from database.db import get_db

rules_bp = Blueprint('rules', __name__)


def apply_smart_rules(user_id, description, category=None, tag_ids=None):
    """Apply smart rules to determine category and tags for an expense.
    Returns (category, tag_ids) with matched rule overrides."""
    if not description:
        return category, tag_ids
    db = get_db()
    rules = db.execute(
        "SELECT * FROM smart_rules WHERE user_id = ? AND is_active = 1 ORDER BY priority DESC, id ASC",
        (user_id,)
    ).fetchall()
    for rule in rules:
        try:
            if re.search(rule['pattern'], description, re.IGNORECASE):
                if rule['category']:
                    category = rule['category']
                if rule.get('tags'):
                    rule_tag_ids = [int(t.strip()) for t in rule['tags'].split(',') if t.strip().isdigit()]
                    if tag_ids is None:
                        tag_ids = rule_tag_ids
                    else:
                        tag_ids = list(set(tag_ids + rule_tag_ids))
                break  # First matching rule wins (ordered by priority)
        except re.error:
            continue
    return category, tag_ids


@rules_bp.route('/rules', endpoint='list_rules')
def list_rules():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    rules = db.execute(
        "SELECT * FROM smart_rules WHERE user_id = ? ORDER BY priority DESC, id ASC",
        (session['user_id'],)
    ).fetchall()
    tags = db.execute("SELECT id, name FROM tags WHERE user_id = ?", (session['user_id'],)).fetchall()
    return render_template('rules.html', rules=rules, tags=tags)


@rules_bp.route('/rules/add', methods=['POST'], endpoint='add_rule')
def add_rule():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    name = (request.form.get('name') or '').strip()
    pattern = (request.form.get('pattern') or '').strip()
    category = request.form.get('category', '') or None
    tag_ids = request.form.getlist('tag_ids')
    tags_str = ','.join(tag_ids) if tag_ids else None
    if not name or not pattern:
        flash('Rule name and pattern are required.', 'danger')
        return redirect(url_for('rules.list_rules'))
    db = get_db()
    db.execute(
        "INSERT INTO smart_rules (user_id, name, pattern, category, tags) VALUES (?, ?, ?, ?, ?)",
        (session['user_id'], name, pattern, category, tags_str)
    )
    db.commit()
    flash(f'Rule "{name}" created!', 'success')
    return redirect(url_for('rules.list_rules'))


@rules_bp.route('/rules/<int:id>/toggle', methods=['POST'], endpoint='toggle_rule')
def toggle_rule(id):
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    rule = db.execute("SELECT * FROM smart_rules WHERE id = ? AND user_id = ?", (id, session['user_id'])).fetchone()
    if rule:
        db.execute("UPDATE smart_rules SET is_active = ? WHERE id = ?", (0 if rule['is_active'] else 1, id))
        db.commit()
    return redirect(url_for('rules.list_rules'))


@rules_bp.route('/rules/<int:id>/delete', methods=['POST'], endpoint='delete_rule')
def delete_rule(id):
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    db.execute("DELETE FROM smart_rules WHERE id = ? AND user_id = ?", (id, session['user_id']))
    db.commit()
    flash('Rule deleted.', 'info')
    return redirect(url_for('rules.list_rules'))
