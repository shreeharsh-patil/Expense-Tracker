from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from database.db import get_db
from helpers import CURRENCY_CHOICES, currency_symbol

accounts_bp = Blueprint('accounts', __name__)

ACCOUNT_TYPES = ['bank', 'cash', 'credit_card', 'investment', 'wallet', 'other']


@accounts_bp.route('/accounts', endpoint='list_accounts')
def list_accounts():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    user_id = session['user_id']
    accounts = db.execute(
        "SELECT * FROM accounts WHERE user_id = ? ORDER BY is_active DESC, name ASC",
        (user_id,)
    ).fetchall()

    # Get balances from actual transactions
    for acc in accounts:
        spent = db.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND account_id = ?",
            (user_id, acc['id'])
        ).fetchone()['total'] or 0.0
        earned = db.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = ? AND account_id = ?",
            (user_id, acc['id'])
        ).fetchone()['total'] or 0.0
        acc['calculated_balance'] = earned - spent

    user = db.execute("SELECT preferred_currency FROM users WHERE id = ?", (user_id,)).fetchone()
    preferred_currency = user['preferred_currency'] if user and user['preferred_currency'] else 'INR'

    return render_template('accounts.html', accounts=accounts, account_types=ACCOUNT_TYPES,
                           currencies=CURRENCY_CHOICES, preferred_currency=preferred_currency,
                           currency_symbol=currency_symbol)


@accounts_bp.route('/accounts/add', methods=['POST'], endpoint='add_account')
def add_account():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    name = (request.form.get('name') or '').strip()
    acc_type = request.form.get('type', 'bank')
    currency = request.form.get('currency', 'INR')

    if not name or len(name) < 1:
        flash('Account name is required.', 'danger')
        return redirect(url_for('accounts.list_accounts'))
    if acc_type not in ACCOUNT_TYPES:
        acc_type = 'bank'

    db = get_db()
    db.execute(
        "INSERT INTO accounts (user_id, name, type, currency) VALUES (?, ?, ?, ?)",
        (session['user_id'], name, acc_type, currency)
    )
    db.commit()
    flash(f'Account "{name}" created!', 'success')
    return redirect(url_for('accounts.list_accounts'))


@accounts_bp.route('/accounts/<int:id>/edit', methods=['POST'], endpoint='edit_account')
def edit_account(id):
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    account = db.execute("SELECT * FROM accounts WHERE id = ? AND user_id = ?", (id, session['user_id'])).fetchone()
    if not account:
        flash('Account not found.', 'danger')
        return redirect(url_for('accounts.list_accounts'))

    name = (request.form.get('name') or '').strip()
    acc_type = request.form.get('type', 'bank')
    currency = request.form.get('currency', 'INR')
    is_active = 1 if request.form.get('is_active') else 0

    if not name:
        flash('Account name is required.', 'danger')
        return redirect(url_for('accounts.list_accounts'))

    db.execute(
        "UPDATE accounts SET name = ?, type = ?, currency = ?, is_active = ? WHERE id = ?",
        (name, acc_type, currency, is_active, id)
    )
    db.commit()
    flash('Account updated!', 'success')
    return redirect(url_for('accounts.list_accounts'))


@accounts_bp.route('/accounts/<int:id>/delete', methods=['POST'], endpoint='delete_account')
def delete_account(id):
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    account = db.execute("SELECT * FROM accounts WHERE id = ? AND user_id = ?", (id, session['user_id'])).fetchone()
    if not account:
        flash('Account not found.', 'danger')
        return redirect(url_for('accounts.list_accounts'))

    # Unlink transactions from this account
    db.execute("UPDATE expenses SET account_id = NULL WHERE account_id = ? AND user_id = ?", (id, session['user_id']))
    db.execute("UPDATE income SET account_id = NULL WHERE account_id = ? AND user_id = ?", (id, session['user_id']))
    db.execute("DELETE FROM accounts WHERE id = ?", (id,))
    db.commit()
    flash(f'Account "{account["name"]}" deleted.', 'info')
    return redirect(url_for('accounts.list_accounts'))
