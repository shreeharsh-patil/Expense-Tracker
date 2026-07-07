from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from database.db import get_db
from helpers import validate_amount, cache_clear_user, CURRENCY_CHOICES

income_bp = Blueprint('income', __name__)

INCOME_SOURCES = ['Salary', 'Freelance', 'Business', 'Investments', 'Rent', 'Refund', 'Gift', 'Other']


@income_bp.route('/income/add', methods=['GET', 'POST'], endpoint='add_income')
def add_income():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    
    db = get_db()
    user = db.execute("SELECT preferred_currency FROM users WHERE id = ?", (session['user_id'],)).fetchone()
    preferred_currency = user['preferred_currency'] if user and user['preferred_currency'] else 'INR'
    
    if request.method == 'POST':
        valid, result = validate_amount(request.form.get('amount'))
        if not valid:
            flash(result, 'danger')
            return render_template('add_income.html', sources=INCOME_SOURCES, currencies=CURRENCY_CHOICES, preferred_currency=preferred_currency)
        amount = result
        source = request.form.get('source', 'Other')
        description = request.form.get('description', '')
        date = request.form.get('date')
        currency = request.form.get('currency', preferred_currency)
        db.execute(
            "INSERT INTO income (user_id, amount, source, description, date, currency) VALUES (?, ?, ?, ?, ?, ?)",
            (session['user_id'], amount, source, description, date, currency)
        )
        db.commit()
        cache_clear_user(session['user_id'])
        flash('Income recorded!', 'success')
        return redirect(url_for('dashboard.dashboard'))
    return render_template('add_income.html', sources=INCOME_SOURCES, currencies=CURRENCY_CHOICES, preferred_currency=preferred_currency)


@income_bp.route('/income/<int:id>/edit', methods=['GET', 'POST'], endpoint='edit_income')
def edit_income(id):
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    income = db.execute("SELECT * FROM income WHERE id = ? AND user_id = ?", (id, session['user_id'])).fetchone()
    if not income:
        flash('Income entry not found.', 'danger')
        return redirect(url_for('dashboard.dashboard'))
    if request.method == 'POST':
        valid, result = validate_amount(request.form.get('amount'))
        if not valid:
            flash(result, 'danger')
            return render_template('edit_income.html', income=income, sources=INCOME_SOURCES, currencies=CURRENCY_CHOICES)
        amount = result
        source = request.form.get('source', 'Other')
        description = request.form.get('description', '')
        date = request.form.get('date')
        currency = request.form.get('currency', income['currency'] or 'INR')
        db.execute(
            "UPDATE income SET amount = ?, source = ?, description = ?, date = ?, currency = ? WHERE id = ?",
            (amount, source, description, date, currency, id)
        )
        db.commit()
        cache_clear_user(session['user_id'])
        flash('Income updated!', 'success')
        return redirect(url_for('dashboard.dashboard'))
    return render_template('edit_income.html', income=income, sources=INCOME_SOURCES, currencies=CURRENCY_CHOICES)


@income_bp.route('/income/<int:id>/delete', methods=['POST'], endpoint='delete_income')
def delete_income(id):
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    db.execute("DELETE FROM income WHERE id = ? AND user_id = ?", (id, session['user_id']))
    db.commit()
    cache_clear_user(session['user_id'])
    flash('Income entry deleted.', 'info')
    return redirect(url_for('dashboard.dashboard'))
