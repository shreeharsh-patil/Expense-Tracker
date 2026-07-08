const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Tag, Expense } = require('../models');
const { is_valid_hex_color } = require('../src/helpers');

router.get('/tags', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;

    try {
        const tags = await Tag.find({ user_id }).lean();

        const usageCounts = await Expense.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(user_id) } },
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } }
        ]);
        const usageMap = {};
        for (const uc of usageCounts) {
            usageMap[uc._id.toString()] = uc.count;
        }

        const tags_data = tags.map(tag => ({
            ...tag,
            id: tag._id.toString(),
            usage_count: usageMap[tag._id.toString()] || 0
        }));

        // Sort by usage_count DESC, then name ASC
        tags_data.sort((a, b) => {
            if (b.usage_count !== a.usage_count) {
                return b.usage_count - a.usage_count;
            }
            return a.name.localeCompare(b.name);
        });

        res.render('tags.html', { tags: tags_data });
    } catch (err) {
        next(err);
    }
});

router.post('/tags/add', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const name = (req.body.name || '').trim();
    const color = req.body.color || '#6366f1';

    if (!name) {
        req.flash('danger', 'Tag name is required.');
        return res.redirect('/tags');
    }

    if (!is_valid_hex_color(color)) {
        req.flash('danger', 'Invalid tag color.');
        return res.redirect('/tags');
    }

    try {
        const newTag = new Tag({
            user_id,
            name,
            color
        });
        await newTag.save();
        req.flash('success', `Tag "${name}" created!`);
    } catch (err) {
        if (err.code === 11000) {
            req.flash('danger', `Tag "${name}" already exists.`);
        } else {
            return next(err);
        }
    }
    res.redirect('/tags');
});

router.post('/tags/:id/delete', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const tag_id = req.params.id;

    if (!mongoose.isValidObjectId(tag_id)) {
        req.flash('danger', 'Tag not found.');
        return res.redirect('/tags');
    }

    try {
        // Pull tag from all user expenses
        await Expense.updateMany(
            { user_id: new mongoose.Types.ObjectId(user_id) },
            { $pull: { tags: new mongoose.Types.ObjectId(tag_id) } }
        );

        // Delete tag
        await Tag.deleteOne({ _id: tag_id, user_id });
        req.flash('info', 'Tag deleted.');
    } catch (err) {
        return next(err);
    }
    res.redirect('/tags');
});

router.get('/api/tags', async (req, res) => {
    if (!req.session.user_id) {
        return res.json([]);
    }
    try {
        const tags = await Tag.find({ user_id: req.session.user_id }).sort({ name: 1 }).lean();
        res.json(tags.map(t => ({
            id: t._id.toString(),
            name: t.name,
            color: t.color
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/tags/expense/:expense_id/set', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const expense_id = req.params.expense_id;

    if (!mongoose.isValidObjectId(expense_id)) {
        req.flash('danger', 'Expense not found.');
        return res.redirect('/dashboard');
    }

    let tag_ids = req.body.tag_ids || [];
    if (!Array.isArray(tag_ids)) {
        tag_ids = [tag_ids];
    }
    const validTagIds = tag_ids.filter(t => mongoose.isValidObjectId(t));

    try {
        const expense = await Expense.findOne({ _id: expense_id, user_id });
        if (!expense) {
            req.flash('danger', 'Expense not found.');
            return res.redirect('/dashboard');
        }

        expense.tags = validTagIds;
        await expense.save();

        req.flash('success', 'Tags updated!');
        res.redirect(req.get('referrer') || '/dashboard');
    } catch (err) {
        next(err);
    }
});

module.exports = router;
