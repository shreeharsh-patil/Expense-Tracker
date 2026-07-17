const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Income, Account, User } = require('../models');
const { validate_amount, is_valid_date, cache_clear_user, CURRENCY_CHOICES } = require('../src/helpers');

const INCOME_SOURCES = ['Salary', 'Freelance', 'Business', 'Investments', 'Rent', 'Refund', 'Gift', 'Other'];

router.get('/income/add', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;

    try {
        const user = await User.findById(user_id);
        const preferred_currency = user?.preferred_currency || 'INR';
        const accounts = await Account.find({ user_id, is_active: true }).sort({ name: 1 });

        res.render('add_income.html', {
            sources: INCOME_SOURCES,
            currencies: CURRENCY_CHOICES,
            preferred_currency,
            accounts: accounts.map(a => {
                const o = a.toObject();
                o.id = o._id.toString();
                return o;
            })
        });
    } catch (err) {
        next(err);
    }
});

router.post('/income/add', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;

    const [valid, result] = validate_amount(req.body.amount);
    if (!valid) {
        req.flash('danger', result);
        return res.redirect('/income/add');
    }

    const amount = result;
    const source = req.body.source || 'Other';
    const description = req.body.description || '';
    const date = req.body.date;
    const currency = req.body.currency;
    const account_id = req.body.account_id && mongoose.isValidObjectId(req.body.account_id) ? req.body.account_id : null;

    if (!is_valid_date(date)) {
        req.flash('danger', 'Invalid date format. Use YYYY-MM-DD.');
        return res.redirect('/income/add');
    }

    try {
        const newIncome = new Income({
            user_id,
            amount,
            source,
            description,
            date,
            currency,
            account_id
        });
        await newIncome.save();

        cache_clear_user(user_id);
        req.flash('success', 'Income recorded!');
        res.redirect('/dashboard');
    } catch (err) {
        next(err);
    }
});

router.get('/income/:id/edit', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const income_id = req.params.id;

    if (!mongoose.isValidObjectId(income_id)) {
        req.flash('danger', 'Income entry not found.');
        return res.redirect('/dashboard');
    }

    try {
        const income = await Income.findOne({ _id: income_id, user_id });
        if (!income) {
            req.flash('danger', 'Income entry not found.');
            return res.redirect('/dashboard');
        }

        const accounts = await Account.find({ user_id, is_active: true }).sort({ name: 1 });

        const incObj = income.toObject();
        incObj.id = incObj._id.toString();
        if (incObj.account_id) incObj.account_id = incObj.account_id.toString();

        res.render('edit_income.html', {
            income: incObj,
            sources: INCOME_SOURCES,
            currencies: CURRENCY_CHOICES,
            accounts: accounts.map(a => {
                const o = a.toObject();
                o.id = o._id.toString();
                return o;
            })
        });
    } catch (err) {
        next(err);
    }
});

router.post('/income/:id/edit', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const income_id = req.params.id;

    if (!mongoose.isValidObjectId(income_id)) {
        req.flash('danger', 'Income entry not found.');
        return res.redirect('/dashboard');
    }

    const [valid, result] = validate_amount(req.body.amount);
    if (!valid) {
        req.flash('danger', result);
        return res.redirect(`/income/${income_id}/edit`);
    }

    const amount = result;
    const source = req.body.source || 'Other';
    const description = req.body.description || '';
    const date = req.body.date;
    const currency = req.body.currency;
    const account_id = req.body.account_id && mongoose.isValidObjectId(req.body.account_id) ? req.body.account_id : null;

    try {
        const income = await Income.findOne({ _id: income_id, user_id });
        if (!income) {
            req.flash('danger', 'Income entry not found.');
            return res.redirect('/dashboard');
        }

        income.amount = amount;
        income.source = source;
        income.description = description;
        income.date = date;
        income.currency = currency;
        income.account_id = account_id;

        await income.save();

        cache_clear_user(user_id);
        req.flash('success', 'Income updated!');
        res.redirect('/dashboard');
    } catch (err) {
        next(err);
    }
});

router.post('/income/:id/delete', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const income_id = req.params.id;

    if (!mongoose.isValidObjectId(income_id)) {
        req.flash('danger', 'Income entry not found.');
        return res.redirect('/dashboard');
    }

    try {
        await Income.deleteOne({ _id: income_id, user_id });
        cache_clear_user(user_id);
        req.flash('info', 'Income entry deleted.');
        res.redirect('/dashboard');
    } catch (err) {
        next(err);
    }
});

router.post('/api/income', async (req, res) => {
    if (!req.session.user_id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const user_id = req.session.user_id;

    const [valid, result] = validate_amount(req.body.amount);
    if (!valid) {
        return res.status(400).json({ error: result });
    }

    const amount = result;
    const source = req.body.source || 'Other';
    const description = req.body.description || '';
    const date = req.body.date;
    const currency = req.body.currency;
    const account_id = req.body.account_id && mongoose.isValidObjectId(req.body.account_id) ? req.body.account_id : null;

    if (!is_valid_date(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    try {
        const newIncome = new Income({ user_id, amount, source, description, date, currency, account_id });
        await newIncome.save();
        cache_clear_user(user_id);
        return res.json({ success: true, id: newIncome._id.toString() });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
