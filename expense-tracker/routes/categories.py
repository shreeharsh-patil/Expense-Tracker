from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from database.db import get_db

categories_bp = Blueprint('categories', __name__)


@categories_bp.route('/categories', methods=['GET'], endpoint='list_categories')
def list_categories():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    user_id = session['user_id']
    cats = db.execute(
        "SELECT id, name, icon, color FROM custom_categories WHERE user_id = ? ORDER BY name",
        (user_id,)
    ).fetchall()
    # Count usage per category
    for cat in cats:
        usage = db.execute(
            "SELECT COUNT(*) as cnt FROM expenses WHERE user_id = ? AND category = ?",
            (user_id, cat['name'])
        ).fetchone()['cnt'] or 0
        cat['usage_count'] = usage
    return render_template('categories.html', categories=cats)


@categories_bp.route('/categories/add', methods=['POST'], endpoint='add_category')
def add_category():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    name = (request.form.get('name') or '').strip()
    icon = (request.form.get('icon') or 'category').strip()
    color = (request.form.get('color') or '#6366f1').strip()
    if not name or len(name) < 2:
        flash('Category name must be at least 2 characters.', 'danger')
        return redirect(url_for('categories.list_categories'))
    db = get_db()
    try:
        db.execute(
            "INSERT INTO custom_categories (user_id, name, icon, color) VALUES (?, ?, ?, ?)",
            (session['user_id'], name, icon, color)
        )
        db.commit()
        flash(f'Category "{name}" created!', 'success')
    except db.IntegrityError:
        flash(f'Category "{name}" already exists.', 'danger')
    return redirect(url_for('categories.list_categories'))


@categories_bp.route('/categories/<int:id>/edit', methods=['POST'], endpoint='edit_category')
def edit_category(id):
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    name = (request.form.get('name') or '').strip()
    icon = (request.form.get('icon') or 'category').strip()
    color = (request.form.get('color') or '#6366f1').strip()
    if not name or len(name) < 2:
        flash('Category name must be at least 2 characters.', 'danger')
        return redirect(url_for('categories.list_categories'))
    db = get_db()
    old = db.execute(
        "SELECT * FROM custom_categories WHERE id = ? AND user_id = ?",
        (id, session['user_id'])
    ).fetchone()
    if not old:
        flash('Category not found.', 'danger')
        return redirect(url_for('categories.list_categories'))
    # Update existing expenses with old name → new name
    db.execute(
        "UPDATE expenses SET category = ? WHERE user_id = ? AND category = ?",
        (name, session['user_id'], old['name'])
    )
    # Update the category itself
    db.execute(
        "UPDATE custom_categories SET name = ?, icon = ?, color = ? WHERE id = ? AND user_id = ?",
        (name, icon, color, id, session['user_id'])
    )
    db.commit()
    flash(f'Category updated to "{name}"!', 'success')
    return redirect(url_for('categories.list_categories'))


@categories_bp.route('/categories/<int:id>/delete', methods=['POST'], endpoint='delete_category')
def delete_category(id):
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    cat = db.execute(
        "SELECT * FROM custom_categories WHERE id = ? AND user_id = ?",
        (id, session['user_id'])
    ).fetchone()
    if not cat:
        flash('Category not found.', 'danger')
        return redirect(url_for('categories.list_categories'))
    # Reassign expenses from this category to "Other"
    db.execute(
        "UPDATE expenses SET category = 'Other' WHERE user_id = ? AND category = ?",
        (session['user_id'], cat['name'])
    )
    db.execute("DELETE FROM custom_categories WHERE id = ?", (id,))
    db.commit()
    flash(f'Category "{cat["name"]}" deleted. Expenses reassigned to Other.', 'info')
    return redirect(url_for('categories.list_categories'))


@categories_bp.route('/api/categories', endpoint='api_categories')
def api_categories():
    """Return list of custom categories as JSON. Used by expense forms."""
    if 'user_id' not in session:
        return jsonify([])
    db = get_db()
    cats = db.execute(
        "SELECT id, name FROM custom_categories WHERE user_id = ? ORDER BY name",
        (session['user_id'],)
    ).fetchall()
    return jsonify([dict(c) for c in cats])
