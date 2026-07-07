/**
 * Utility helper functions for Spendly
 */

const crypto = require('crypto');

// In-memory states matching python module-level globals
const _reset_tokens = new Map();
const _otp_cooldowns = new Map();
const _login_attempts = new Map();
const _budget_alerts_sent = new Map();
const _recurring_last_run = new Map();
const _weekly_summary_sent = new Map();

// ------------------------------------------------------------------ //
// Simple In-Memory Cache (60s TTL) for aggregates                  //
// ------------------------------------------------------------------ //
const _cache = new Map();
const _CACHE_MAX_SIZE = 200;

function getCacheKeyStr(key) {
    if (Array.isArray(key)) {
        return key.map(k => k?.toString ? k.toString() : String(k)).join(':');
    }
    return key?.toString ? key.toString() : String(key);
}

function cache_get(key, ttl_seconds = 60) {
    const keyStr = getCacheKeyStr(key);
    const entry = _cache.get(keyStr);
    if (entry && (Date.now() - entry.ts) < ttl_seconds * 1000) {
        return entry.data;
    }
    if (entry) {
        _cache.delete(keyStr);
    }
    return null;
}

function cache_set(key, data) {
    const keyStr = getCacheKeyStr(key);
    if (_cache.size >= _CACHE_MAX_SIZE && !_cache.has(keyStr)) {
        // Evict oldest entry (the first key in iterator)
        const oldestKey = _cache.keys().next().value;
        _cache.delete(oldestKey);
    }
    _cache.delete(keyStr); // remove and re-add to maintain LRU insertion order
    _cache.set(keyStr, { data, ts: Date.now() });
}

function cache_clear_user(user_id) {
    if (!user_id) return;
    const prefix = user_id.toString() + ':';
    for (const k of _cache.keys()) {
        if (k.startsWith(prefix) || k === user_id.toString()) {
            _cache.delete(k);
        }
    }
}

// ------------------------------------------------------------------ //
// Token Management                                                   //
// ------------------------------------------------------------------ //
function generate_reset_token(email) {
    const token = crypto.randomBytes(32).toString('hex');
    _reset_tokens.set(token, {
        email: email.toLowerCase(),
        expires: Date.now() + 3600 * 1000 // 1 hour
    });
    return token;
}

function verify_reset_token(token) {
    const data = _reset_tokens.get(token);
    if (!data) return null;
    if (Date.now() > data.expires) {
        _reset_tokens.delete(token);
        return null;
    }
    return data.email;
}

function consume_reset_token(token) {
    _reset_tokens.delete(token);
}

// ------------------------------------------------------------------ //
// Email OTP Verification                                             //
// ------------------------------------------------------------------ //
function generate_otp(email) {
    const now = Date.now();
    const cleanEmail = email.toLowerCase();
    const last_sent = _otp_cooldowns.get(cleanEmail);
    if (last_sent && (now - last_sent) < 30 * 1000) {
        return null; // Rate-limited to 30 seconds
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    _otp_cooldowns.set(cleanEmail, now);
    return otp;
}

function get_otp_remaining_cooldown(email) {
    const now = Date.now();
    const cleanEmail = email.toLowerCase();
    const last_sent = _otp_cooldowns.get(cleanEmail);
    if (!last_sent) return 0;
    const elapsed = (now - last_sent) / 1000;
    return Math.max(0, 30 - Math.floor(elapsed));
}

// ------------------------------------------------------------------ //
// Rate Limiting                                                      //
// ------------------------------------------------------------------ //
function is_rate_limited(ip) {
    const now = Date.now();
    let attempts = _login_attempts.get(ip) || [];
    attempts = attempts.filter(t => (now - t) < 15 * 60 * 1000); // 15 minutes window
    _login_attempts.set(ip, attempts);
    return attempts.length >= 10;
}

function record_login_attempt(ip) {
    let attempts = _login_attempts.get(ip) || [];
    attempts.push(Date.now());
    _login_attempts.set(ip, attempts);
}

// ------------------------------------------------------------------ //
// Currency Configuration & Formatting                                //
// ------------------------------------------------------------------ //
const SUPPORTED_CURRENCIES = {
    'INR': { symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
    'USD': { symbol: '$', name: 'US Dollar', locale: 'en-US' },
    'EUR': { symbol: '€', name: 'Euro', locale: 'de-DE' },
    'GBP': { symbol: '£', name: 'British Pound', locale: 'en-GB' },
    'JPY': { symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
    'AUD': { symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
    'CAD': { symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
    'SGD': { symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
    'AED': { symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
    'CHF': { symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
    'CNY': { symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' }
};

const CURRENCY_CHOICES = Object.keys(SUPPORTED_CURRENCIES).sort();

function currency_symbol(code) {
    return SUPPORTED_CURRENCIES[code]?.symbol || '₹';
}

function format_amount(amount, currency = 'INR') {
    const sym = currency_symbol(currency);
    if (amount === null || amount === undefined) amount = 0;
    const formatted = Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return `${sym}${formatted}`;
}

function format_amount_no_decimal(amount, currency = 'INR') {
    const sym = currency_symbol(currency);
    if (amount === null || amount === undefined) amount = 0;
    const formatted = Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    return `${sym}${formatted}`;
}

// ------------------------------------------------------------------ //
// Validation Helpers                                                 //
// ------------------------------------------------------------------ //
function validate_amount(val) {
    const v = parseFloat(val);
    if (isNaN(v) || v <= 0) {
        return [false, "Amount must be greater than zero."];
    }
    if (v > 999999999) {
        return [false, "Amount is too large."];
    }
    return [true, v];
}

function validate_budget(val) {
    const v = parseFloat(val);
    if (isNaN(v) || v < 0) {
        return [false, "Budget cannot be negative."];
    }
    if (v > 999999999) {
        return [false, "Budget is too large."];
    }
    return [true, v];
}

// ------------------------------------------------------------------ //
// Recurring Expense Processing                                       //
// ------------------------------------------------------------------ //
function should_process_recurring(user_id) {
    const now = Date.now();
    const uKey = user_id.toString();
    const last = _recurring_last_run.get(uKey);
    if (last && (now - last) < 3600 * 1000) {
        return false;
    }
    _recurring_last_run.set(uKey, now);
    return true;
}

async function process_recurring_expenses(user_id) {
    const { RecurringExpense, Expense } = require('./models');
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    const recurring = await RecurringExpense.find({ user_id });
    let processed_count = 0;

    for (const rec of recurring) {
        const last_processed = rec.last_processed_month;

        if (!last_processed) {
            if (rec.day_of_month <= today.getDate()) {
                const expenseDate = `${currentMonthStr}-${String(rec.day_of_month).padStart(2, '0')}`;
                await new Expense({
                    user_id,
                    amount: rec.amount,
                    category: rec.category,
                    payment_method: rec.payment_method,
                    description: (rec.description || '') + " (Auto)",
                    date: expenseDate,
                    currency: rec.currency
                }).save();

                rec.last_processed_month = currentMonthStr;
                await rec.save();
                processed_count++;
            }
            continue;
        }

        // Process missed months
        try {
            const [lastYear, lastMonth] = last_processed.split('-').map(Number);
            let tempDate = new Date(lastYear, lastMonth - 1, 1);

            while (true) {
                tempDate.setMonth(tempDate.getMonth() + 1);
                const tempYear = tempDate.getFullYear();
                const tempMonth = tempDate.getMonth() + 1;

                if (tempYear > currentYear || (tempYear === currentYear && tempMonth > currentMonth)) {
                    break;
                }

                const tempMonthStr = `${tempYear}-${String(tempMonth).padStart(2, '0')}`;
                const isCurrentMonth = (tempYear === currentYear && tempMonth === currentMonth);

                if (!isCurrentMonth || rec.day_of_month <= today.getDate()) {
                    const expenseDate = `${tempMonthStr}-${String(rec.day_of_month).padStart(2, '0')}`;
                    await new Expense({
                        user_id,
                        amount: rec.amount,
                        category: rec.category,
                        payment_method: rec.payment_method,
                        description: (rec.description || '') + " (Auto)",
                        date: expenseDate,
                        currency: rec.currency
                    }).save();

                    rec.last_processed_month = tempMonthStr;
                    await rec.save();
                    processed_count++;
                }
            }
        } catch (e) {
            console.error('Error processing recurring months:', e);
        }
    }

    return processed_count;
}

module.exports = {
    _budget_alerts_sent,
    _weekly_summary_sent,
    cache_get,
    cache_set,
    cache_clear_user,
    generate_reset_token,
    verify_reset_token,
    consume_reset_token,
    generate_otp,
    get_otp_remaining_cooldown,
    is_rate_limited,
    record_login_attempt,
    CURRENCY_CHOICES,
    currency_symbol,
    format_amount,
    format_amount_no_decimal,
    validate_amount,
    validate_budget,
    should_process_recurring,
    process_recurring_expenses
};
