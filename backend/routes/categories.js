const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { CustomCategory, Expense } = require('../models');
const { is_valid_hex_color } = require('../src/helpers');

router.get('/categories', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;

    try {
        const cats = await CustomCategory.find({ user_id }).sort({ name: 1 }).lean();

        const usageCounts = await Expense.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(user_id) } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        const usageMap = {};
        for (const uc of usageCounts) {
            usageMap[uc._id] = uc.count;
        }

        const cats_data = cats.map(cat => ({
            ...cat,
            id: cat._id.toString(),
            usage_count: usageMap[cat.name] || 0
        }));

        res.render('categories.html', { categories: cats_data });
    } catch (err) {
        next(err);
    }
});

router.post('/categories/add', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const name = (req.body.name || '').trim();
    const icon = (req.body.icon || 'category').trim();
    const color = (req.body.color || '#6366f1').trim();

    if (!name || name.length < 2) {
        req.flash('danger', 'Category name must be at least 2 characters.');
        return res.redirect('/categories');
    }

    if (!is_valid_hex_color(color)) {
        req.flash('danger', 'Invalid category color.');
        return res.redirect('/categories');
    }

    try {
        const newCat = new CustomCategory({
            user_id,
            name,
            icon,
            color
        });
        await newCat.save();
        req.flash('success', `Category "${name}" created!`);
    } catch (err) {
        if (err.code === 11000) {
            req.flash('danger', `Category "${name}" already exists.`);
        } else {
            return next(err);
        }
    }
    res.redirect('/categories');
});

router.post('/categories/:id/edit', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const cat_id = req.params.id;

    if (!mongoose.isValidObjectId(cat_id)) {
        req.flash('danger', 'Category not found.');
        return res.redirect('/categories');
    }

    const name = (req.body.name || '').trim();
    const icon = (req.body.icon || 'category').trim();
    const color = (req.body.color || '#6366f1').trim();

    if (!name || name.length < 2) {
        req.flash('danger', 'Category name must be at least 2 characters.');
        return res.redirect('/categories');
    }

    if (!is_valid_hex_color(color)) {
        req.flash('danger', 'Invalid category color.');
        return res.redirect('/categories');
    }

    try {
        const oldCat = await CustomCategory.findOne({ _id: cat_id, user_id });
        if (!oldCat) {
            req.flash('danger', 'Category not found.');
            return res.redirect('/categories');
        }

        // Update all expenses with old name to the new name
        await Expense.updateMany(
            { user_id: new mongoose.Types.ObjectId(user_id), category: oldCat.name },
            { category: name }
        );

        oldCat.name = name;
        oldCat.icon = icon;
        oldCat.color = color;
        await oldCat.save();

        req.flash('success', `Category updated to "${name}"!`);
    } catch (err) {
        if (err.code === 11000) {
            req.flash('danger', `Category "${name}" already exists.`);
        } else {
            return next(err);
        }
    }
    res.redirect('/categories');
});

router.post('/categories/:id/delete', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const cat_id = req.params.id;

    if (!mongoose.isValidObjectId(cat_id)) {
        req.flash('danger', 'Category not found.');
        return res.redirect('/categories');
    }

    try {
        const cat = await CustomCategory.findOne({ _id: cat_id, user_id });
        if (!cat) {
            req.flash('danger', 'Category not found.');
            return res.redirect('/categories');
        }

        // Reassign expenses from this category to "Other"
        await Expense.updateMany(
            { user_id: new mongoose.Types.ObjectId(user_id), category: cat.name },
            { category: 'Other' }
        );

        await CustomCategory.deleteOne({ _id: cat_id, user_id: new mongoose.Types.ObjectId(user_id) });
        req.flash('info', `Category "${cat.name}" deleted. Expenses reassigned to Other.`);
    } catch (err) {
        return next(err);
    }
    res.redirect('/categories');
});

router.get('/api/categories', async (req, res) => {
    if (!req.session.user_id) {
        return res.json([]);
    }
    try {
        const cats = await CustomCategory.find({ user_id: req.session.user_id }).sort({ name: 1 }).lean();
        res.json(cats.map(c => ({
            id: c._id.toString(),
            name: c.name
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
