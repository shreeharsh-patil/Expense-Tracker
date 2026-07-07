require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const nunjucks = require('nunjucks');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5001;

// ------------------------------------------------------------------ //
// MongoDB Connection                                                 //
// ------------------------------------------------------------------ //
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/spendly';
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        return seed_db();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

// Seeding function matching Flask seed-db command
async function seed_db() {
    const { User, Expense } = require('../models');
    const bcrypt = require('bcryptjs');

    try {
        const existing = await User.countDocuments();
        if (existing > 0) {
            return;
        }

        const password_hash = await bcrypt.hash('demo123', 10);
        const demoUser = new User({
            name: "Demo User",
            email: "demo@spendly.com",
            password_hash,
            email_verified: true
        });
        await demoUser.save();

        const user_id = demoUser._id;
        const sample_expenses = [
            { user_id, amount: 850.00,  category: "Food",          date: "2026-04-01", description: "Grocery run - weekly vegetables and dairy" },
            { user_id, amount: 320.00,  category: "Transport",     date: "2026-04-03", description: "Ola cab - commute to office" },
            { user_id, amount: 1500.00, category: "Bills",         date: "2026-04-05", description: "Electricity bill for March" },
            { user_id, amount: 600.00,  category: "Health",        date: "2026-04-08", description: "Pharmacy - vitamins and medicines" },
            { user_id, amount: 450.00,  category: "Entertainment", date: "2026-04-10", description: "Netflix + Spotify subscriptions" },
            { user_id, amount: 2200.00, category: "Shopping",      date: "2026-04-13", description: "Myntra order - summer clothing haul" },
            { user_id, amount: 780.00,  category: "Food",          date: "2026-04-15", description: "Zomato orders for the week" },
            { user_id, amount: 300.00,  category: "Other",         date: "2026-04-17", description: "Miscellaneous - stationery and home supplies" }
        ];

        await Expense.insertMany(sample_expenses);
        console.log('Database seeded with demo data.');
    } catch (err) {
        console.error('Error seeding database:', err);
    }
}

// ------------------------------------------------------------------ //
// App Middlewares                                                    //
// ------------------------------------------------------------------ //
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session with MongoStore
const SECRET_KEY = process.env.SECRET_KEY || 'spendly-local-dev-secret-key-change-in-prod';
app.use(session({
    secret: SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 14 * 24 * 60 * 60 * 1000
    }
}));

// Custom flash middleware matching Flask's flash logic
app.use((req, res, next) => {
    req.flash = function(category, message) {
        if (!req.session.flash) {
            req.session.flash = [];
        }
        if (category && message) {
            req.session.flash.push([category, message]);
        } else if (category) {
            const msgs = req.session.flash.filter(m => m[0] === category).map(m => m[1]);
            req.session.flash = req.session.flash.filter(m => m[0] !== category);
            return msgs;
        } else {
            const msgs = req.session.flash || [];
            req.session.flash = [];
            return msgs;
        }
    };

    res.locals.get_flashed_messages = function(options = {}) {
        const msgs = req.flash();
        if (options.with_categories) {
            return msgs;
        }
        return msgs.map(m => m[1]);
    };
    next();
});

// Custom CSRF verification middleware matching Flask's CSRF
app.use((req, res, next) => {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }

    res.locals.csrf_token = () => req.session.csrfToken;

    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const clientToken = req.body?.csrf_token || req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
    if (!clientToken || clientToken !== req.session.csrfToken) {
        req.flash('danger', 'Session expired. Please try again.');
        return res.redirect('/login');
    }

    next();
});

// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
        res.setHeader('Content-Security-Policy',
            "default-src 'self'; " +
            "script-src 'self' https://cdn.jsdelivr.net https://fonts.googleapis.com 'unsafe-inline'; " +
            "style-src 'self' https://fonts.googleapis.com https://cdn.jsdelivr.net 'unsafe-inline'; " +
            "font-src 'self' https://fonts.gstatic.com; " +
            "img-src 'self' https://ui-avatars.com data: blob:; " +
            "connect-src 'self' https://accounts.google.com https://api.github.com; " +
            "frame-ancestors 'none'"
        );
    }
    next();
});

// Bind session and request path/endpoint to locals for Nunjucks
app.use((req, res, next) => {
    res.locals.session = req.session;
    
    let endpoint = '';
    const routes = {
        '/': 'main.landing',
        '/terms': 'main.terms',
        '/privacy': 'main.privacy',
        '/features': 'main.features',
        '/pricing': 'main.pricing',
        '/ocr': 'main.ocr_scanning',
        '/export': 'main.export_info',
        '/about': 'main.about',
        '/blog': 'main.blog',
        '/careers': 'main.careers',
        '/login': 'auth.login',
        '/logout': 'auth.logout',
        '/register': 'auth.register',
        '/forgot-password': 'auth.forgot_password',
        '/dashboard': 'dashboard.dashboard',
        '/reports': 'dashboard.reports',
        '/receipt/scan': 'expenses.scan_receipt',
        '/receipts/gallery': 'expenses.receipt_gallery',
        '/recurring': 'expenses.recurring_list',
        '/accounts': 'accounts.list_accounts',
        '/rules': 'rules.list_rules',
        '/tags': 'tags.manage_tags',
        '/categories': 'categories.list_categories',
        '/profile': 'profile.profile'
    };
    
    if (routes[req.path]) {
        endpoint = routes[req.path];
    } else {
        if (req.path.startsWith('/reset-password/')) endpoint = 'auth.reset_password';
        else if (req.path.match(/^\/expenses\/[^\/]+\/edit$/)) endpoint = 'expenses.edit_expense';
        else if (req.path.match(/^\/expenses\/[^\/]+\/delete$/)) endpoint = 'expenses.delete_expense';
        else if (req.path.match(/^\/income\/[^\/]+\/edit$/)) endpoint = 'income.edit_income';
        else if (req.path.match(/^\/income\/[^\/]+\/delete$/)) endpoint = 'income.delete_income';
        else if (req.path.match(/^\/recurring\/[^\/]+\/delete$/)) endpoint = 'expenses.delete_recurring';
        else if (req.path.match(/^\/accounts\/[^\/]+\/edit$/)) endpoint = 'accounts.edit_account';
        else if (req.path.match(/^\/accounts\/[^\/]+\/delete$/)) endpoint = 'accounts.delete_account';
        else if (req.path.match(/^\/rules\/[^\/]+\/toggle$/)) endpoint = 'rules.toggle_rule';
        else if (req.path.match(/^\/rules\/[^\/]+\/delete$/)) endpoint = 'rules.delete_rule';
        else if (req.path.match(/^\/tags\/[^\/]+\/delete$/)) endpoint = 'tags.delete_tag';
        else if (req.path.match(/^\/categories\/[^\/]+\/edit$/)) endpoint = 'categories.edit_category';
        else if (req.path.match(/^\/categories\/[^\/]+\/delete$/)) endpoint = 'categories.delete_category';
    }

    res.locals.request = {
        path: req.path,
        endpoint: endpoint
    };
    next();
});

// ------------------------------------------------------------------ //
// Nunjucks Templates & Static Files                                  //
// ------------------------------------------------------------------ //
const env = nunjucks.configure(path.join(__dirname, '../../frontend/templates'), {
    autoescape: true,
    express: app,
    watch: process.env.NODE_ENV !== 'production'
});

// Global template helpers
env.addGlobal('now', () => {
    return {
        strftime: (fmt) => {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            if (fmt === '%Y-%m-%d') {
                return `${year}-${month}-${day}`;
            }
            return d.toISOString().split('T')[0];
        }
    };
});
env.addGlobal('now_year', new Date().getFullYear());
env.addGlobal('zip', (a, b) => {
    const minLen = Math.min(a.length, b.length);
    const res = [];
    for (let i = 0; i < minLen; i++) {
        res.push([a[i], b[i]]);
    }
    return res;
});

const { currency_symbol, format_amount, format_amount_no_decimal, CURRENCY_CHOICES } = require('./helpers');
env.addGlobal('currency_symbol', currency_symbol);
env.addGlobal('format_amount', format_amount);
env.addGlobal('format_amount_no_decimal', format_amount_no_decimal);
env.addGlobal('currencies', CURRENCY_CHOICES);
env.addFilter('tojson', (obj) => JSON.stringify(obj));

// Flask url_for replacement
env.addGlobal('url_for', (dest, options = {}) => {
    if (dest === 'static') {
        return '/' + (options.filename || '');
    }
    const routes = {
        'main.landing': '/',
        'main.terms': '/terms',
        'main.privacy': '/privacy',
        'main.features': '/features',
        'main.pricing': '/pricing',
        'main.ocr_scanning': '/ocr',
        'main.export_info': '/export',
        'main.about': '/about',
        'main.blog': '/blog',
        'main.careers': '/careers',
        'auth.login': '/login',
        'auth.logout': '/logout',
        'auth.register': '/register',
        'auth.forgot_password': '/forgot-password',
        'dashboard.dashboard': '/dashboard',
        'dashboard.reports': '/reports',
        'expenses.scan_receipt': '/receipt/scan',
        'expenses.receipt_gallery': '/receipts/gallery',
        'expenses.recurring_list': '/recurring',
        'accounts.list_accounts': '/accounts',
        'rules.list_rules': '/rules',
        'tags.manage_tags': '/tags',
        'categories.list_categories': '/categories',
        'profile.profile': '/profile',
        // Parameterized routes
        'auth.reset_password': '/reset-password/:token',
        'expenses.edit_expense': '/expenses/:id/edit',
        'expenses.delete_expense': '/expenses/:id/delete',
        'income.edit_income': '/income/:id/edit',
        'income.delete_income': '/income/:id/delete',
        'expenses.delete_recurring': '/recurring/:id/delete',
        'accounts.edit_account': '/accounts/:id/edit',
        'accounts.delete_account': '/accounts/:id/delete',
        'rules.toggle_rule': '/rules/:id/toggle',
        'rules.delete_rule': '/rules/:id/delete',
        'tags.delete_tag': '/tags/:id/delete',
        'tags.set_expense_tags': '/tags/expense/:expense_id/set',
        'expenses.link_receipt': '/receipts/:id/link-expense',
        'expenses.delete_receipt': '/receipts/:id/delete',
        'categories.edit_category': '/categories/:id/edit',
        'categories.delete_category': '/categories/:id/delete',
        'auth.oauth_login': '/login/:provider',
        'auth.oauth_authorize': '/authorize/:provider'
    };

    let pathUrl = routes[dest];
    if (!pathUrl) {
        return '#';
    }

    for (const [key, value] of Object.entries(options)) {
        pathUrl = pathUrl.replace(`:${key}`, value);
    }
    return pathUrl;
});

// Serve assets
app.use(express.static(path.join(__dirname, '../../frontend/static')));

const isVercel = process.env.VERCEL;
const receiptFolder = isVercel ? '/tmp/uploads/receipts' : path.join(__dirname, '../../frontend/static/uploads/receipts');
const uploadFolder = isVercel ? '/tmp/uploads/profile_pics' : path.join(__dirname, '../../frontend/static/uploads/profile_pics');

app.use('/uploads/receipts', express.static(receiptFolder));
app.use('/uploads/profile_pics', express.static(uploadFolder));

// ------------------------------------------------------------------ //
// Routes Mounting                                                    //
// ------------------------------------------------------------------ //
const mainRouter = require('../routes/main');
const authRouter = require('../routes/auth');
const dashboardRouter = require('../routes/dashboard');
const expensesRouter = require('../routes/expenses');
const incomeRouter = require('../routes/income');
const profileRouter = require('../routes/profile');
const rulesRouter = require('../routes/rules');
const tagsRouter = require('../routes/tags');
const categoriesRouter = require('../routes/categories');
const accountsRouter = require('../routes/accounts');
const webhooksRouter = require('../routes/webhooks');

app.use('/', mainRouter);
app.use('/', authRouter);
app.use('/', dashboardRouter);
app.use('/', expensesRouter);
app.use('/', incomeRouter);
app.use('/', profileRouter);
app.use('/', rulesRouter);
app.use('/', tagsRouter);
app.use('/', categoriesRouter);
app.use('/', accountsRouter);
app.use('/', webhooksRouter);

// ------------------------------------------------------------------ //
// Error Handlers                                                     //
// ------------------------------------------------------------------ //
app.use((req, res, next) => {
    res.status(404).render('500.html'); // fallback
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('500.html');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Spendly Node app running on port ${PORT}`);
});
