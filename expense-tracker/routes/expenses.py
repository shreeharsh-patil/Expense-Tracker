import os
import csv
import io
from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, make_response
from werkzeug.utils import secure_filename
from database.db import get_db
from helpers import validate_amount, cache_clear_user, CURRENCY_CHOICES
from ocr_engine import process_receipt

expenses_bp = Blueprint('expenses', __name__)


@expenses_bp.route('/expenses/add', methods=['GET', 'POST'], endpoint='add_expense')
def add_expense():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    
    # Get user's preferred currency for default
    db = get_db()
    user = db.execute("SELECT preferred_currency FROM users WHERE id = ?", (session['user_id'],)).fetchone()
    preferred_currency = user['preferred_currency'] if user and user['preferred_currency'] else 'INR'
    
    if request.method == 'POST':
        valid, result = validate_amount(request.form.get('amount'))
        if not valid:
            flash(result, 'danger')
            return render_template('add_expense.html', currencies=CURRENCY_CHOICES, preferred_currency=preferred_currency)
        amount = result
        category = request.form.get('category')
        payment_method = request.form.get('payment_method', 'Cash')
        description = request.form.get('description')
        date = request.form.get('date')
        currency = request.form.get('currency', preferred_currency)
        db.execute(
            "INSERT INTO expenses (user_id, amount, category, payment_method, description, date, currency) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (session['user_id'], amount, category, payment_method, description, date, currency)
        )
        db.commit()
        cache_clear_user(session['user_id'])
        flash('Expense added!', 'success')
        return redirect(url_for('dashboard.dashboard'))
    return render_template('add_expense.html', currencies=CURRENCY_CHOICES, preferred_currency=preferred_currency)


@expenses_bp.route('/expenses/<int:id>/edit', methods=['GET', 'POST'], endpoint='edit_expense')
def edit_expense(id):
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    expense = db.execute("SELECT * FROM expenses WHERE id = ? AND user_id = ?", (id, session['user_id'])).fetchone()
    if not expense:
        flash('Expense not found.', 'danger')
        return redirect(url_for('dashboard.dashboard'))
    if request.method == 'POST':
        valid, result = validate_amount(request.form.get('amount'))
        if not valid:
            flash(result, 'danger')
            return render_template('edit_expense.html', expense=expense, currencies=CURRENCY_CHOICES)
        amount = result
        category = request.form.get('category')
        payment_method = request.form.get('payment_method', 'Cash')
        description = request.form.get('description')
        date = request.form.get('date')
        currency = request.form.get('currency', expense['currency'] or 'INR')
        db.execute(
            "UPDATE expenses SET amount = ?, category = ?, payment_method = ?, description = ?, date = ?, currency = ? WHERE id = ?",
            (amount, category, payment_method, description, date, currency, id)
        )
        db.commit()
        cache_clear_user(session['user_id'])
        flash('Expense updated!', 'success')
        return redirect(url_for('dashboard.dashboard'))
    return render_template('edit_expense.html', expense=expense, currencies=CURRENCY_CHOICES)


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
            ocr_result['image_url'] = url_for('static', filename=f'uploads/receipts/{filename}')
        else:
            flash('Invalid file type. Please upload an image.', 'danger')
    return render_template('scan_receipt.html', ocr_result=ocr_result)
