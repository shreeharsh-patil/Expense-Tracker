const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');
const { Webhook, Expense } = require('../models');
const { validate_amount } = require('../src/helpers');

function is_valid_webhook_url(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' && (
            parsed.hostname !== 'localhost' &&
            parsed.hostname !== '127.0.0.1' &&
            parsed.hostname !== '0.0.0.0' &&
            !parsed.hostname.startsWith('10.') &&
            !parsed.hostname.startsWith('172.16.') &&
            !parsed.hostname.startsWith('192.168.') &&
            !parsed.hostname.endsWith('.local') &&
            !parsed.hostname.endsWith('.internal')
        );
    } catch {
        return false;
    }
}

async function dispatch_webhooks(user_id, event, payload) {
    try {
        const hooks = await Webhook.find({ user_id, is_active: true });
        for (const hook of hooks) {
            const events = hook.events.split(',').map(e => e.trim());
            if (events.includes(event)) {
                axios.post(hook.url, { event, data: payload }, { timeout: 10000 })
                    .catch(err => console.error(`Webhook delivery failed to ${hook.url}:`, err.message));
            }
        }
    } catch (err) {
        console.error("Webhook dispatch error:", err);
    }
}

router.get('/webhooks', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;

    try {
        const hooks = await Webhook.find({ user_id }).sort({ created_at: -1 });
        res.render('webhooks.html', {
            webhooks: hooks.map(h => {
                const o = h.toObject();
                o.id = o._id.toString();
                return o;
            })
        });
    } catch (err) {
        next(err);
    }
});

router.post('/webhooks/add', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const name = (req.body.name || '').trim();
    const url = (req.body.url || '').trim();
    const events = req.body.events || 'expense.created';

    if (!name || !url) {
        req.flash('danger', 'Webhook name and URL are required.');
        return res.redirect('/webhooks');
    }

    if (!is_valid_webhook_url(url)) {
        req.flash('danger', 'Invalid webhook URL. Must be a public HTTPS URL.');
        return res.redirect('/webhooks');
    }

    try {
        const newHook = new Webhook({
            user_id,
            name,
            url,
            events
        });
        await newHook.save();

        req.flash('success', `Webhook "${name}" created!`);
        res.redirect('/webhooks');
    } catch (err) {
        next(err);
    }
});

router.post('/webhooks/:id/delete', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const hook_id = req.params.id;

    if (!mongoose.isValidObjectId(hook_id)) {
        req.flash('danger', 'Webhook not found.');
        return res.redirect('/webhooks');
    }

    try {
        await Webhook.deleteOne({ _id: hook_id, user_id });
        req.flash('info', 'Webhook deleted.');
        res.redirect('/webhooks');
    } catch (err) {
        next(err);
    }
});

// ============ REST API ============
router.get('/api/v1/expenses', async (req, res) => {
    if (!req.session.user_id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const rows = await Expense.find({ user_id: req.session.user_id })
            .sort({ date: -1 })
            .limit(50);
        res.json(rows.map(r => {
            const o = r.toObject();
            o.id = o._id.toString();
            return o;
        }));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/api/v1/expenses', async (req, res) => {
    if (!req.session.user_id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const data = req.body;
    if (!data || data.amount === undefined) {
        return res.status(400).json({ error: 'Amount is required' });
    }

    const [valid, result] = validate_amount(data.amount);
    if (!valid) {
        return res.status(400).json({ error: result });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    try {
        const newExpense = new Expense({
            user_id: req.session.user_id,
            amount: result,
            category: data.category || 'Other',
            description: data.description || '',
            date: data.date || todayStr
        });
        await newExpense.save();

        const { cache_clear_user } = require('../src/helpers');
        cache_clear_user(req.session.user_id);

        // Dispatch webhook async
        dispatch_webhooks(req.session.user_id, 'expense.created', data)
            .catch(e => console.error("Webhook dispatch error:", e));

        res.status(201).json({ status: 'created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/api/v1/stats', async (req, res) => {
    if (!req.session.user_id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const user_id = req.session.user_id;

    try {
        const totalRow = await Expense.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(user_id) } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const total = totalRow[0]?.total || 0;

        const count = await Expense.countDocuments({ user_id });

        const topCatRow = await Expense.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(user_id) } },
            { $group: { _id: '$category', total: { $sum: '$amount' } } },
            { $sort: { total: -1 } },
            { $limit: 1 }
        ]);
        const top_category = topCatRow[0] ? { category: topCatRow[0]._id, total: topCatRow[0].total } : null;

        res.json({
            total_spent: total,
            total_expenses: count,
            top_category
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
module.exports.dispatch_webhooks = dispatch_webhooks;
