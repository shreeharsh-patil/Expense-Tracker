import threading
from datetime import datetime, date
from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from database.db import get_db
import json
from helpers import (
    cache_get, cache_set, cache_clear_user, validate_budget,
    should_process_recurring, process_recurring_expenses,
    send_budget_alert_async, send_weekly_summary_async,
    currency_symbol, format_amount
)

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/dashboard', endpoint='dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))

    db = get_db()
    user_id = session['user_id']
    now = datetime.now()
    current_month_str = now.strftime('%Y-%m')

    # 0. Auto-process recurring expenses (limit to once per hour)
    if should_process_recurring(user_id):
        try:
            process_recurring_expenses(user_id)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to process recurring expenses: {e}")

    # 1. Fetch user
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    monthly_budget = user['monthly_budget'] if user else 10000.0
    user_email = user['email'] if user and 'email' in user.keys() else None
    preferred_currency = user['preferred_currency'] if user and user.get('preferred_currency') else 'INR'

    # 2. Expenses with pagination (25 per page)
    search_query = request.args.get('q', '')
    category_filter = request.args.get('category', '')
    tag_filter = request.args.get('tag', '')
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')
    page = request.args.get('page', 1, type=int)
    per_page = 25

    # Build query based on filters
    if tag_filter:
        # Need to JOIN with expense_tags for tag filtering
        base_query = "SELECT e.* FROM expenses e"
        base_count = "SELECT COUNT(DISTINCT e.id) as cnt FROM expenses e"
        join_clause = " INNER JOIN expense_tags et ON e.id = et.expense_id INNER JOIN tags t ON et.tag_id = t.id"
        query = base_query + join_clause + " WHERE e.user_id = ?"
        count_query = base_count + join_clause + " WHERE e.user_id = ?"
        params = [user_id]
        count_params = [user_id]
        tag_cond = " AND (t.name = ? OR t.id = ?)"
        query += tag_cond
        count_query += tag_cond
        params.extend([tag_filter, tag_filter])
        count_params.extend([tag_filter, tag_filter])
    else:
        query = "SELECT * FROM expenses WHERE user_id = ?"
        count_query = "SELECT COUNT(*) as cnt FROM expenses WHERE user_id = ?"
        params = [user_id]
        count_params = [user_id]

    if search_query:
        cond = " AND (description LIKE ? OR category LIKE ?)"
        query += cond
        count_query += cond
        params.extend([f"%{search_query}%", f"%{search_query}%"])
        count_params.extend([f"%{search_query}%", f"%{search_query}%"])
    if category_filter:
        query += " AND e.category = ?" if tag_filter else " AND category = ?"
        count_query += " AND e.category = ?" if tag_filter else " AND category = ?"
        params.append(category_filter)
        count_params.append(category_filter)
    if date_from:
        query += " AND e.date >= ?" if tag_filter else " AND date >= ?"
        count_query += " AND e.date >= ?" if tag_filter else " AND date >= ?"
        params.append(date_from)
        count_params.append(date_from)
    if date_to:
        query += " AND e.date <= ?" if tag_filter else " AND date <= ?"
        count_query += " AND e.date <= ?" if tag_filter else " AND date <= ?"
        params.append(date_to)
        count_params.append(date_to)

    # Total count for pagination
    total_count = db.execute(count_query, count_params).fetchone()['cnt'] or 0
    total_pages = max(1, (total_count + per_page - 1) // per_page)
    page = max(1, min(page, total_pages))
    offset = (page - 1) * per_page

    query += " ORDER BY e.date DESC" if tag_filter else " ORDER BY date DESC"
    query += " LIMIT ? OFFSET ?"
    params.extend([per_page, offset])
    all_expenses = db.execute(query, params).fetchall()
    
    # Fetch tags for each expense
    expense_ids = [e['id'] for e in all_expenses]
    expense_tags = {}  # expense_id -> list of tag dicts
    if expense_ids:
        for eid in expense_ids:
            tag_rows = db.execute(
                "SELECT t.id, t.name, t.color FROM tags t INNER JOIN expense_tags et ON t.id = et.tag_id WHERE et.expense_id = ?",
                (eid,)
            ).fetchall()
            expense_tags[eid] = [dict(r) for r in tag_rows]
    
    total_spent = 0
    if search_query or category_filter or date_from or date_to or tag_filter:
        # Build total spent query matching the filters
        if tag_filter:
            total_query = "SELECT COALESCE(SUM(e.amount), 0) as total FROM expenses e INNER JOIN expense_tags et ON e.id = et.expense_id INNER JOIN tags t ON et.tag_id = t.id WHERE e.user_id = ?"
            total_params = [user_id]
            total_query += " AND (t.name = ? OR t.id = ?)"
            total_params.extend([tag_filter, tag_filter])
        else:
            total_query = "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ?"
            total_params = [user_id]
            
        if search_query:
            cond = " AND (description LIKE ? OR category LIKE ?)"
            total_query += cond
            total_params.extend([f"%{search_query}%", f"%{search_query}%"])
        if category_filter:
            total_query += " AND e.category = ?" if tag_filter else " AND category = ?"
            total_params.append(category_filter)
        if date_from:
            total_query += " AND e.date >= ?" if tag_filter else " AND date >= ?"
            total_params.append(date_from)
        if date_to:
            total_query += " AND e.date <= ?" if tag_filter else " AND date <= ?"
            total_params.append(date_to)
        total_row = db.execute(total_query, total_params).fetchone()
        total_spent = total_row['total'] if total_row else 0

    # 3. Current-month spending
    current_month_spent = db.execute(
        "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND date LIKE ?",
        (user_id, f"{current_month_str}%")
    ).fetchone()['total'] or 0.0

    # 4. Current-month income
    current_month_income = db.execute(
        "SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = ? AND date LIKE ?",
        (user_id, f"{current_month_str}%")
    ).fetchone()['total'] or 0.0

    net_savings = current_month_income - current_month_spent

    # 5. Category totals (cached)
    categories_data = cache_get((user_id, 'categories'))
    if categories_data is None:
        categories_data = db.execute(
            "SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY category ORDER BY total DESC",
            (user_id,)
        ).fetchall()
        cache_set((user_id, 'categories'), categories_data)
    chart_labels = [c['category'] for c in categories_data]
    chart_values = [c['total'] for c in categories_data]

    # 6. Monthly trends (cached)
    monthly_trends = cache_get((user_id, 'trends'))
    if monthly_trends is None:
        monthly_trends = db.execute(
            "SELECT strftime('%Y-%m', date) as month, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY month ORDER BY month DESC LIMIT 6",
            (user_id,)
        ).fetchall()
        monthly_trends = list(reversed(monthly_trends))
        cache_set((user_id, 'trends'), monthly_trends)
    trend_labels = [r['month'] for r in monthly_trends]
    trend_values = [r['total'] for r in monthly_trends]

    # 7. Income monthly trends (for chart overlay)
    income_trends = cache_get((user_id, 'income_trends'))
    if income_trends is None:
        income_trends = db.execute(
            "SELECT strftime('%Y-%m', date) as month, SUM(amount) as total FROM income WHERE user_id = ? GROUP BY month ORDER BY month DESC LIMIT 6",
            (user_id,)
        ).fetchall()
        income_trends_dict = {r['month']: r['total'] for r in income_trends}
        # Align with expense trend months
        income_trend_values = [income_trends_dict.get(m, 0) for m in trend_labels]
        cache_set((user_id, 'income_trends'), income_trend_values)

    # 8. Payment Method Breakdown (cached)
    methods_raw = cache_get((user_id, 'methods'))
    if methods_raw is None:
        methods_raw = db.execute(
            "SELECT payment_method, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY payment_method",
            (user_id,)
        ).fetchall()
        cache_set((user_id, 'methods'), methods_raw)
    methods_labels = [m['payment_method'] for m in methods_raw]
    methods_values = [m['total'] for m in methods_raw]

    # 9. Insights
    insights = {}
    if categories_data:
        insights['top_category'] = categories_data[0]['category']
        insights['top_category_amt'] = categories_data[0]['total']
    else:
        insights['top_category'] = '—'
        insights['top_category_amt'] = 0

    biggest = db.execute(
        "SELECT amount, description, category FROM expenses WHERE user_id = ? ORDER BY amount DESC LIMIT 1",
        (user_id,)
    ).fetchone()
    if biggest:
        insights['biggest_expense'] = biggest['amount']
        insights['biggest_desc'] = biggest['description'] or biggest['category']
    else:
        insights['biggest_expense'] = 0
        insights['biggest_desc'] = '—'

    date_range = db.execute(
        "SELECT MIN(date) as min_d, MAX(date) as max_d FROM expenses WHERE user_id = ?",
        (user_id,)
    ).fetchone()
    if date_range and date_range['min_d'] and date_range['max_d']:
        try:
            d_min = datetime.strptime(date_range['min_d'], '%Y-%m-%d')
            d_max = datetime.strptime(date_range['max_d'], '%Y-%m-%d')
            num_days = max(1, (d_max - d_min).days + 1)
            total_all = sum(c['total'] for c in categories_data) if categories_data else 0
            insights['daily_avg'] = total_all / num_days
        except ValueError:
            insights['daily_avg'] = 0
    else:
        insights['daily_avg'] = 0

    # 10. Forecast
    days_in_month = (date(now.year + (now.month // 12), (now.month % 12) + 1, 1) - date(now.year, now.month, 1)).days
    current_day = now.day
    projected_total = (current_month_spent / current_day) * days_in_month if current_day > 0 else 0

    # 11. Email alerts (async) — uses module-level dict from helpers for thread-safety
    if user_email and monthly_budget > 0 and current_month_spent > monthly_budget * 0.8:
        from helpers import _budget_alerts_sent
        alert_key = f"{user_id}_{current_month_str}"
        if not _budget_alerts_sent.get(alert_key):
            _budget_alerts_sent[alert_key] = True
            threading.Thread(
                target=send_budget_alert_async,
                args=(user['email'], user['name'], current_month_spent,
                      monthly_budget, projected_total,
                      insights.get('top_category', 'Other'), insights.get('top_category_amt', 0)),
                daemon=True
            ).start()

    if user_email:
        threading.Thread(
            target=send_weekly_summary_async,
            args=(user_id, user['email'], user['name']),
            daemon=True
        ).start()

    # Income trend values aligned with expense trend months
    income_trends_cached = cache_get((user_id, 'income_trends'))
    income_trend_values = income_trends_cached if income_trends_cached else [0] * len(trend_labels)
    
    # 11b. Account balances for sidebar
    accounts_data = db.execute(
        "SELECT id, name, type, currency FROM accounts WHERE user_id = ? AND is_active = 1 ORDER BY name",
        (user_id,)
    ).fetchall()
    # Calculate actual balances from transactions
    for acc in accounts_data:
        spent = db.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND account_id = ?",
            (user_id, acc['id'])
        ).fetchone()['total'] or 0.0
        earned = db.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = ? AND account_id = ?",
            (user_id, acc['id'])
        ).fetchone()['total'] or 0.0
        acc['balance'] = earned - spent

    # 12a. Get all user tags for filter chips
    all_tags = db.execute(
        "SELECT id, name, color FROM tags WHERE user_id = ? ORDER BY name",
        (user_id,)
    ).fetchall()

    # 12b. Receipt attachment lookup — map expense_id -> has_receipt
    receipt_rows = db.execute(
        "SELECT DISTINCT expense_id FROM receipts WHERE user_id = ? AND expense_id IS NOT NULL",
        (user_id,)
    ).fetchall()
    receipt_expense_ids = {r['expense_id'] for r in receipt_rows}

    return render_template('dashboard.html',
        receipt_expense_ids=receipt_expense_ids,
        expenses=all_expenses,
        expense_tags=expense_tags,
        total_spent=total_spent,
        current_month_spent=current_month_spent,
        current_month_income=current_month_income,
        net_savings=net_savings,
        monthly_budget=monthly_budget,
        chart_labels=chart_labels,
        chart_values=chart_values,
        trend_labels=trend_labels,
        trend_values=trend_values,
        income_trend_values=income_trend_values,
        insights=insights,
        date_from=date_from,
        date_to=date_to,
        tag_filter=tag_filter,
        all_tags=all_tags,
        projected_total=projected_total,
        methods_labels=methods_labels,
        methods_values=methods_values,
        page=page,
        total_pages=total_pages,
        total_expenses=total_count,
        preferred_currency=preferred_currency,
        accounts_data=accounts_data
    )


@dashboard_bp.route('/budget/update', methods=['POST'], endpoint='update_budget')
def update_budget():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    valid, result = validate_budget(request.form.get('budget'))
    if not valid:
        flash(result, 'danger')
        return redirect(url_for('dashboard.dashboard'))
    db = get_db()
    db.execute("UPDATE users SET monthly_budget = ? WHERE id = ?", (result, session['user_id']))
    db.commit()
    flash('Budget updated successfully!', 'success')
    return redirect(url_for('dashboard.dashboard'))


@dashboard_bp.route('/reports', endpoint='reports')
def reports():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    user_id = session['user_id']
    year = request.args.get('year', datetime.now().strftime('%Y'))
    cache_key = (user_id, 'reports', year)
    cached = cache_get(cache_key, ttl_seconds=60)
    # Fetch preferred_currency for display
    user = db.execute("SELECT preferred_currency FROM users WHERE id = ?", (user_id,)).fetchone()
    preferred_currency = user['preferred_currency'] if user and user.get('preferred_currency') else 'INR'
    
    if cached:
        cached['preferred_currency'] = preferred_currency
        return render_template('reports.html', **cached)

    # Expense monthly breakdown
    monthly = db.execute(
        "SELECT strftime('%m', date) as month, SUM(amount) as total FROM expenses WHERE user_id = ? AND strftime('%Y', date) = ? GROUP BY month ORDER BY month",
        (user_id, year)
    ).fetchall()
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    monthly_data = {r['month']: r['total'] for r in monthly}
    report_labels = month_names
    expense_monthly = [monthly_data.get(f"{i+1:02d}", 0) for i in range(12)]
    year_expense_total = sum(expense_monthly)

    # Income monthly breakdown for the year
    income_monthly = db.execute(
        "SELECT strftime('%m', date) as month, SUM(amount) as total FROM income WHERE user_id = ? AND strftime('%Y', date) = ? GROUP BY month ORDER BY month",
        (user_id, year)
    ).fetchall()
    income_monthly_data = {r['month']: r['total'] for r in income_monthly}
    income_monthly_values = [income_monthly_data.get(f"{i+1:02d}", 0) for i in range(12)]
    year_income_total = sum(income_monthly_values)
    net_savings_year = year_income_total - year_expense_total

    # Category breakdown
    categories = db.execute(
        "SELECT category, SUM(amount) as total, COUNT(*) as count FROM expenses WHERE user_id = ? AND strftime('%Y', date) = ? GROUP BY category ORDER BY total DESC",
        (user_id, year)
    ).fetchall()
    cat_labels = [c['category'] for c in categories]
    cat_values = [c['total'] for c in categories]

    # Payment method breakdown
    methods = db.execute(
        "SELECT payment_method, SUM(amount) as total FROM expenses WHERE user_id = ? AND strftime('%Y', date) = ? GROUP BY payment_method ORDER BY total DESC",
        (user_id, year)
    ).fetchall()
    method_labels = [m['payment_method'] for m in methods]
    method_values = [m['total'] for m in methods]

    # Available years
    years = cache_get((user_id, 'available_years'))
    if years is None:
        years = db.execute(
            "SELECT DISTINCT strftime('%Y', date) as yr FROM expenses WHERE user_id = ? ORDER BY yr DESC",
            (user_id,)
        ).fetchall()
        cache_set((user_id, 'available_years'), years)
    available_years = [y['yr'] for y in years] or [datetime.now().strftime('%Y')]

    # Insights
    non_zero = [(i, v) for i, v in enumerate(expense_monthly) if v > 0]
    if non_zero:
        max_month_idx = max(non_zero, key=lambda x: x[1])[0]
        min_month_idx = min(non_zero, key=lambda x: x[1])[0]
        best_month = month_names[min_month_idx]
        worst_month = month_names[max_month_idx]
    else:
        best_month = worst_month = '—'

    active_months = sum(1 for v in expense_monthly if v > 0) or 1
    avg_monthly = year_expense_total / active_months

    template_vars = {
        'year': year,
        'available_years': available_years,
        'month_names': report_labels,
        'monthly_totals': expense_monthly,
        'income_monthly_values': income_monthly_values,
        'total_year': year_expense_total,
        'total_income_year': year_income_total,
        'net_savings_year': net_savings_year,
        'categories': categories,
        'labels': cat_labels,
        'values': cat_values,
        'method_labels': method_labels,
        'method_values': method_values,
        'best_month': best_month,
        'worst_month': worst_month,
        'avg_monthly': avg_monthly,
    }
    template_vars['preferred_currency'] = preferred_currency
    cache_set(cache_key, template_vars)
    return render_template('reports.html', **template_vars)
