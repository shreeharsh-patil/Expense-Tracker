import os
import csv
import io
from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, make_response
from werkzeug.utils import secure_filename
from database.db import get_db
from helpers import validate_amount, cache_clear_user, CURRENCY_CHOICES
from ocr_engine import process_receipt
from routes.rules import apply_smart_rules

expenses_bp = Blueprint('expenses', __name__)


@expenses_bp.route('/expenses/add', methods=['GET', 'POST'], endpoint='add_expense')
def add_expense():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    
    # Get user's preferred currency for default
    db = get_db()
    user = db.execute("SELECT preferred_currency FROM users WHERE id = ?", (session['user_id'],)).fetchone()
    preferred_currency = user['preferred_currency'] if user and user['preferred_currency'] else 'INR'
    
    # Get user's accounts for account selector
    accounts = db.execute("SELECT id, name, type, currency FROM accounts WHERE user_id = ? AND is_active = 1 ORDER BY name", (session['user_id'],)).fetchall()
    # Get custom categories
    custom_cats = db.execute("SELECT name FROM custom_categories WHERE user_id = ? ORDER BY name", (session['user_id'],)).fetchall()
    custom_category_names = [c['name'] for c in custom_cats]
    
    if request.method == 'POST':
        valid, result = validate_amount(request.form.get('amount'))
        if not valid:
            flash(result, 'danger')
            return render_template('add_expense.html', currencies=CURRENCY_CHOICES, preferred_currency=preferred_currency, accounts=accounts)
        amount = result
        category = request.form.get('category')
        payment_method = request.form.get('payment_method', 'Cash')
        description = request.form.get('description')
        date = request.form.get('date')
        currency = request.form.get('currency', preferred_currency)
        account_id = request.form.get('account_id', type=int)
        tag_ids = request.form.getlist('tag_ids')
        # Apply smart rules
        category, tag_ids = apply_smart_rules(session['user_id'], description, category, [int(t) for t in tag_ids if t.isdigit()] if tag_ids else None)
        db.execute(
            "INSERT INTO expenses (user_id, amount, category, payment_method, description, date, currency, account_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (session['user_id'], amount, category, payment_method, description, date, currency, account_id)
        )
        expense_id = db.last_insert_id
        # Save tags
        if tag_ids:
            for tid in tag_ids:
                try:
                    db.execute("INSERT INTO expense_tags (expense_id, tag_id) VALUES (?, ?)", (expense_id, int(tid)))
                except:
                    pass
        db.commit()
        cache_clear_user(session['user_id'])
        flash('Expense added!', 'success')
        return redirect(url_for('dashboard.dashboard'))
    # Get tags for the form
    tags = db.execute("SELECT id, name, color FROM tags WHERE user_id = ? ORDER BY name", (session['user_id'],)).fetchall()
    return render_template('add_expense.html', currencies=CURRENCY_CHOICES, preferred_currency=preferred_currency, accounts=accounts, tags=tags, custom_categories=custom_category_names)


@expenses_bp.route('/expenses/<int:id>/edit', methods=['GET', 'POST'], endpoint='edit_expense')
def edit_expense(id):
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    expense = db.execute("SELECT * FROM expenses WHERE id = ? AND user_id = ?", (id, session['user_id'])).fetchone()
    if not expense:
        flash('Expense not found.', 'danger')
        return redirect(url_for('dashboard.dashboard'))
    accounts = db.execute("SELECT id, name, type FROM accounts WHERE user_id = ? AND is_active = 1 ORDER BY name", (session['user_id'],)).fetchall()
    tags = db.execute("SELECT id, name, color FROM tags WHERE user_id = ? ORDER BY name", (session['user_id'],)).fetchall()
    selected_tags = db.execute("SELECT tag_id FROM expense_tags WHERE expense_id = ?", (id,)).fetchall()
    selected_tag_ids = {r['tag_id'] for r in selected_tags}
    custom_cats = db.execute("SELECT name FROM custom_categories WHERE user_id = ? ORDER BY name", (session['user_id'],)).fetchall()
    custom_category_names = [c['name'] for c in custom_cats]
    if request.method == 'POST':
        valid, result = validate_amount(request.form.get('amount'))
        if not valid:
            flash(result, 'danger')
            return render_template('edit_expense.html', expense=expense, currencies=CURRENCY_CHOICES, accounts=accounts, tags=tags, selected_tag_ids=selected_tag_ids, custom_categories=custom_category_names)
        amount = result
        category = request.form.get('category')
        payment_method = request.form.get('payment_method', 'Cash')
        description = request.form.get('description')
        date = request.form.get('date')
        currency = request.form.get('currency', expense['currency'] or 'INR')
        account_id = request.form.get('account_id', type=int)
        db.execute(
            "UPDATE expenses SET amount = ?, category = ?, payment_method = ?, description = ?, date = ?, currency = ?, account_id = ? WHERE id = ?",
            (amount, category, payment_method, description, date, currency, account_id, id)
        )
        # Update tags
        db.execute("DELETE FROM expense_tags WHERE expense_id = ?", (id,))
        tag_ids = request.form.getlist('tag_ids')
        for tid in tag_ids:
            try:
                db.execute("INSERT INTO expense_tags (expense_id, tag_id) VALUES (?, ?)", (id, int(tid)))
            except:
                pass
        db.commit()
        cache_clear_user(session['user_id'])
        flash('Expense updated!', 'success')
        return redirect(url_for('dashboard.dashboard'))
    return render_template('edit_expense.html', expense=expense, currencies=CURRENCY_CHOICES, accounts=accounts, tags=tags, selected_tag_ids=selected_tag_ids, custom_categories=custom_category_names)


@expenses_bp.route('/expenses/<int:id>/delete', methods=['POST'], endpoint='delete_expense')
def delete_expense(id):
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    db.execute("DELETE FROM expenses WHERE id = ? AND user_id = ?", (id, session['user_id']))
    db.commit()
    cache_clear_user(session['user_id'])
    flash('Expense deleted.', 'info')
    return redirect(url_for('dashboard.dashboard'))


@expenses_bp.route('/recurring', endpoint='recurring_list')
def recurring_list():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    recurring = db.execute("SELECT * FROM recurring_expenses WHERE user_id = ?", (session['user_id'],)).fetchall()
    user = db.execute("SELECT preferred_currency FROM users WHERE id = ?", (session['user_id'],)).fetchone()
    preferred_currency = user['preferred_currency'] if user and user['preferred_currency'] else 'INR'
    return render_template('recurring.html', recurring=recurring, currencies=CURRENCY_CHOICES, preferred_currency=preferred_currency)


@expenses_bp.route('/recurring/add', methods=['POST'], endpoint='add_recurring')
def add_recurring():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    
    # Get user's preferred currency
    db = get_db()
    user = db.execute("SELECT preferred_currency FROM users WHERE id = ?", (session['user_id'],)).fetchone()
    preferred_currency = user['preferred_currency'] if user and user['preferred_currency'] else 'INR'
    
    valid, result = validate_amount(request.form.get('amount'))
    if not valid:
        flash(result, 'danger')
        return redirect(url_for('expenses.recurring_list'))
    amount = result
    category = request.form.get('category')
    payment_method = request.form.get('payment_method', 'Cash')
    description = request.form.get('description')
    day = request.form.get('day_of_month')
    currency = request.form.get('currency', preferred_currency)
    try:
        day_int = int(day)
        if day_int < 1 or day_int > 28:
            flash('Day of month must be between 1 and 28.', 'danger')
            return redirect(url_for('expenses.recurring_list'))
    except (ValueError, TypeError):
        flash('Invalid day of month.', 'danger')
        return redirect(url_for('expenses.recurring_list'))
    db = get_db()
    db.execute(
        "INSERT INTO recurring_expenses (user_id, amount, category, payment_method, description, day_of_month, currency) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (session['user_id'], amount, category, payment_method, description, day_int, currency)
    )
    db.commit()
    cache_clear_user(session['user_id'])
    flash('Recurring expense scheduled!', 'success')
    return redirect(url_for('expenses.recurring_list'))


@expenses_bp.route('/recurring/<int:id>/delete', methods=['POST'], endpoint='delete_recurring')
def delete_recurring(id):
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    db.execute("DELETE FROM recurring_expenses WHERE id = ? AND user_id = ?", (id, session['user_id']))
    db.commit()
    cache_clear_user(session['user_id'])
    flash('Recurring expense removed.', 'info')
    return redirect(url_for('expenses.recurring_list'))


@expenses_bp.route('/expenses/export', endpoint='export_expenses')
def export_expenses():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    rows = db.execute(
        "SELECT date, category, description, amount, currency FROM expenses WHERE user_id = ? ORDER BY date DESC",
        (session['user_id'],)
    ).fetchall()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Date', 'Category', 'Description', 'Amount', 'Currency'])
    for r in rows:
        currency = r.get('currency', 'INR') if hasattr(r, 'get') else 'INR'
        writer.writerow([r['date'], r['category'], r['description'] or '', f"{r['amount']:.2f}", currency])
    response = make_response(output.getvalue())
    response.headers['Content-Disposition'] = 'attachment; filename=spendly_expenses.csv'
    response.headers['Content-Type'] = 'text/csv; charset=utf-8'
    return response


@expenses_bp.route('/receipt/scan', methods=['GET', 'POST'], endpoint='scan_receipt')
def scan_receipt():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    ocr_result = None
    if request.method == 'POST':
        if 'receipt' not in request.files:
            flash('No receipt image uploaded.', 'danger')
            return redirect(request.url)
        file = request.files['receipt']
        if file.filename == '':
            flash('No file selected.', 'danger')
            return redirect(request.url)
        if file:
            from flask import current_app
            filename = secure_filename(f"receipt_{session['user_id']}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}")
            filepath = os.path.join(current_app.config['RECEIPT_FOLDER'], filename)
            os.makedirs(current_app.config['RECEIPT_FOLDER'], exist_ok=True)
            file.save(filepath)
            ocr_result = process_receipt(filepath)
            if ocr_result is None:
                ocr_result = {}
            ocr_result['image_url'] = url_for('static', filename=f'uploads/receipts/{filename}')
            
            # Save receipt record to database
            db = get_db()
            db.execute(
                "INSERT INTO receipts (user_id, filename, original_name, filepath, amount, category, raw_text) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (session['user_id'], filename, file.filename, filepath,
                 ocr_result.get('amount'), ocr_result.get('category'), ocr_result.get('raw_text', ''))
            )
            db.commit()
        else:
            flash('Invalid file type. Please upload an image.', 'danger')
    return render_template('scan_receipt.html', ocr_result=ocr_result)


@expenses_bp.route('/receipts/gallery', endpoint='receipt_gallery')
def receipt_gallery():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    user_id = session['user_id']
    page = request.args.get('page', 1, type=int)
    per_page = 20
    
    count = db.execute("SELECT COUNT(*) as cnt FROM receipts WHERE user_id = ?", (user_id,)).fetchone()['cnt'] or 0
    total_pages = max(1, (count + per_page - 1) // per_page)
    page = max(1, min(page, total_pages))
    offset = (page - 1) * per_page
    
    receipts = db.execute(
        "SELECT r.*, e.description as expense_desc, e.amount as expense_amount, e.date as expense_date "
        "FROM receipts r LEFT JOIN expenses e ON r.expense_id = e.id "
        "WHERE r.user_id = ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?",
        (user_id, per_page, offset)
    ).fetchall()
    
    user = db.execute("SELECT preferred_currency FROM users WHERE id = ?", (user_id,)).fetchone()
    preferred_currency = user['preferred_currency'] if user and user['preferred_currency'] else 'INR'
    
    # Recent expenses for linking dropdown
    recent_expenses = db.execute(
        "SELECT id, description, category, date FROM expenses WHERE user_id = ? ORDER BY date DESC LIMIT 20",
        (user_id,)
    ).fetchall()
    
    return render_template('receipt_gallery.html', receipts=receipts, page=page, total_pages=total_pages, total_receipts=count, preferred_currency=preferred_currency, recent_expenses=recent_expenses)


@expenses_bp.route('/receipts/<int:id>/link-expense', methods=['POST'], endpoint='link_receipt')
def link_receipt(id):
    """Link a receipt to an existing expense."""
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    expense_id = request.form.get('expense_id', type=int)
    if not expense_id:
        flash('Invalid expense ID.', 'danger')
        return redirect(url_for('expenses.receipt_gallery'))
    db = get_db()
    receipt = db.execute("SELECT * FROM receipts WHERE id = ? AND user_id = ?", (id, session['user_id'])).fetchone()
    if not receipt:
        flash('Receipt not found.', 'danger')
        return redirect(url_for('expenses.receipt_gallery'))
    expense = db.execute("SELECT * FROM expenses WHERE id = ? AND user_id = ?", (expense_id, session['user_id'])).fetchone()
    if not expense:
        flash('Expense not found.', 'danger')
        return redirect(url_for('expenses.receipt_gallery'))
    db.execute("UPDATE receipts SET expense_id = ? WHERE id = ?", (expense_id, id))
    db.commit()
    flash('Receipt linked to expense!', 'success')
    return redirect(url_for('expenses.receipt_gallery'))


@expenses_bp.route('/receipts/<int:id>/delete', methods=['POST'], endpoint='delete_receipt')
def delete_receipt(id):
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    receipt = db.execute("SELECT * FROM receipts WHERE id = ? AND user_id = ?", (id, session['user_id'])).fetchone()
    if not receipt:
        flash('Receipt not found.', 'danger')
        return redirect(url_for('expenses.receipt_gallery'))
    # Delete the file
    try:
        if os.path.exists(receipt['filepath']):
            os.remove(receipt['filepath'])
    except Exception as e:
        pass
    db.execute("DELETE FROM receipts WHERE id = ?", (id,))
    db.commit()
    flash('Receipt deleted.', 'info')
    return redirect(url_for('expenses.receipt_gallery'))
