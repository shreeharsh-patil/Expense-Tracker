const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { User, Expense, Income, Account, Tag, Receipt } = require('../models');
const {
    cache_get, cache_set, cache_clear_user, validate_budget,
    should_process_recurring, process_recurring_expenses
} = require('../src/helpers');

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

router.get('/dashboard', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }

    const user_id = req.session.user_id;
    const now = new Date();
    const current_month_str = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 0. Auto-process recurring expenses
    if (should_process_recurring(user_id)) {
        try {
            await process_recurring_expenses(user_id);
        } catch (e) {
            console.error("Failed to process recurring expenses:", e);
        }
    }

    try {
        // 1. Fetch user
        const user = await User.findById(user_id);
        const monthly_budget = user ? user.monthly_budget : 10000.0;
        const user_email = user ? user.email : null;
        const preferred_currency = user?.preferred_currency || 'INR';

        // 2. Expenses filtering and pagination
        const search_query = (req.query.q || '').trim();
        const category_filter = (req.query.category || '').trim();
        const tag_filter = (req.query.tag || '').trim();
        const date_from = (req.query.date_from || '').trim();
        const date_to = (req.query.date_to || '').trim();
        const page = parseInt(req.query.page || '1', 10);
        const per_page = 25;

        const filter = { user_id: new mongoose.Types.ObjectId(user_id) };

        if (search_query) {
            filter.$or = [
                { description: new RegExp(search_query, 'i') },
                { category: new RegExp(search_query, 'i') }
            ];
        }

        if (category_filter) {
            filter.category = category_filter;
        }

        if (date_from || date_to) {
            filter.date = {};
            if (date_from) filter.date.$gte = date_from;
            if (date_to) filter.date.$lte = date_to;
        }

        if (tag_filter) {
            const queryObj = mongoose.isValidObjectId(tag_filter)
                ? { _id: tag_filter }
                : { name: tag_filter, user_id: new mongoose.Types.ObjectId(user_id) };
            const matchedTag = await Tag.findOne(queryObj);
            if (matchedTag) {
                filter.tags = matchedTag._id;
            } else {
                filter.tags = new mongoose.Types.ObjectId(); // matches nothing
            }
        }

        // Total count for pagination
        const total_count = await Expense.countDocuments(filter);
        const total_pages = Math.max(1, Math.ceil(total_count / per_page));
        const active_page = Math.max(1, Math.min(page, total_pages));
        const offset = (active_page - 1) * per_page;

        const all_expenses = await Expense.find(filter)
            .sort({ date: -1, _id: -1 })
            .skip(offset)
            .limit(per_page)
            .populate('tags');

        // Format expenses for UI template consumption
        const plainExpenses = all_expenses.map(e => {
            const obj = e.toObject();
            obj.id = obj._id.toString();
            return obj;
        });

        // Set up expense_tags object compatible with jinja2 template
        const expense_tags = {
            get: function(key) {
                return this[key];
            }
        };
        for (const exp of plainExpenses) {
            expense_tags[exp.id] = exp.tags.map(t => ({
                id: t._id.toString(),
                name: t.name,
                color: t.color
            }));
        }

        // Calculate total spent for current filtered view
        let total_spent = 0;
        if (search_query || category_filter || date_from || date_to || tag_filter) {
            const totalRow = await Expense.aggregate([
                { $match: filter },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            total_spent = totalRow[0]?.total || 0;
        }

        // 3. Current-month spending
        const currentMonthSpentRow = await Expense.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(user_id),
                    date: new RegExp(`^${current_month_str}`)
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const current_month_spent = currentMonthSpentRow[0]?.total || 0;

        // 4. Current-month income
        const currentMonthIncomeRow = await Income.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(user_id),
                    date: new RegExp(`^${current_month_str}`)
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const current_month_income = currentMonthIncomeRow[0]?.total || 0;

        const net_savings = current_month_income - current_month_spent;

        // 5. Category totals (cached)
        let categories_data = cache_get([user_id, 'categories']);
        if (!categories_data) {
            categories_data = await Expense.aggregate([
                { $match: { user_id: new mongoose.Types.ObjectId(user_id) } },
                { $group: { _id: '$category', total: { $sum: '$amount' } } },
                { $sort: { total: -1 } }
            ]);
            categories_data = categories_data.map(c => ({ category: c._id, total: c.total }));
            cache_set([user_id, 'categories'], categories_data);
        }
        const chart_labels = categories_data.map(c => c.category);
        const chart_values = categories_data.map(c => c.total);

        // 6. Monthly trends (cached)
        let monthly_trends = cache_get([user_id, 'trends']);
        if (!monthly_trends) {
            monthly_trends = await Expense.aggregate([
                { $match: { user_id: new mongoose.Types.ObjectId(user_id) } },
                {
                    $group: {
                        _id: { $substr: ['$date', 0, 7] },
                        total: { $sum: '$amount' }
                    }
                },
                { $sort: { _id: -1 } },
                { $limit: 6 }
            ]);
            monthly_trends = monthly_trends.map(r => ({ month: r._id, total: r.total })).reverse();
            cache_set([user_id, 'trends'], monthly_trends);
        }
        const trend_labels = monthly_trends.map(r => r.month);
        const trend_values = monthly_trends.map(r => r.total);

        // 7. Income monthly trends
        let income_trend_values = cache_get([user_id, 'income_trends']);
        if (!income_trend_values) {
            const raw_income_trends = await Income.aggregate([
                { $match: { user_id: new mongoose.Types.ObjectId(user_id) } },
                {
                    $group: {
                        _id: { $substr: ['$date', 0, 7] },
                        total: { $sum: '$amount' }
                    }
                },
                { $sort: { _id: -1 } },
                { $limit: 6 }
            ]);
            const incomeMap = {};
            for (const r of raw_income_trends) {
                incomeMap[r._id] = r.total;
            }
            income_trend_values = trend_labels.map(m => incomeMap[m] || 0);
            cache_set([user_id, 'income_trends'], income_trend_values);
        }

        // 8. Payment Method Breakdown (cached)
        let methods_raw = cache_get([user_id, 'methods']);
        if (!methods_raw) {
            methods_raw = await Expense.aggregate([
                { $match: { user_id: new mongoose.Types.ObjectId(user_id) } },
                { $group: { _id: '$payment_method', total: { $sum: '$amount' } } }
            ]);
            methods_raw = methods_raw.map(m => ({ payment_method: m._id, total: m.total }));
            cache_set([user_id, 'methods'], methods_raw);
        }
        const methods_labels = methods_raw.map(m => m.payment_method);
        const methods_values = methods_raw.map(m => m.total);

        // 9. Insights
        const insights = {};
        if (categories_data.length > 0) {
            insights.top_category = categories_data[0].category;
            insights.top_category_amt = categories_data[0].total;
        } else {
            insights.top_category = '—';
            insights.top_category_amt = 0;
        }

        const biggest = await Expense.findOne({ user_id }).sort({ amount: -1 });
        if (biggest) {
            insights.biggest_expense = biggest.amount;
            insights.biggest_desc = biggest.description || biggest.category;
        } else {
            insights.biggest_expense = 0;
            insights.biggest_desc = '—';
        }

        const minExpense = await Expense.findOne({ user_id }).sort({ date: 1 });
        const maxExpense = await Expense.findOne({ user_id }).sort({ date: -1 });
        if (minExpense && maxExpense && minExpense.date && maxExpense.date) {
            const d_min = new Date(minExpense.date);
            const d_max = new Date(maxExpense.date);
            const num_days = Math.max(1, Math.round((d_max - d_min) / (1000 * 3600 * 24)) + 1);
            const total_all = chart_values.reduce((a, b) => a + b, 0);
            insights.daily_avg = total_all / num_days;
        } else {
            insights.daily_avg = 0;
        }

        // 10. Forecast
        const days_in_month = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const current_day = now.getDate();
        const projected_total = current_day > 0 ? (current_month_spent / current_day) * days_in_month : 0;

        // 11. Email alerts (async)
        const alert_key = `${user_id}_${current_month_str}`;
        if (user_email && monthly_budget > 0 && current_month_spent > monthly_budget * 0.8) {
            const { _budget_alerts_sent } = require('../src/helpers');
            if (!_budget_alerts_sent.get(alert_key)) {
                _budget_alerts_sent.set(alert_key, true);
                const { send_budget_alert } = require('../src/email_alerts');
                send_budget_alert(user.email, user.name, current_month_spent, monthly_budget, projected_total, insights.top_category, insights.top_category_amt)
                    .catch(err => console.error("Async budget alert error:", err));
            }
        }

        if (user_email && now.getDay() === 1) { // Monday
            const week_key = `${user_id}_${now.getFullYear()}_${getWeekNumber(now)}`;
            const { _weekly_summary_sent } = require('../src/helpers');
            if (!_weekly_summary_sent.get(week_key)) {
                _weekly_summary_sent.set(week_key, true);
                const weekAgoDateStr = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
                Expense.find({ user_id, date: { $gte: weekAgoDateStr } }).sort({ amount: -1 })
                    .then(week_expenses => {
                        if (week_expenses.length > 0) {
                            const week_total = week_expenses.reduce((sum, e) => sum + e.amount, 0);
                            const daily_avg = week_total / 7;
                            const top_expenses = week_expenses.slice(0, 5).map(e => ({
                                date: e.date,
                                category: e.category,
                                amount: e.amount
                            }));
                            const { send_weekly_summary } = require('../src/email_alerts');
                            send_weekly_summary(user.email, user.name, week_total, daily_avg, week_expenses.length, top_expenses)
                                .catch(err => console.error("Async weekly summary error:", err));
                        }
                    });
            }
        }

        // 11b. Account balances
        const accounts = await Account.find({ user_id, is_active: true }).sort({ name: 1 });
        const accounts_data = [];
        for (const acc of accounts) {
            const spentRow = await Expense.aggregate([
                { $match: { user_id: new mongoose.Types.ObjectId(user_id), account_id: acc._id } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const earnedRow = await Income.aggregate([
                { $match: { user_id: new mongoose.Types.ObjectId(user_id), account_id: acc._id } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const spent = spentRow[0]?.total || 0;
            const earned = earnedRow[0]?.total || 0;

            const accObj = acc.toObject();
            accObj.id = acc._id.toString();
            accObj.balance = earned - spent;
            accounts_data.push(accObj);
        }

        // 12a. Tags for chip filters
        const tags = await Tag.find({ user_id }).sort({ name: 1 });
        const all_tags = tags.map(t => {
            const obj = t.toObject();
            obj.id = obj._id.toString();
            return obj;
        });

        // 12b. Receipt lookup
        const receipts = await Receipt.find({ user_id, expense_id: { $ne: null } });
        const receipt_expense_ids = receipts.map(r => r.expense_id.toString());

        res.render('dashboard.html', {
            receipt_expense_ids,
            expenses: plainExpenses,
            expense_tags,
            total_spent,
            current_month_spent,
            current_month_income,
            net_savings,
            monthly_budget,
            chart_labels,
            chart_values,
            trend_labels,
            trend_values,
            income_trend_values,
            insights,
            date_from,
            date_to,
            tag_filter,
            all_tags,
            projected_total,
            methods_labels,
            methods_values,
            page: active_page,
            total_pages,
            total_expenses: total_count,
            preferred_currency,
            accounts_data
        });

    } catch (err) {
        next(err);
    }
});

router.post('/budget/update', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const [valid, result] = validate_budget(req.body.budget);
    if (!valid) {
        req.flash('danger', result);
        return res.redirect('/dashboard');
    }

    try {
        await User.findByIdAndUpdate(req.session.user_id, { monthly_budget: result });
        req.flash('success', 'Budget updated successfully!');
        res.redirect('/dashboard');
    } catch (err) {
        next(err);
    }
});

router.get('/reports', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }

    const user_id = req.session.user_id;
    const year = req.query.year || new Date().getFullYear().toString();
    const cacheKey = [user_id, 'reports', year];

    try {
        const user = await User.findById(user_id);
        const preferred_currency = user?.preferred_currency || 'INR';

        const cached = cache_get(cacheKey);
        if (cached) {
            cached.preferred_currency = preferred_currency;
            return res.render('reports.html', cached);
        }

        // Expense monthly breakdown
        const monthly = await Expense.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(user_id),
                    date: new RegExp(`^${year}-`)
                }
            },
            {
                $group: {
                    _id: { $substr: ['$date', 5, 2] },
                    total: { $sum: '$amount' }
                }
            }
        ]);
        const month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthly_data = {};
        for (const r of monthly) {
            monthly_data[r._id] = r.total;
        }
        const report_labels = month_names;
        const expense_monthly = Array.from({ length: 12 }, (_, i) => {
            const mStr = String(i + 1).padStart(2, '0');
            return monthly_data[mStr] || 0;
        });
        const year_expense_total = expense_monthly.reduce((a, b) => a + b, 0);

        // Income monthly breakdown
        const monthlyIncome = await Income.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(user_id),
                    date: new RegExp(`^${year}-`)
                }
            },
            {
                $group: {
                    _id: { $substr: ['$date', 5, 2] },
                    total: { $sum: '$amount' }
                }
            }
        ]);
        const income_monthly_data = {};
        for (const r of monthlyIncome) {
            income_monthly_data[r._id] = r.total;
        }
        const income_monthly_values = Array.from({ length: 12 }, (_, i) => {
            const mStr = String(i + 1).padStart(2, '0');
            return income_monthly_data[mStr] || 0;
        });
        const year_income_total = income_monthly_values.reduce((a, b) => a + b, 0);
        const net_savings_year = year_income_total - year_expense_total;

        // Category breakdown
        const categoriesRaw = await Expense.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(user_id),
                    date: new RegExp(`^${year}-`)
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } }
        ]);
        const categories = categoriesRaw.map(c => ({
            category: c._id,
            total: c.total,
            count: c.count
        }));
        const cat_labels = categories.map(c => c.category);
        const cat_values = categories.map(c => c.total);

        // Payment method breakdown
        const methodsRaw = await Expense.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(user_id),
                    date: new RegExp(`^${year}-`)
                }
            },
            {
                $group: {
                    _id: '$payment_method',
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { total: -1 } }
        ]);
        const methods = methodsRaw.map(m => ({
            payment_method: m._id,
            total: m.total
        }));
        const method_labels = methods.map(m => m.payment_method);
        const method_values = methods.map(m => m.total);

        // Available years
        let years = cache_get([user_id, 'available_years']);
        if (!years) {
            const rawYears = await Expense.aggregate([
                { $match: { user_id: new mongoose.Types.ObjectId(user_id) } },
                { $group: { _id: { $substr: ['$date', 0, 4] } } },
                { $sort: { _id: -1 } }
            ]);
            years = rawYears.map(y => y._id);
            cache_set([user_id, 'available_years'], years);
        }
        const available_years = years.length > 0 ? years : [new Date().getFullYear().toString()];

        // Insights
        const non_zero = expense_monthly
            .map((v, i) => ({ val: v, idx: i }))
            .filter(x => x.val > 0);
        let best_month = '—';
        let worst_month = '—';
        if (non_zero.length > 0) {
            const min_item = non_zero.reduce((min, cur) => cur.val < min.val ? cur : min, non_zero[0]);
            const max_item = non_zero.reduce((max, cur) => cur.val > max.val ? cur : max, non_zero[0]);
            best_month = month_names[min_item.idx];
            worst_month = month_names[max_item.idx];
        }

        const active_months = expense_monthly.filter(v => v > 0).length || 1;
        const avg_monthly = year_expense_total / active_months;

        const template_vars = {
            year,
            available_years,
            month_names: report_labels,
            monthly_totals: expense_monthly,
            income_monthly_values,
            total_year: year_expense_total,
            total_income_year: year_income_total,
            net_savings_year,
            categories,
            labels: cat_labels,
            values: cat_values,
            method_labels,
            method_values,
            best_month,
            worst_month,
            avg_monthly,
            preferred_currency
        };

        cache_set(cacheKey, template_vars);
        res.render('reports.html', template_vars);

    } catch (err) {
        next(err);
    }
});

module.exports = router;
