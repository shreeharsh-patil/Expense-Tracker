const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const nunjucks = require('nunjucks');
const supertest = require('supertest');

const { User, Expense, Account, Tag, CustomCategory } = require('../models');

// ------------------------------------------------------------------ //
// Create a test Express app with session and flash middleware        //
// ------------------------------------------------------------------ //
function createTestApp() {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  }));

  // Flash middleware (matches server.js)
  app.use((req, res, next) => {
    req.flash = function(category, message) {
      if (!req.session.flash) req.session.flash = [];
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
      if (options.with_categories) return msgs;
      return msgs.map(m => m[1]);
    };
    next();
  });

  // Session locals
  app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.request = { path: req.path, endpoint: '', args: { get: (key, defaultVal) => req.query[key] !== undefined ? req.query[key] : (defaultVal || '') } };
    next();
  });

  // ------------------------------------------------------------------ //
  // Test-only routes — mounted BEFORE CSRF middleware to avoid issues
  // ------------------------------------------------------------------ //
  app.get('/api/auth/csrf-token', (req, res) => {
    res.json({ csrfToken: req.session?.csrfToken || null });
  });

  app.post('/api/test/login', (req, res) => {
    const { user_id, user_name } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id required' });
    }
    req.session.user_id = user_id;
    req.session.user_name = user_name || 'Test User';
    return res.json({ success: true });
  });

  // CSRF middleware (matches server.js)
  app.use((req, res, next) => {
    if (!req.session.csrfToken) {
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    res.locals.csrf_token = () => req.session.csrfToken;
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const clientToken = req.body?.csrf_token || req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
    if (!clientToken || clientToken !== req.session.csrfToken) {
      req.flash('danger', 'Session expired.');
      return res.redirect('/login');
    }
    next();
  });

  // Set up nunjucks template rendering
  const possiblePaths = [
    path.join(__dirname, '../../frontend/templates'),
    path.join(process.cwd(), 'frontend/templates'),
    path.join(process.cwd(), '../frontend/templates')
  ];
  const tplPath = possiblePaths.find(p => fs.existsSync(p)) || path.join(__dirname, '../../frontend/templates');

  const env = nunjucks.configure(tplPath, {
    autoescape: true,
    express: app,
    watch: false,
    noCache: true
  });

  // Template globals for rendering
  const { currency_symbol, format_amount, CURRENCY_CHOICES } = require('../src/helpers');
  env.addGlobal('currency_symbol', currency_symbol);
  env.addGlobal('format_amount', format_amount);

  // Format filter (mimics Python's % formatting like {{ "%.2f"|format(value) }})
  env.addFilter('format', function(formatStr, value) {
    const match = formatStr.match(/%\.?(\d+)?([fds])/);
    if (match) {
      const decimalPlaces = match[1] ? parseInt(match[1]) : undefined;
      const type = match[2];
      if (type === 'f') {
        const num = Number(value);
        if (!isNaN(num)) {
          const formatted = decimalPlaces !== undefined ? num.toFixed(decimalPlaces) : num.toString();
          return formatStr.replace(match[0], formatted);
        }
      } else if (type === 'd') {
        return formatStr.replace(match[0], Math.floor(Number(value)).toString());
      } else if (type === 's') {
        return formatStr.replace(match[0], String(value));
      }
    }
    return formatStr;
  });

  // Additional filters used by templates
  env.addFilter('tojson', (obj) => JSON.stringify(obj));
  env.addFilter('min', function(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    return Math.min(...arr);
  });

  // now() global for date fields in templates
  env.addGlobal('now', () => ({
    strftime: (fmt) => {
      const d = new Date();
      if (fmt === '%Y-%m-%d') {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      return d.toISOString().split('T')[0];
    }
  }));

  // zip global for reports template
  env.addGlobal('zip', (a, b) => {
    const minLen = Math.min(a.length, b.length);
    const res = [];
    for (let i = 0; i < minLen; i++) {
      res.push([a[i], b[i]]);
    }
    return res;
  });

  // url_for global
  env.addGlobal('url_for', (dest) => {
    const routes = {
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
    };
    return routes[dest] || '/';
  });

  return app;
}

// ------------------------------------------------------------------ //
// Error handler middleware — mount AFTER all routes in test files    //
// ------------------------------------------------------------------ //
function testErrorHandler(err, req, res, next) {
  console.error('\n=== TEST APP ERROR ===');
  console.error(`Path: ${req.method} ${req.path}`);
  console.error(`Message: ${err.message}`);
  if (err.stack) {
    const lines = err.stack.split('\n');
    console.error(`Stack: ${lines.slice(0, 4).join('\n')}`);
  }
  console.error('======================\n');
  if (!res.headersSent) {
    res.status(500).send('Internal Server Error');
  }
}

// ------------------------------------------------------------------ //
// Create a test user and return the user document                    //
// ------------------------------------------------------------------ //
async function createTestUser(overrides = {}) {
  const password_hash = await bcrypt.hash('testpass123', 10);
  const user = new User({
    name: 'Test User',
    email: 'test@example.com',
    password_hash,
    email_verified: true,
    preferred_currency: 'INR',
    ...overrides
  });
  await user.save();
  return user;
}

// ------------------------------------------------------------------ //
// Create an authenticated supertest agent with CSRF + session        //
// Returns { agent, csrfToken, user }                                //
// ------------------------------------------------------------------ //
async function createAuthenticatedAgent(app, userOverrides = {}) {
  const agent = supertest.agent(app);
  const user = await createTestUser(userOverrides);

  // Initialize session by making a GET request
  await agent.get('/login');

  // Get CSRF token from the session
  const csrfRes = await agent.get('/api/auth/csrf-token');
  const csrfToken = csrfRes.body?.csrfToken;

  if (!csrfToken) {
    throw new Error('Failed to get CSRF token');
  }

  // Log in via test-only endpoint (avoids needing auth router mounted)
  const loginRes = await agent.post('/api/test/login')
    .send({
      user_id: user._id.toString(),
      user_name: user.name
    });

  if (!loginRes.body?.success) {
    throw new Error(`Test login failed: ${loginRes.body?.error || 'unknown error'}`);
  }

  return { agent, csrfToken, user };
}

// ------------------------------------------------------------------ //
// Create a test expense                                              //
// ------------------------------------------------------------------ //
async function createTestExpense(userId, overrides = {}) {
  const expense = new Expense({
    user_id: userId,
    amount: 99.99,
    category: 'Food',
    payment_method: 'Cash',
    date: '2026-07-01',
    description: 'Test expense',
    currency: 'INR',
    ...overrides
  });
  await expense.save();
  return expense;
}

// ------------------------------------------------------------------ //
// Create a test account                                              //
// ------------------------------------------------------------------ //
async function createTestAccount(userId, overrides = {}) {
  const account = new Account({
    user_id: userId,
    name: 'Test Bank Account',
    type: 'bank',
    currency: 'INR',
    is_active: true,
    ...overrides
  });
  await account.save();
  return account;
}

// ------------------------------------------------------------------ //
// Create a test tag                                                  //
// ------------------------------------------------------------------ //
async function createTestTag(userId, overrides = {}) {
  const tag = new Tag({
    user_id: userId,
    name: 'Test Tag',
    color: '#6366f1',
    ...overrides
  });
  await tag.save();
  return tag;
}

module.exports = {
  createTestApp,
  createTestUser,
  createAuthenticatedAgent,
  createTestExpense,
  createTestAccount,
  createTestTag,
  testErrorHandler
};
