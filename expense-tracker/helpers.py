import os
import secrets
import logging
import threading
from datetime import datetime, timedelta, date
from flask import g
from werkzeug.security import generate_password_hash
from database.db import get_db

logger = logging.getLogger(__name__)

# ------------------------------------------------------------------ #
# Password Reset Tokens (in-memory, expires after 1 hour)             #
# ------------------------------------------------------------------ #
_reset_tokens = {}
_budget_alerts_sent = {}
_recurring_last_run = {}
_weekly_summary_sent = {}
_login_attempts = {}

# ------------------------------------------------------------------ #
# Simple In-Memory Cache (60s TTL) for expensive dashboard aggregates  #
# ------------------------------------------------------------------ #
_cache = {}
_CACHE_MAX_SIZE = 200
_cache_keys_order = []  # Track insertion order for LRU eviction

def cache_get(key, ttl_seconds=60):
    entry = _cache.get(key)
    if entry and (datetime.now() - entry['ts']).total_seconds() < ttl_seconds:
        return entry['data']
    return None

def cache_set(key, data):
    # Evict oldest entry if cache exceeds max size
    if len(_cache) >= _CACHE_MAX_SIZE and key not in _cache:
        oldest_key = _cache_keys_order.pop(0)
        _cache.pop(oldest_key, None)
    # Move key to end of order list (most recently used)
    if key in _cache_keys_order:
        _cache_keys_order.remove(key)
    _cache_keys_order.append(key)
    _cache[key] = {'data': data, 'ts': datetime.now()}

def cache_clear_user(user_id):
    keys_to_delete = [k for k in _cache if isinstance(k, tuple) and k[0] == user_id]
    for k in keys_to_delete:
        _cache.pop(k, None)
        if k in _cache_keys_order:
            _cache_keys_order.remove(k)

# ------------------------------------------------------------------ #
# Async Email Helpers                                                 #
# ------------------------------------------------------------------ #

def send_email_async(email, subject, html):
    from email_alerts import send_email
    try:
        send_email(email, subject, html)
    except Exception as e:
        logger.error(f"Async email send failed: {e}")

def send_budget_alert_async(user_email, user_name, current_spent, budget, projected, top_cat, top_cat_amt):
    from email_alerts import send_budget_alert
    try:
        send_budget_alert(user_email, user_name, current_spent, budget, projected, top_cat, top_cat_amt)
    except Exception as e:
        logger.error(f"Async budget alert failed: {e}")

def send_weekly_summary_async(user_id, user_email, user_name):
    from email_alerts import send_weekly_summary
    try:
        today = datetime.now()
        if today.weekday() != 0:
            return
        week_key = f"{user_id}_{today.isocalendar()[0]}_{today.isocalendar()[1]}"
        if _weekly_summary_sent.get(week_key):
            return
        db = get_db()
        week_ago = (today - timedelta(days=7)).strftime('%Y-%m-%d')
        week_expenses = db.execute(
            "SELECT * FROM expenses WHERE user_id = ? AND date >= ? ORDER BY amount DESC",
            (user_id, week_ago)
        ).fetchall()
        if not week_expenses:
            return
        week_total = sum(e['amount'] for e in week_expenses)
        expense_count = len(week_expenses)
        daily_avg = week_total / 7
        top_expenses = [dict(e) for e in week_expenses[:5]]
        send_weekly_summary(user_email, user_name, week_total, daily_avg, expense_count, top_expenses)
        _weekly_summary_sent[week_key] = True
        logger.info(f"Weekly summary sent to user {user_id}")
    except Exception as e:
        logger.error(f"Async weekly summary failed: {e}")

# ------------------------------------------------------------------ #
# Token Management                                                    #
# ------------------------------------------------------------------ #

def generate_reset_token(email):
    token = secrets.token_urlsafe(32)
    _reset_tokens[token] = {
        'email': email,
        'expires': datetime.now() + timedelta(hours=1)
    }
    return token

def verify_reset_token(token):
    data = _reset_tokens.get(token)
    if not data:
        return None
    if datetime.now() > data['expires']:
        _reset_tokens.pop(token, None)
        return None
    return data['email']

def consume_reset_token(token):
    _reset_tokens.pop(token, None)

# ------------------------------------------------------------------ #
# Email OTP Verification                                              #
# ------------------------------------------------------------------ #
_otp_cooldowns = {}

def generate_otp(email):
    """Generate a 6-digit OTP for the given email. Returns the OTP string.
    Rate-limited to one OTP per 30 seconds per email.
    """
    now = datetime.now()
    last_sent = _otp_cooldowns.get(email)
    if last_sent and (now - last_sent).total_seconds() < 30:
        return None  # Rate-limited; caller can check remaining wait time separately.

    otp = f"{secrets.randbelow(900000) + 100000}"
    _otp_cooldowns[email] = now
    return otp

def get_otp_remaining_cooldown(email):
    """Return seconds remaining before the next OTP can be sent (0 if ready)."""
    now = datetime.now()
    last_sent = _otp_cooldowns.get(email)
    if not last_sent:
        return 0
    elapsed = (now - last_sent).total_seconds()
    remaining = max(0, 30 - int(elapsed))
    return remaining

def send_otp_email(email, otp, name):
    """Send the OTP verification email asynchronously using branded template."""
    from email_alerts import send_otp_email as _send_otp
    try:
        _send_otp(to_email=email, name=name, otp=otp)
    except Exception as e:
        logger.error(f"Async OTP email failed: {e}")

# ------------------------------------------------------------------ #
# Rate Limiting                                                       #
# ------------------------------------------------------------------ #

def is_rate_limited(ip):
    now = datetime.now()
    if ip in _login_attempts:
        attempts = [t for t in _login_attempts[ip] if now - t < timedelta(minutes=15)]
        _login_attempts[ip] = attempts
        if len(attempts) >= 10:
            return True
    return False

def record_login_attempt(ip):
    if ip not in _login_attempts:
        _login_attempts[ip] = []
    _login_attempts[ip].append(datetime.now())

# ------------------------------------------------------------------ #
# Currency Configuration                                              #
# ------------------------------------------------------------------ #

SUPPORTED_CURRENCIES = {
    'INR': {'symbol': '₹', 'name': 'Indian Rupee', 'locale': 'en-IN'},
    'USD': {'symbol': '$', 'name': 'US Dollar', 'locale': 'en-US'},
    'EUR': {'symbol': '€', 'name': 'Euro', 'locale': 'de-DE'},
    'GBP': {'symbol': '£', 'name': 'British Pound', 'locale': 'en-GB'},
    'JPY': {'symbol': '¥', 'name': 'Japanese Yen', 'locale': 'ja-JP'},
    'AUD': {'symbol': 'A$', 'name': 'Australian Dollar', 'locale': 'en-AU'},
    'CAD': {'symbol': 'C$', 'name': 'Canadian Dollar', 'locale': 'en-CA'},
    'SGD': {'symbol': 'S$', 'name': 'Singapore Dollar', 'locale': 'en-SG'},
    'AED': {'symbol': 'د.إ', 'name': 'UAE Dirham', 'locale': 'ar-AE'},
    'CHF': {'symbol': 'CHF', 'name': 'Swiss Franc', 'locale': 'de-CH'},
    'CNY': {'symbol': '¥', 'name': 'Chinese Yuan', 'locale': 'zh-CN'},
}

CURRENCY_CHOICES = sorted(SUPPORTED_CURRENCIES.keys())


def currency_symbol(code):
    """Return the currency symbol for a given currency code."""
    return SUPPORTED_CURRENCIES.get(code, {}).get('symbol', '₹')


def format_amount(amount, currency='INR'):
    """Format an amount with the appropriate currency symbol.
    Returns a string like "₹1,234.56" or "$1,234.56".
    """
    sym = currency_symbol(currency)
    if amount is None:
        amount = 0
    # Format with 2 decimal places, comma-separated
    formatted = f"{float(amount):,.2f}"
    return f"{sym}{formatted}"


def format_amount_no_decimal(amount, currency='INR'):
    """Format an amount as integer with currency symbol."""
    sym = currency_symbol(currency)
    if amount is None:
        amount = 0
    formatted = f"{float(amount):,.0f}"
    return f"{sym}{formatted}"

# ------------------------------------------------------------------ #
# Validation Helpers                                                  #
# ------------------------------------------------------------------ #

def validate_amount(val):
    try:
        v = float(val)
        if v <= 0:
            return (False, "Amount must be greater than zero.")
        if v > 999999999:
            return (False, "Amount is too large.")
        return (True, v)
    except (ValueError, TypeError):
        return (False, "Invalid amount.")

def validate_budget(val):
    try:
        v = float(val)
        if v < 0:
            return (False, "Budget cannot be negative.")
        if v > 999999999:
            return (False, "Budget is too large.")
        return (True, v)
    except (ValueError, TypeError):
        return (False, "Invalid budget.")

# ------------------------------------------------------------------ #
# Recurring Expense Processing                                        #
# ------------------------------------------------------------------ #

def should_process_recurring(user_id):
    now = datetime.now()
    last = _recurring_last_run.get(user_id)
    if last and (now - last).total_seconds() < 3600:
        return False
    _recurring_last_run[user_id] = now
    return True

def process_recurring_expenses(user_id):
    today = datetime.now()
    current_month_str = today.strftime('%Y-%m')
    db = get_db()
    recurring = db.execute(
        "SELECT * FROM recurring_expenses WHERE user_id = ?",
        (user_id,)
    ).fetchall()
    processed_count = 0
    for rec in recurring:
        last_processed = rec['last_processed_month']
        if not last_processed:
            if rec['day_of_month'] <= today.day:
                expense_date = f"{current_month_str}-{rec['day_of_month']:02d}"
                db.execute(
                    "INSERT INTO expenses (user_id, amount, category, payment_method, description, date) VALUES (?, ?, ?, ?, ?, ?)",
                    (user_id, rec['amount'], rec['category'], rec['payment_method'], rec['description'] + " (Auto)", expense_date)
                )
                db.execute(
                    "UPDATE recurring_expenses SET last_processed_month = ? WHERE id = ?",
                    (current_month_str, rec['id'])
                )
                processed_count += 1
            continue
        try:
            last_date = datetime.strptime(last_processed, '%Y-%m')
        except ValueError:
            last_date = today
        temp_date = last_date
        while True:
            next_month_day = temp_date + timedelta(days=32)
            temp_date = datetime(next_month_day.year, next_month_day.month, 1)
            if temp_date.year > today.year or (temp_date.year == today.year and temp_date.month > today.month):
                break
            temp_month_str = temp_date.strftime('%Y-%m')
            is_current_month = (temp_date.year == today.year and temp_date.month == today.month)
            if not is_current_month or rec['day_of_month'] <= today.day:
                expense_date = f"{temp_month_str}-{rec['day_of_month']:02d}"
                db.execute(
                    "INSERT INTO expenses (user_id, amount, category, payment_method, description, date) VALUES (?, ?, ?, ?, ?, ?)",
                    (user_id, rec['amount'], rec['category'], rec['payment_method'], rec['description'] + " (Auto)", expense_date)
                )
                db.execute(
                    "UPDATE recurring_expenses SET last_processed_month = ? WHERE id = ?",
                    (temp_month_str, rec['id'])
                )
                processed_count += 1
    if processed_count > 0:
        db.commit()
    return processed_count
