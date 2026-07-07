from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from database.db import get_db

tags_bp = Blueprint('tags', __name__)


@tags_bp.route('/tags', endpoint='manage_tags')
def manage_tags():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    user_id = session['user_id']
    tags = db.execute("SELECT t.*, COUNT(et.expense_id) as usage_count FROM tags t LEFT JOIN expense_tags et ON t.id = et.tag_id WHERE t.user_id = ? GROUP BY t.id ORDER BY usage_count DESC, t.name", (user_id,)).fetchall()
    return render_template('tags.html', tags=tags)


@tags_bp.route('/tags/add', methods=['POST'], endpoint='add_tag')
def add_tag():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    name = (request.form.get('name') or '').strip()
    color = request.form.get('color', '#6366f1')
    if not name:
        flash('Tag name is required.', 'danger')
        return redirect(url_for('tags.manage_tags'))
    db = get_db()
    try:
        db.execute("INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)", (session['user_id'], name, color))
        db.commit()
        flash(f'Tag "{name}" created!', 'success')
    except db.IntegrityError:
        flash(f'Tag "{name}" already exists.', 'danger')
    return redirect(url_for('tags.manage_tags'))


@tags_bp.route('/tags/<int:id>/delete', methods=['POST'], endpoint='delete_tag')
def delete_tag(id):
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    db.execute("DELETE FROM expense_tags WHERE tag_id = ?", (id,))
    db.execute("DELETE FROM tags WHERE id = ? AND user_id = ?", (id, session['user_id']))
    db.commit()
    flash('Tag deleted.', 'info')
    return redirect(url_for('tags.manage_tags'))


@tags_bp.route('/api/tags', endpoint='api_tags')
def api_tags():
    if 'user_id' not in session:
        return jsonify([])
    db = get_db()
    tags = db.execute("SELECT id, name, color FROM tags WHERE user_id = ? ORDER BY name", (session['user_id'],)).fetchall()
    return jsonify([dict(t) for t in tags])


@tags_bp.route('/tags/expense/<int:expense_id>/set', methods=['POST'], endpoint='set_expense_tags')
def set_expense_tags(expense_id):
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    expense = db.execute("SELECT * FROM expenses WHERE id = ? AND user_id = ?", (expense_id, session['user_id'])).fetchone()
    if not expense:
        flash('Expense not found.', 'danger')
        return redirect(url_for('dashboard.dashboard'))
    tag_ids = request.form.getlist('tag_ids')
    db.execute("DELETE FROM expense_tags WHERE expense_id = ?", (expense_id,))
    for tid in tag_ids:
        try:
            db.execute("INSERT INTO expense_tags (expense_id, tag_id) VALUES (?, ?)", (expense_id, int(tid)))
        except:
            pass
    db.commit()
    flash('Tags updated!', 'success')
    return redirect(request.referrer or url_for('dashboard.dashboard'))
