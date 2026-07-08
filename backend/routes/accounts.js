const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Account, Expense, Income, User } = require('../models');
const { CURRENCY_CHOICES } = require('../src/helpers');

const ACCOUNT_TYPES = ['bank', 'cash', 'credit_card', 'investment', 'wallet', 'other'];

router.get('/accounts', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;

    try {
        const accounts = await Account.find({ user_id }).sort({ is_active: -1, name: 1 });
        
        const spentByAccount = await Expense.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(user_id), account_id: { $ne: null } } },
            { $group: { _id: '$account_id', total: { $sum: '$amount' } } }
        ]);

        const earnedByAccount = await Income.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(user_id), account_id: { $ne: null } } },
            { $group: { _id: '$account_id', total: { $sum: '$amount' } } }
        ]);

        const spentMap = {};
        for (const row of spentByAccount) {
            if (row._id) spentMap[row._id.toString()] = row.total;
        }

        const earnedMap = {};
        for (const row of earnedByAccount) {
            if (row._id) earnedMap[row._id.toString()] = row.total;
        }

        const accounts_data = accounts.map(acc => {
            const accIdStr = acc._id.toString();
            const spent = spentMap[accIdStr] || 0;
            const earned = earnedMap[accIdStr] || 0;
            const accObj = acc.toObject();
            accObj.id = accIdStr;
            accObj.calculated_balance = earned - spent;
            return accObj;
        });

        const user = await User.findById(user_id);
        const preferred_currency = user?.preferred_currency || 'INR';

        res.render('accounts.html', {
            accounts: accounts_data,
            account_types: ACCOUNT_TYPES,
            currencies: CURRENCY_CHOICES,
            preferred_currency
        });
    } catch (err) {
        next(err);
    }
});

router.post('/accounts/add', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const name = (req.body.name || '').trim();
    let acc_type = req.body.type || 'bank';
    const currency = req.body.currency || 'INR';

    if (!name || name.length < 1) {
        req.flash('danger', 'Account name is required.');
        return res.redirect('/accounts');
    }
    if (!ACCOUNT_TYPES.includes(acc_type)) {
        acc_type = 'bank';
    }

    try {
        const newAcc = new Account({
            user_id,
            name,
            type: acc_type,
            currency
        });
        await newAcc.save();
        req.flash('success', `Account "${name}" created!`);
        res.redirect('/accounts');
    } catch (err) {
        next(err);
    }
});

router.post('/accounts/:id/edit', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const account_id = req.params.id;

    if (!mongoose.isValidObjectId(account_id)) {
        req.flash('danger', 'Account not found.');
        return res.redirect('/accounts');
    }

    const name = (req.body.name || '').trim();
    let acc_type = req.body.type || 'bank';
    const currency = req.body.currency || 'INR';
    const is_active = !!req.body.is_active;

    if (!name) {
        req.flash('danger', 'Account name is required.');
        return res.redirect('/accounts');
    }
    if (!ACCOUNT_TYPES.includes(acc_type)) {
        acc_type = 'bank';
    }

    try {
        const account = await Account.findOne({ _id: account_id, user_id });
        if (!account) {
            req.flash('danger', 'Account not found.');
            return res.redirect('/accounts');
        }

        account.name = name;
        account.type = acc_type;
        account.currency = currency;
        account.is_active = is_active;

        await account.save();
        req.flash('success', 'Account updated!');
        res.redirect('/accounts');
    } catch (err) {
        next(err);
    }
});

router.post('/accounts/:id/delete', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const account_id = req.params.id;

    if (!mongoose.isValidObjectId(account_id)) {
        req.flash('danger', 'Account not found.');
        return res.redirect('/accounts');
    }

    try {
        const account = await Account.findOne({ _id: account_id, user_id });
        if (!account) {
            req.flash('danger', 'Account not found.');
            return res.redirect('/accounts');
        }

        // Unlink transactions
        await Expense.updateMany({ account_id, user_id }, { account_id: null });
        await Income.updateMany({ account_id, user_id }, { account_id: null });

        await Account.deleteOne({ _id: account_id, user_id });
        req.flash('info', `Account "${account.name}" deleted.`);
        res.redirect('/accounts');
    } catch (err) {
        next(err);
    }
});

// ------------------------------------------------------------------ //
// JSON API Endpoint                                                  //
// ------------------------------------------------------------------ //
router.get('/api/accounts', async (req, res) => {
    if (!req.session.user_id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const accounts = await Account.find({ user_id: req.session.user_id }).sort({ is_active: -1, name: 1 }).lean();
        const spentByAccount = await Expense.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(req.session.user_id), account_id: { $ne: null } } },
            { $group: { _id: '$account_id', total: { $sum: '$amount' } } }
        ]);
        const earnedByAccount = await Income.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(req.session.user_id), account_id: { $ne: null } } },
            { $group: { _id: '$account_id', total: { $sum: '$amount' } } }
        ]);
        const spentMap = {};
        for (const row of spentByAccount) if (row._id) spentMap[row._id.toString()] = row.total;
        const earnedMap = {};
        for (const row of earnedByAccount) if (row._id) earnedMap[row._id.toString()] = row.total;

        const accounts_data = accounts.map(acc => ({
            id: acc._id.toString(),
            name: acc.name,
            type: acc.type,
            currency: acc.currency || 'INR',
            is_active: acc.is_active,
            calculated_balance: (earnedMap[acc._id.toString()] || 0) - (spentMap[acc._id.toString()] || 0)
        }));
        res.json(accounts_data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
