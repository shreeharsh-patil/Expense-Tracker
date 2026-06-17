import os
import csv
import io
import json
import secrets
import logging
from datetime import datetime, date, timedelta
from flask import Flask, render_template, request, redirect, url_for, session, flash, g, send_from_directory, make_response, jsonify
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask_wtf.csrf import CSRFProtect
from database.db import get_db, init_db
from ocr_engine import process_receipt
from email_alerts import send_budget_alert, send_weekly_summary

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


app = Flask(__name__)
csrf = CSRFProtect(app)
app.jinja_env.globals.update(zip=zip)

@app.context_processor
def inject_now():
    return {'now_year': datetime.now().year}
# Use a fixed secret key so sessions survive across Vercel serverless instances.
# Falls back to a random key if SECRET_KEY env var is not set.
app.secret_key = os.environ.get('SECRET_KEY')
if not app.secret_key:
    # Use a persistent but unique-to-this-install key if possible, 
    # or a random one (which means sessions will reset on each serverless boot if env is missing)
    app.secret_key = 'spendly-local-dev-secret-key-change-in-prod'
    if not os.environ.get('VERCEL'):
        logger.warning("SECRET_KEY not set. Using insecure default key for local development.")
    else:
        # On Vercel, if SECRET_KEY is missing, we must use a random one for safety, 
        # though it will break sessions between requests if it scales up.
        app.secret_key = secrets.token_hex(32)

import traceback
from werkzeug.exceptions import HTTPException

# ------------------------------------------------------------------ #
# Password Reset Tokens (in-memory, expires after 1 hour)             #
# ------------------------------------------------------------------ #
_reset_tokens = {}
_budget_alerts_sent = {}

def _generate_reset_token(email):
    token = secrets.token_urlsafe(32)
    _reset_tokens[token] = {
        'email': email,
        'expires': datetime.now() + timedelta(hours=1)
    }
    return token

def _verify_reset_token(token):
    data = _reset_tokens.get(token)
    if not data:
        return None
    if datetime.now() > data['expires']:
        _reset_tokens.pop(token, None)
        return None
    return data['email']

def _consume_reset_token(token):
    _reset_tokens.pop(token, None)

# ------------------------------------------------------------------ #
# Rate Limiting (login brute-force protection)                        #
# ------------------------------------------------------------------ #
_login_attempts = {}

def _is_rate_limited(ip):
    now = datetime.now()
    if ip in _login_attempts:
        attempts = [t for t in _login_attempts[ip] if now - t < timedelta(minutes=15)]
        _login_attempts[ip] = attempts
        if len(attempts) >= 10:
            return True
    return False

def _record_login_attempt(ip):
    if ip not in _login_attempts:
        _login_attempts[ip] = []
    _login_attempts[ip].append(datetime.now())

# ------------------------------------------------------------------ #
# Input Validation Helpers                                            #
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
# Recurring Expense Auto-Processing                                   #
# ------------------------------------------------------------------ #

def process_recurring_expenses(user_id):
    """Auto-add recurring expenses as actual expenses when their day_of_month matches current date
    and they haven't been processed for the current month."""
    today = datetime.now()
    current_month_str = today.strftime('%Y-%m')
    
    db = get_db()
    # Select recurring expenses due today or earlier in the month, not yet processed this month
    due = db.execute(
        "SELECT * FROM recurring_expenses WHERE user_id = ? AND day_of_month <= ? AND (last_processed_month IS NULL OR last_processed_month != ?)",
        (user_id, today.day, current_month_str)
    ).fetchall()
    
    for rec in due:
        # Set the expense date to the day specified in the recurring config (within current month)
        expense_date = f"{current_month_str}-{rec['day_of_month']:02d}"
        
        db.execute(
            "INSERT INTO expenses (user_id, amount, category, payment_method, description, date) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, rec['amount'], rec['category'], rec['payment_method'], rec['description'] + " (Auto)", expense_date)
        )
        # Mark as processed
        db.execute(
            "UPDATE recurring_expenses SET last_processed_month = ? WHERE id = ?",
            (current_month_str, rec['id'])
        )
        logger.info(f"Auto-processed recurring expense {rec['id']} for user {user_id}")
    
    if due:
        db.commit()
    return len(due)

# ------------------------------------------------------------------ #
# Weekly Summary Check                                                #
# ------------------------------------------------------------------ #

_weekly_summary_sent = {}

def _check_and_send_weekly_summary(user_id, user_email, user_name):
    """Send weekly summary if not already sent this week (Mondays)."""
    from email_alerts import send_weekly_summary
    
    today = datetime.now()
    # Only send on Mondays
    if today.weekday() != 0:
        return
    
    week_key = f"{user_id}_{today.isocalendar()[0]}_{today.isocalendar()[1]}"
    if _weekly_summary_sent.get(week_key):
        return
    
    db = get_db()
    # Expenses from last 7 days
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

# ------------------------------------------------------------------ #
# Error Handler                                                       #
# ------------------------------------------------------------------ #

@app.errorhandler(Exception)
def handle_exception(e):
    if isinstance(e, HTTPException):
        return e
    
    logger.error(f"Unhandled exception: {e}", exc_info=True)
    
    if app.debug:
        error_trace = traceback.format_exc()
        return "<pre>" + error_trace + "</pre>", 500
    
    return render_template("500.html"), 500
# ------------------------------------------------------------------ #
# Database Helpers                                                   #
# ------------------------------------------------------------------ #

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, 'db', None)
    if db is not None:
        db.close()

@app.cli.command("init-db")
def init_db_command():
    """Clear existing data and create new tables."""
    init_db()
    print("Database initialized.")

# ------------------------------------------------------------------ #
# Routes                                                              #
# ------------------------------------------------------------------ #

@app.route("/")
def landing():
    return render_template("landing.html")

@app.route("/terms")
def terms():
    return render_template("terms.html")

@app.route("/privacy")
def privacy():
    return render_template("privacy.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name")
        email = request.form.get("email")
        password = request.form.get("password")
        db = get_db()
        
        try:
            db.execute(
                "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
                (name, email, generate_password_hash(password))
            )
            db.commit()
            flash("Account created! Please log in.", "success")
            return redirect(url_for("login"))
        except db.IntegrityError:
            flash("Email already exists.", "danger")
            
    return render_template("register.html")

if os.environ.get('VERCEL'):
    app.config['UPLOAD_FOLDER'] = '/tmp/uploads/profile_pics'
    app.config['RECEIPT_FOLDER'] = '/tmp/uploads/receipts'
else:
    app.config['UPLOAD_FOLDER'] = os.path.join(app.static_folder, 'uploads', 'profile_pics')
    app.config['RECEIPT_FOLDER'] = os.path.join(app.static_folder, 'uploads', 'receipts')

app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']
try:
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['RECEIPT_FOLDER'], exist_ok=True)
except Exception as e:
    logger.error(f"Error creating upload directories: {e}")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        
        # Rate limiting
        ip = request.remote_addr or 'unknown'
        if _is_rate_limited(ip):
            flash("Too many login attempts. Please try again in 15 minutes.", "danger")
            return render_template("login.html"), 429
        
        db = get_db()
        user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        
        if user and check_password_hash(user['password_hash'], password):
            session.clear()
            session['user_id'] = user['id']
            session['user_name'] = user['name']
            flash(f"Welcome back, {user['name']}!", "success")
            return redirect(url_for("dashboard"))
        
        _record_login_attempt(ip)
        flash("Invalid credentials.", "danger")
        
    return render_template("login.html")

@app.route("/forgot-password", methods=["GET", "POST"])
def forgot_password():
    if request.method == "POST":
        email = request.form.get("email")
        db = get_db()
        user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        
        if user:
            token = _generate_reset_token(email)
            reset_url = url_for('reset_password', token=token, _external=True)
            
            from email_alerts import send_email
            from email_alerts import _build_budget_alert_html
            
            html = f"""
            <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background: #f7f6f3; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #1a472a, #2e7d32); padding: 2rem; color: white; text-align: center;">
                    <h1 style="margin: 0; font-size: 1.4rem;">Reset Your Password</h1>
                </div>
                <div style="padding: 2rem; text-align: center;">
                    <p style="margin: 0 0 1.5rem; color: #2d2d2d;">Click the button below to reset your Spendly password. This link expires in 1 hour.</p>
                    <a href="{reset_url}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #1a472a, #2e7d32); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
                    <p style="margin-top: 1.5rem; color: #a0a0a0; font-size: 0.75rem;">If you didn't request this, you can safely ignore this email.</p>
                </div>
            </div>
            """
            
            send_email(email, 'Spendly — Password Reset', html)
        
        # Always show success to prevent email enumeration
        flash("If that email is registered, a password reset link has been sent.", "info")
        return redirect(url_for("login"))
    
    return render_template("forgot_password.html")


@app.route("/reset-password/<token>", methods=["GET", "POST"])
def reset_password(token):
    email = _verify_reset_token(token)
    if not email:
        flash("Invalid or expired reset link. Please request a new one.", "danger")
        return redirect(url_for("forgot_password"))
    
    if request.method == "POST":
        password = request.form.get("password")
        confirm = request.form.get("confirm_password")
        
        if not password or len(password) < 6:
            flash("Password must be at least 6 characters.", "danger")
            return render_template("reset_password.html", token=token)
        
        if password != confirm:
            flash("Passwords do not match.", "danger")
            return render_template("reset_password.html", token=token)
        
        db = get_db()
        db.execute(
            "UPDATE users SET password_hash = ? WHERE email = ?",
            (generate_password_hash(password), email)
        )
        db.commit()
        _consume_reset_token(token)
        
        flash("Password reset successfully! Please log in.", "success")
        return redirect(url_for("login"))
    
    return render_template("reset_password.html", token=token)


@app.route("/logout")
def logout():
    session.clear()
    flash("Successfully logged out.", "info")
    return redirect(url_for("landing"))

@app.route("/dashboard")
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for("login"))
    
    db = get_db()
    user_id = session['user_id']
    
    # 0. Auto-process recurring expenses
    try:
        process_recurring_expenses(user_id)
    except Exception as e:
        logger.error(f"Failed to process recurring expenses: {e}")
    
    # 1. Fetch user
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    monthly_budget = user['monthly_budget'] if user else 10000.0

    # 2. Fetch expenses with optional search / category / date-range filters
    search_query   = request.args.get('q', '')
    category_filter = request.args.get('category', '')
    date_from      = request.args.get('date_from', '')
    date_to        = request.args.get('date_to', '')
    
    query  = "SELECT * FROM expenses WHERE user_id = ?"
    params = [user_id]
    
    if search_query:
        query += " AND (description LIKE ? OR category LIKE ?)"
        params.extend([f"%{search_query}%", f"%{search_query}%"])
    
    if category_filter:
        query += " AND category = ?"
        params.append(category_filter)

    if date_from:
        query += " AND date >= ?"
        params.append(date_from)

    if date_to:
        query += " AND date <= ?"
        params.append(date_to)
        
    query += " ORDER BY date DESC"
    
    all_expenses = db.execute(query, params).fetchall()
    total_spent  = sum(e['amount'] for e in all_expenses)

    # 3. Current-month spending for budget doughnut
    current_month_str = datetime.now().strftime("%Y-%m")
    current_month_spent = db.execute(
        "SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND date LIKE ?",
        (user_id, f"{current_month_str}%")
    ).fetchone()['total'] or 0.0

    # 4. Category totals — overall (unfiltered) for pie chart
    categories_data = db.execute(
        "SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY category ORDER BY total DESC",
        (user_id,)
    ).fetchall()
    chart_labels = [c['category'] for c in categories_data]
    chart_values = [c['total'] for c in categories_data]

    # 5. Monthly trends — last 6 months for bar chart
    monthly_trends = db.execute(
        """
        SELECT TO_CHAR(date::date, 'YYYY-MM') as month, SUM(amount) as total
        FROM expenses WHERE user_id = ?
        GROUP BY month ORDER BY month DESC LIMIT 6
        """,
        (user_id,)
    ).fetchall()
    monthly_trends = list(reversed(monthly_trends))
    trend_labels = [r['month'] for r in monthly_trends]
    trend_values = [r['total'] for r in monthly_trends]

    # 6. Spending insights (computed from ALL user expenses)
    all_user_expenses = db.execute(
        "SELECT * FROM expenses WHERE user_id = ? ORDER BY amount DESC",
        (user_id,)
    ).fetchall()

    insights = {}
    if all_user_expenses:
        top_cat_row = db.execute(
            "SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY category ORDER BY total DESC LIMIT 1",
            (user_id,)
        ).fetchone()
        insights['top_category']    = top_cat_row['category'] if top_cat_row else '—'
        insights['top_category_amt'] = top_cat_row['total'] if top_cat_row else 0
        insights['biggest_expense'] = all_user_expenses[0]['amount']
        insights['biggest_desc']    = all_user_expenses[0]['description'] or all_user_expenses[0]['category']
        # Daily average over the date range present in data
        dates = [e['date'] for e in all_user_expenses]
        try:
            d_min = datetime.strptime(min(dates), '%Y-%m-%d')
            d_max = datetime.strptime(max(dates), '%Y-%m-%d')
            num_days = max(1, (d_max - d_min).days + 1)
        except ValueError:
            num_days = 1
        total_all = sum(e['amount'] for e in all_user_expenses)
        insights['daily_avg'] = total_all / num_days

    # 7. Spending Forecast (Projected Total for Current Month)
    now = datetime.now()
    days_in_month = (date(now.year + (now.month // 12), (now.month % 12) + 1, 1) - date(now.year, now.month, 1)).days
    current_day = now.day
    projected_total = (current_month_spent / current_day) * days_in_month if current_day > 0 else 0

    # 8. Payment Method Breakdown (for the new chart/list)
    methods_raw = db.execute(
        "SELECT payment_method, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY payment_method",
        (user_id,)
    ).fetchall()
    methods_labels = [m['payment_method'] for m in methods_raw]
    methods_values = [m['total'] for m in methods_raw]

    # 9. Email alerts: check budget and send alert if needed (cached monthly to prevent SMTP delays)
    user_email = user['email'] if user and 'email' in user.keys() else None
    if user_email and monthly_budget > 0 and current_month_spent > monthly_budget * 0.8:
        alert_key = f"{user_id}_{current_month_str}"
        if not _budget_alerts_sent.get(alert_key):
            try:
                send_budget_alert(
                    user['email'], user['name'], current_month_spent,
                    monthly_budget, projected_total,
                    insights.get('top_category', 'Other'),
                    insights.get('top_category_amt', 0)
                )
                _budget_alerts_sent[alert_key] = True
            except Exception as e:
                logger.error(f"Failed to send budget alert: {e}")

    # 10. Weekly summary (only on Mondays)
    if user_email:
        try:
            _check_and_send_weekly_summary(user_id, user['email'], user['name'])
        except Exception as e:
            logger.error(f"Failed to send weekly summary: {e}")

    return render_template(
        "dashboard.html", 
        expenses=all_expenses, 
        total_spent=total_spent,
        current_month_spent=current_month_spent,
        monthly_budget=monthly_budget,
        chart_labels=chart_labels,
        chart_values=chart_values,
        trend_labels=trend_labels,
        trend_values=trend_values,
        insights=insights,
        date_from=date_from,
        date_to=date_to,
        projected_total=projected_total,
        methods_labels=methods_labels,
        methods_values=methods_values
    )


@app.route("/budget/update", methods=["POST"])
def update_budget():
    if 'user_id' not in session:
        return redirect(url_for("login"))
        
    valid, result = validate_budget(request.form.get("budget"))
    if not valid:
        flash(result, "danger")
        return redirect(url_for("dashboard"))
    
    db = get_db()
    db.execute("UPDATE users SET monthly_budget = ? WHERE id = ?", (result, session['user_id']))
    db.commit()
    flash("Budget updated successfully!", "success")
    return redirect(url_for("dashboard"))

@app.route("/expenses/add", methods=["GET", "POST"])
def add_expense():
    if 'user_id' not in session:
        return redirect(url_for("login"))
    
    if request.method == "POST":
        valid, result = validate_amount(request.form.get("amount"))
        if not valid:
            flash(result, "danger")
            return render_template("add_expense.html")
        
        amount = result
        category = request.form.get("category")
        payment_method = request.form.get("payment_method", "Cash")
        description = request.form.get("description")
        date = request.form.get("date")
        
        db = get_db()
        db.execute(
            "INSERT INTO expenses (user_id, amount, category, payment_method, description, date) VALUES (?, ?, ?, ?, ?, ?)",
            (session['user_id'], amount, category, payment_method, description, date)
        )
        db.commit()
        flash("Expense added!", "success")
        return redirect(url_for("dashboard"))
        
    return render_template("add_expense.html")

@app.route("/expenses/<int:id>/edit", methods=["GET", "POST"])
def edit_expense(id):
    if 'user_id' not in session:
        return redirect(url_for("login"))
        
    db = get_db()
    expense = db.execute("SELECT * FROM expenses WHERE id = ? AND user_id = ?", (id, session['user_id'])).fetchone()
    
    if not expense:
        flash("Expense not found.", "danger")
        return redirect(url_for("dashboard"))
        
    if request.method == "POST":
        valid, result = validate_amount(request.form.get("amount"))
        if not valid:
            flash(result, "danger")
            return render_template("edit_expense.html", expense=expense)
        
        amount = result
        category = request.form.get("category")
        payment_method = request.form.get("payment_method", "Cash")
        description = request.form.get("description")
        date = request.form.get("date")
        
        db.execute(
            "UPDATE expenses SET amount = ?, category = ?, payment_method = ?, description = ?, date = ? WHERE id = ?",
            (amount, category, payment_method, description, date, id)
        )
        db.commit()
        flash("Expense updated!", "success")
        return redirect(url_for("dashboard"))
        
    return render_template("edit_expense.html", expense=expense)

@app.route("/expenses/<int:id>/delete")
def delete_expense(id):
    if 'user_id' not in session:
        return redirect(url_for("login"))
        
    db = get_db()
    db.execute("DELETE FROM expenses WHERE id = ? AND user_id = ?", (id, session['user_id']))
    db.commit()
    flash("Expense deleted.", "info")
    return redirect(url_for("dashboard"))


@app.route("/recurring")
def recurring_list():
    if 'user_id' not in session:
        return redirect(url_for("login"))
    db = get_db()
    recurring = db.execute("SELECT * FROM recurring_expenses WHERE user_id = ?", (session['user_id'],)).fetchall()
    return render_template("recurring.html", recurring=recurring)

@app.route("/recurring/add", methods=["POST"])
def add_recurring():
    if 'user_id' not in session:
        return redirect(url_for("login"))
    valid, result = validate_amount(request.form.get("amount"))
    if not valid:
        flash(result, "danger")
        return redirect(url_for("recurring_list"))
    
    amount = result
    category = request.form.get("category")
    payment_method = request.form.get("payment_method", "Cash")
    description = request.form.get("description")
    day = request.form.get("day_of_month")
    
    try:
        day_int = int(day)
        if day_int < 1 or day_int > 28:
            flash("Day of month must be between 1 and 28.", "danger")
            return redirect(url_for("recurring_list"))
    except (ValueError, TypeError):
        flash("Invalid day of month.", "danger")
        return redirect(url_for("recurring_list"))
    
    db = get_db()
    db.execute(
        "INSERT INTO recurring_expenses (user_id, amount, category, payment_method, description, day_of_month) VALUES (?, ?, ?, ?, ?, ?)",
        (session['user_id'], amount, category, payment_method, description, day_int)
    )
    db.commit()
    flash("Recurring expense scheduled!", "success")
    return redirect(url_for("recurring_list"))

@app.route("/recurring/<int:id>/delete")
def delete_recurring(id):
    if 'user_id' not in session:
        return redirect(url_for("login"))
    db = get_db()
    db.execute("DELETE FROM recurring_expenses WHERE id = ? AND user_id = ?", (id, session['user_id']))
    db.commit()
    flash("Recurring expense removed.", "info")
    return redirect(url_for("recurring_list"))


# ------------------------------------------------------------------ #
# CSV Export                                                          #
# ------------------------------------------------------------------ #

@app.route("/expenses/export")
def export_expenses():
    if 'user_id' not in session:
        return redirect(url_for("login"))

    db = get_db()
    rows = db.execute(
        "SELECT date, category, description, amount FROM expenses WHERE user_id = ? ORDER BY date DESC",
        (session['user_id'],)
    ).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Date', 'Category', 'Description', 'Amount (INR)'])
    for r in rows:
        writer.writerow([r['date'], r['category'], r['description'] or '', f"{r['amount']:.2f}"])

    response = make_response(output.getvalue())
    response.headers['Content-Disposition'] = 'attachment; filename=spendly_expenses.csv'
    response.headers['Content-Type'] = 'text/csv; charset=utf-8'
    return response


@app.route("/profile", methods=["GET", "POST"])
def profile():
    if 'user_id' not in session:
        return redirect(url_for("login"))
    
    db = get_db()
    
    if request.method == "POST":
        new_name = request.form.get("name")
        new_email = request.form.get("email")
        new_phone = request.form.get("phone")
        
        # Start with current avatar URL
        current_data = db.execute("SELECT avatar_url FROM users WHERE id = ?", (session['user_id'],)).fetchone()
        new_avatar_url = current_data['avatar_url'] if current_data else None
        
        # Overwrite only if a file is actually uploaded
        if 'profile_photo' in request.files:
            file = request.files['profile_photo']
            if file and file.filename != '' and allowed_file(file.filename):
                filename = secure_filename(f"user_{session['user_id']}_{file.filename}")
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                new_avatar_url = url_for('static', filename=f'uploads/profile_pics/{filename}')

        if new_name and new_email:
            try:
                db.execute(
                    "UPDATE users SET name = ?, email = ?, phone = ?, avatar_url = ? WHERE id = ?",
                    (new_name, new_email, new_phone, new_avatar_url, session['user_id'])
                )
                db.commit()
                
                # Update session data
                session['user_name'] = new_name
                flash("Profile updated successfully!", "success")
            except db.IntegrityError:
                flash("Email address already in use.", "danger")
        else:
            flash("Name and email are required.", "warning")
        
        return redirect(url_for("profile"))

    # GET: Load current user details
    user = db.execute("SELECT * FROM users WHERE id = ?", (session['user_id'],)).fetchone()
    
    return render_template("profile.html", user=user)


# ------------------------------------------------------------------ #
# Receipt OCR (Image Upload)                                         #
# ------------------------------------------------------------------ #

@app.route("/receipt/scan", methods=["GET", "POST"])
def scan_receipt():
    if 'user_id' not in session:
        return redirect(url_for("login"))
    
    ocr_result = None
    
    if request.method == "POST":
        if 'receipt' not in request.files:
            flash("No receipt image uploaded.", "danger")
            return redirect(request.url)
        
        file = request.files['receipt']
        if file.filename == '':
            flash("No file selected.", "danger")
            return redirect(request.url)
        
        if file and allowed_file(file.filename):
            filename = secure_filename(f"receipt_{session['user_id']}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}")
            filepath = os.path.join(app.config['RECEIPT_FOLDER'], filename)
            file.save(filepath)
            
            # Run OCR
            ocr_result = process_receipt(filepath)
            ocr_result['image_url'] = url_for('static', filename=f'uploads/receipts/{filename}')
        else:
            flash("Invalid file type. Please upload an image.", "danger")
    
    return render_template("scan_receipt.html", ocr_result=ocr_result)


# ------------------------------------------------------------------ #
# Yearly Reports                                                      #
# ------------------------------------------------------------------ #

@app.route("/reports")
def reports():
    if 'user_id' not in session:
        return redirect(url_for("login"))
    
    db = get_db()
    year = request.args.get('year', datetime.now().strftime('%Y'))
    
    # 1. Monthly breakdown for the selected year
    monthly = db.execute("""
        SELECT TO_CHAR(date::date, 'MM') as month, SUM(amount) as total
        FROM expenses WHERE user_id = ? AND TO_CHAR(date::date, 'YYYY') = ?
        GROUP BY month ORDER BY month
    """, (session['user_id'], year)).fetchall()
    
    month_names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    monthly_data = {r['month']: r['total'] for r in monthly}
    report_labels = month_names
    report_values = [monthly_data.get(f"{i+1:02d}", 0) for i in range(12)]
    year_total = sum(report_values)
    
    # 2. Category breakdown for the year
    categories = db.execute("""
        SELECT category, SUM(amount) as total, COUNT(*) as count
        FROM expenses WHERE user_id = ? AND TO_CHAR(date::date, 'YYYY') = ?
        GROUP BY category ORDER BY total DESC
    """, (session['user_id'], year)).fetchall()
    
    cat_labels = [c['category'] for c in categories]
    cat_values = [c['total'] for c in categories]
    
    # 3. Payment method breakdown for the year
    methods = db.execute("""
        SELECT payment_method, SUM(amount) as total
        FROM expenses WHERE user_id = ? AND TO_CHAR(date::date, 'YYYY') = ?
        GROUP BY payment_method ORDER BY total DESC
    """, (session['user_id'], year)).fetchall()
    
    method_labels = [m['payment_method'] for m in methods]
    method_values = [m['total'] for m in methods]
    
    # 4. Available years for the year picker
    years = db.execute("""
        SELECT DISTINCT TO_CHAR(date::date, 'YYYY') as yr
        FROM expenses WHERE user_id = ?
        ORDER BY yr DESC
    """, (session['user_id'],)).fetchall()
    available_years = [y['yr'] for y in years] or [datetime.now().strftime('%Y')]
    
    # 5. Best and worst spending months (robust)
    non_zero = [(i, v) for i, v in enumerate(report_values) if v > 0]
    if non_zero:
        max_month_idx = max(non_zero, key=lambda x: x[1])[0]
        min_month_idx = min(non_zero, key=lambda x: x[1])[0]
        best_month = month_names[min_month_idx]  # lowest spending is best/optimal
        worst_month = month_names[max_month_idx] # highest spending is worst/peak
    else:
        best_month = worst_month = '—'
    
    # 6. Average monthly spend
    active_months = sum(1 for v in report_values if v > 0) or 1
    avg_monthly = year_total / active_months
    
    return render_template("reports.html",
        year=year,
        available_years=available_years,
        month_names=report_labels,
        monthly_totals=report_values,
        total_year=year_total,
        categories=categories,
        labels=cat_labels,
        values=cat_values,
        method_labels=method_labels,
        method_values=method_values,
        best_month=best_month,
        worst_month=worst_month,
        avg_monthly=avg_monthly,
    )
# Ensure database tables are created on Vercel
try:
    with app.app_context():
        init_db()
except Exception as e:
    logger.error(f"Could not initialize database at startup: {e}")

if __name__ == "__main__":
    with app.app_context():
        init_db()
    
    # Use environment variable for debug mode, default to False for safety
    debug_mode = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(debug=debug_mode, port=5001)
