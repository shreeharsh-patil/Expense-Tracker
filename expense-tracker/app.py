import os
import csv
import io
import json
from datetime import datetime, date, timedelta
from flask import Flask, render_template, request, redirect, url_for, session, flash, g, send_from_directory, make_response, jsonify
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from database.db import get_db, init_db, seed_db
from ocr_engine import process_receipt
from email_alerts import send_budget_alert, send_weekly_summary

app = Flask(__name__)
app.secret_key = os.urandom(24)

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

app.config['UPLOAD_FOLDER'] = os.path.join(app.static_folder, 'uploads', 'profile_pics')
app.config['RECEIPT_FOLDER'] = os.path.join(app.static_folder, 'uploads', 'receipts')
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])
if not os.path.exists(app.config['RECEIPT_FOLDER']):
    os.makedirs(app.config['RECEIPT_FOLDER'])

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        db = get_db()
        
        user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        
        if user and check_password_hash(user['password_hash'], password):
            session.clear()
            session['user_id'] = user['id']
            session['user_name'] = user['name']
            flash(f"Welcome back, {user['name']}!", "success")
            return redirect(url_for("dashboard"))
        
        flash("Invalid credentials.", "danger")
        
    return render_template("login.html")

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
    
    # Process any due recurring expenses
    from database.db import process_recurring_expenses
    process_recurring_expenses(session['user_id'])

    # 1. Fetch user budget
    user = db.execute("SELECT monthly_budget FROM users WHERE id = ?", (session['user_id'],)).fetchone()
    monthly_budget = user['monthly_budget'] if user else 10000.0

    # 2. Fetch expenses with optional search / category / date-range filters
    search_query   = request.args.get('q', '')
    category_filter = request.args.get('category', '')
    date_from      = request.args.get('date_from', '')
    date_to        = request.args.get('date_to', '')
    
    query  = "SELECT * FROM expenses WHERE user_id = ?"
    params = [session['user_id']]
    
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
        (session['user_id'], f"{current_month_str}%")
    ).fetchone()['total'] or 0.0

    # 4. Category totals — overall (unfiltered) for pie chart
    categories_data = db.execute(
        "SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY category ORDER BY total DESC",
        (session['user_id'],)
    ).fetchall()
    chart_labels = [c['category'] for c in categories_data]
    chart_values = [c['total'] for c in categories_data]

    # 5. Monthly trends — last 6 months for bar chart
    monthly_trends = db.execute(
        """
        SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
        FROM expenses WHERE user_id = ?
        GROUP BY month ORDER BY month DESC LIMIT 6
        """,
        (session['user_id'],)
    ).fetchall()
    monthly_trends = list(reversed(monthly_trends))
    trend_labels = [r['month'] for r in monthly_trends]
    trend_values = [r['total'] for r in monthly_trends]

    # 6. Spending insights (computed from ALL user expenses)
    all_user_expenses = db.execute(
        "SELECT * FROM expenses WHERE user_id = ? ORDER BY amount DESC",
        (session['user_id'],)
    ).fetchall()

    insights = {}
    if all_user_expenses:
        top_cat_row = db.execute(
            "SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY category ORDER BY total DESC LIMIT 1",
            (session['user_id'],)
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
        except Exception:
            num_days = 1
        total_all = sum(e['amount'] for e in all_user_expenses)
        insights['daily_avg'] = total_all / num_days

    # 7. Spending Forecast (Projected Total for Current Month)
    now = datetime.now()
    days_in_month = (date(now.year + (now.month // 12), (now.month % 12) + 1, 1) - date(now.year, now.month, 1)).days
    current_day = now.day
    projected_total = (current_month_spent / current_day) * days_in_month if current_day > 0 else 0

    # 8. Savings Goals
    goals = db.execute("SELECT * FROM goals WHERE user_id = ?", (session['user_id'],)).fetchall()

    # 9. Payment Method Breakdown (for the new chart/list)
    methods_data = db.execute(
        "SELECT payment_method, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY payment_method",
        (session['user_id'],)
    ).fetchall()

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
        goals=goals,
        methods_data=methods_data
    )

@app.route("/budget/update", methods=["POST"])
def update_budget():
    if 'user_id' not in session:
        return redirect(url_for("login"))
        
    new_budget = request.form.get("budget")
    db = get_db()
    db.execute("UPDATE users SET monthly_budget = ? WHERE id = ?", (new_budget, session['user_id']))
    db.commit()
    flash("Budget updated successfully!", "success")
    return redirect(url_for("dashboard"))

@app.route("/expenses/add", methods=["GET", "POST"])
def add_expense():
    if 'user_id' not in session:
        return redirect(url_for("login"))
    
    if request.method == "POST":
        amount = request.form.get("amount")
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
        amount = request.form.get("amount")
        category = request.form.get("category")
        description = request.form.get("description")
        date = request.form.get("date")
        
        db.execute(
            "UPDATE expenses SET amount = ?, category = ?, description = ?, date = ? WHERE id = ?",
            (amount, category, description, date, id)
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
    amount = request.form.get("amount")
    category = request.form.get("category")
    payment_method = request.form.get("payment_method", "Cash")
    description = request.form.get("description")
    day = request.form.get("day_of_month")
    
    db = get_db()
    db.execute(
        "INSERT INTO recurring_expenses (user_id, amount, category, payment_method, description, day_of_month) VALUES (?, ?, ?, ?, ?, ?)",
        (session['user_id'], amount, category, payment_method, description, day)
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
# Savings Goals                                                      #
# ------------------------------------------------------------------ #

@app.route("/goals/add", methods=["POST"])
def add_goal():
    if 'user_id' not in session:
        return redirect(url_for("login"))
    name = request.form.get("name")
    target = request.form.get("target_amount")
    deadline = request.form.get("deadline")
    
    db = get_db()
    db.execute(
        "INSERT INTO goals (user_id, name, target_amount, deadline) VALUES (?, ?, ?, ?)",
        (session['user_id'], name, target, deadline)
    )
    db.commit()
    flash("New goal set! Every rupee counts.", "success")
    return redirect(url_for("dashboard"))

@app.route("/goals/<int:id>/save", methods=["POST"])
def save_for_goal(id):
    if 'user_id' not in session:
        return redirect(url_for("login"))
    amount = float(request.form.get("amount", 0))
    db = get_db()
    db.execute("UPDATE goals SET current_saved = current_saved + ? WHERE id = ? AND user_id = ?", (amount, id, session['user_id']))
    db.commit()
    flash(f"₹{amount} added to your goal! Keep going.", "success")
    return redirect(url_for("dashboard"))

@app.route("/goals/<int:id>/delete")
def delete_goal(id):
    if 'user_id' not in session:
        return redirect(url_for("login"))
    db = get_db()
    db.execute("DELETE FROM goals WHERE id = ? AND user_id = ?", (id, session['user_id']))
    db.commit()
    flash("Goal removed.", "info")
    return redirect(url_for("dashboard"))


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
        SELECT strftime('%m', date) as month, SUM(amount) as total
        FROM expenses WHERE user_id = ? AND strftime('%Y', date) = ?
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
        FROM expenses WHERE user_id = ? AND strftime('%Y', date) = ?
        GROUP BY category ORDER BY total DESC
    """, (session['user_id'], year)).fetchall()
    
    cat_labels = [c['category'] for c in categories]
    cat_values = [c['total'] for c in categories]
    
    # 3. Payment method breakdown for the year
    methods = db.execute("""
        SELECT payment_method, SUM(amount) as total
        FROM expenses WHERE user_id = ? AND strftime('%Y', date) = ?
        GROUP BY payment_method ORDER BY total DESC
    """, (session['user_id'], year)).fetchall()
    
    method_labels = [m['payment_method'] for m in methods]
    method_values = [m['total'] for m in methods]
    
    # 4. Available years for the year picker
    years = db.execute("""
        SELECT DISTINCT strftime('%Y', date) as yr
        FROM expenses WHERE user_id = ?
        ORDER BY yr DESC
    """, (session['user_id'],)).fetchall()
    available_years = [y['yr'] for y in years] or [datetime.now().strftime('%Y')]
    
    # 5. Month-over-month comparison
    best_month_idx = report_values.index(max(report_values)) if any(report_values) else 0
    worst_month_idx = report_values.index(min(v for v in report_values if v > 0)) if any(v > 0 for v in report_values) else 0
    
    # 6. Average monthly spend
    active_months = sum(1 for v in report_values if v > 0) or 1
    avg_monthly = year_total / active_months
    
    return render_template("reports.html",
        year=year,
        available_years=available_years,
        report_labels=report_labels,
        report_values=report_values,
        year_total=year_total,
        categories=categories,
        cat_labels=cat_labels,
        cat_values=cat_values,
        method_labels=method_labels,
        method_values=method_values,
        best_month=month_names[best_month_idx],
        worst_month=month_names[worst_month_idx],
        avg_monthly=avg_monthly,
    )


# ------------------------------------------------------------------ #
# Email Alerts                                                        #
# ------------------------------------------------------------------ #

@app.route("/alerts/send-budget", methods=["POST"])
def send_budget_alert_route():
    if 'user_id' not in session:
        return redirect(url_for("login"))
    
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (session['user_id'],)).fetchone()
    
    current_month_str = datetime.now().strftime("%Y-%m")
    spent = db.execute(
        "SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND date LIKE ?",
        (session['user_id'], f"{current_month_str}%")
    ).fetchone()['total'] or 0.0
    
    budget = user['monthly_budget']
    
    now = datetime.now()
    days_in_month = (date(now.year + (now.month // 12), (now.month % 12) + 1, 1) - date(now.year, now.month, 1)).days
    projected = (spent / now.day) * days_in_month if now.day > 0 else 0
    
    top_cat = db.execute(
        "SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? AND date LIKE ? GROUP BY category ORDER BY total DESC LIMIT 1",
        (session['user_id'], f"{current_month_str}%")
    ).fetchone()
    
    result = send_budget_alert(
        user['email'], user['name'], spent, budget, projected,
        top_cat['category'] if top_cat else 'Other',
        top_cat['total'] if top_cat else 0
    )
    
    if result['success']:
        flash(f"Budget alert sent to {user['email']}!", "success")
    else:
        flash(f"Failed to send email: {result['error']}", "danger")
    
    return redirect(url_for("dashboard"))


@app.route("/alerts/send-weekly", methods=["POST"])
def send_weekly_summary_route():
    if 'user_id' not in session:
        return redirect(url_for("login"))
    
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (session['user_id'],)).fetchone()
    
    week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    expenses = db.execute(
        "SELECT * FROM expenses WHERE user_id = ? AND date >= ? ORDER BY amount DESC",
        (session['user_id'], week_ago)
    ).fetchall()
    
    week_total = sum(e['amount'] for e in expenses)
    daily_avg = week_total / 7
    expense_count = len(expenses)
    
    top_expenses = [dict(e) for e in expenses[:5]]
    
    result = send_weekly_summary(
        user['email'], user['name'], week_total, daily_avg, expense_count, top_expenses
    )
    
    if result['success']:
        flash(f"Weekly summary sent to {user['email']}!", "success")
    else:
        flash(f"Failed to send email: {result['error']}", "danger")
    
    return redirect(url_for("dashboard"))


@app.route("/alerts/settings")
def alert_settings():
    if 'user_id' not in session:
        return redirect(url_for("login"))
    return render_template("alert_settings.html")


if __name__ == "__main__":
    with app.app_context():
        init_db()
        seed_db()
    app.run(debug=True, port=5001)
