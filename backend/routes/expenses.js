const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Expense, RecurringExpense, Account, Tag, CustomCategory, Receipt } = require('../models');
const { validate_amount, cache_clear_user, CURRENCY_CHOICES } = require('../src/helpers');
const { process_receipt } = require('../src/ocr_engine');
const { apply_smart_rules } = require('./rules');

// Set up file upload destination based on environment
const isVercel = process.env.VERCEL;
const receiptFolder = isVercel
    ? '/tmp/uploads/receipts'
    : path.join(__dirname, '../static/uploads/receipts');

fs.mkdirSync(receiptFolder, { recursive: true });

const receiptStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, receiptFolder);
    },
    filename: (req, file, cb) => {
        const uniqueName = `receipt_${req.session.user_id}_${Date.now()}_${path.basename(file.originalname).replace(/\s+/g, '_')}`;
        cb(null, uniqueName);
    }
});

const receiptUpload = multer({
    storage: receiptStorage,
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(null, false);
        }
    }
});

// ------------------------------------------------------------------ //
// Expense CRUD Routes                                                //
// ------------------------------------------------------------------ //
router.get('/expenses/add', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;

    try {
        const user = await mongoose.model('User').findById(user_id);
        const preferred_currency = user?.preferred_currency || 'INR';

        const accounts = await Account.find({ user_id, is_active: true }).sort({ name: 1 });
        const custom_cats = await CustomCategory.find({ user_id }).sort({ name: 1 });
        const tags = await Tag.find({ user_id }).sort({ name: 1 });

        const custom_category_names = custom_cats.map(c => c.name);

        res.render('add_expense.html', {
            currencies: CURRENCY_CHOICES,
            preferred_currency,
            accounts: accounts.map(a => {
                const o = a.toObject();
                o.id = o._id.toString();
                return o;
            }),
            tags: tags.map(t => {
                const o = t.toObject();
                o.id = o._id.toString();
                return o;
            }),
            custom_categories: custom_category_names
        });
    } catch (err) {
        next(err);
    }
});

router.post('/expenses/add', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;

    const [valid, result] = validate_amount(req.body.amount);
    if (!valid) {
        req.flash('danger', result);
        return res.redirect('/expenses/add');
    }

    const amount = result;
    let category = req.body.category;
    const payment_method = req.body.payment_method || 'Cash';
    const description = req.body.description || '';
    const date = req.body.date;
    const currency = req.body.currency;
    const account_id = req.body.account_id && mongoose.isValidObjectId(req.body.account_id) ? req.body.account_id : null;
    let tag_ids = req.body.tag_ids || [];
    if (!Array.isArray(tag_ids)) {
        tag_ids = [tag_ids];
    }

    try {
        // Apply smart rules
        const rulesResult = await apply_smart_rules(user_id, description, category, tag_ids);
        category = rulesResult.category;
        tag_ids = rulesResult.tag_ids;

        const newExpense = new Expense({
            user_id,
            amount,
            category,
            payment_method,
            description,
            date,
            currency,
            account_id,
            tags: tag_ids.filter(t => mongoose.isValidObjectId(t))
        });
        await newExpense.save();

        cache_clear_user(user_id);
        req.flash('success', 'Expense added!');
        res.redirect('/dashboard');
    } catch (err) {
        next(err);
    }
});

router.get('/expenses/:id/edit', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const expense_id = req.params.id;

    if (!mongoose.isValidObjectId(expense_id)) {
        req.flash('danger', 'Expense not found.');
        return res.redirect('/dashboard');
    }

    try {
        const expense = await Expense.findOne({ _id: expense_id, user_id });
        if (!expense) {
            req.flash('danger', 'Expense not found.');
            return res.redirect('/dashboard');
        }

        const accounts = await Account.find({ user_id, is_active: true }).sort({ name: 1 });
        const tags = await Tag.find({ user_id }).sort({ name: 1 });
        const custom_cats = await CustomCategory.find({ user_id }).sort({ name: 1 });

        const selected_tag_ids = new Set(expense.tags.map(t => t.toString()));
        const custom_category_names = custom_cats.map(c => c.name);

        const expObj = expense.toObject();
        expObj.id = expObj._id.toString();
        if (expObj.account_id) expObj.account_id = expObj.account_id.toString();

        res.render('edit_expense.html', {
            expense: expObj,
            currencies: CURRENCY_CHOICES,
            accounts: accounts.map(a => {
                const o = a.toObject();
                o.id = o._id.toString();
                return o;
            }),
            tags: tags.map(t => {
                const o = t.toObject();
                o.id = o._id.toString();
                return o;
            }),
            selected_tag_ids,
            custom_categories: custom_category_names
        });
    } catch (err) {
        next(err);
    }
});

router.post('/expenses/:id/edit', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const expense_id = req.params.id;

    if (!mongoose.isValidObjectId(expense_id)) {
        req.flash('danger', 'Expense not found.');
        return res.redirect('/dashboard');
    }

    const [valid, result] = validate_amount(req.body.amount);
    if (!valid) {
        req.flash('danger', result);
        return res.redirect(`/expenses/${expense_id}/edit`);
    }

    const amount = result;
    const category = req.body.category;
    const payment_method = req.body.payment_method || 'Cash';
    const description = req.body.description || '';
    const date = req.body.date;
    const currency = req.body.currency;
    const account_id = req.body.account_id && mongoose.isValidObjectId(req.body.account_id) ? req.body.account_id : null;
    let tag_ids = req.body.tag_ids || [];
    if (!Array.isArray(tag_ids)) {
        tag_ids = [tag_ids];
    }

    try {
        const expense = await Expense.findOne({ _id: expense_id, user_id });
        if (!expense) {
            req.flash('danger', 'Expense not found.');
            return res.redirect('/dashboard');
        }

        expense.amount = amount;
        expense.category = category;
        expense.payment_method = payment_method;
        expense.description = description;
        expense.date = date;
        expense.currency = currency;
        expense.account_id = account_id;
        expense.tags = tag_ids.filter(t => mongoose.isValidObjectId(t));

        await expense.save();

        cache_clear_user(user_id);
        req.flash('success', 'Expense updated!');
        res.redirect('/dashboard');
    } catch (err) {
        next(err);
    }
});

router.post('/expenses/:id/delete', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const expense_id = req.params.id;

    if (!mongoose.isValidObjectId(expense_id)) {
        req.flash('danger', 'Expense not found.');
        return res.redirect('/dashboard');
    }

    try {
        await Expense.deleteOne({ _id: expense_id, user_id });
        // Also clean up any linked splits or receipts
        await Receipt.updateMany({ expense_id }, { expense_id: null });
        await mongoose.model('BillSplit').deleteMany({ expense_id });

        cache_clear_user(user_id);
        req.flash('info', 'Expense deleted.');
        res.redirect('/dashboard');
    } catch (err) {
        next(err);
    }
});

// ------------------------------------------------------------------ //
// Recurring Expenses Routes                                          //
// ------------------------------------------------------------------ //
router.get('/recurring', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;

    try {
        const recurring = await RecurringExpense.find({ user_id });
        const user = await mongoose.model('User').findById(user_id);
        const preferred_currency = user?.preferred_currency || 'INR';

        const plainRecurring = recurring.map(r => {
            const o = r.toObject();
            o.id = o._id.toString();
            return o;
        });

        res.render('recurring.html', {
            recurring: plainRecurring,
            currencies: CURRENCY_CHOICES,
            preferred_currency
        });
    } catch (err) {
        next(err);
    }
});

router.post('/recurring/add', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;

    const [valid, result] = validate_amount(req.body.amount);
    if (!valid) {
        req.flash('danger', result);
        return res.redirect('/recurring');
    }
    const amount = result;
    const category = req.body.category;
    const payment_method = req.body.payment_method || 'Cash';
    const description = req.body.description || '';
    const day = parseInt(req.body.day_of_month || '', 10);
    const currency = req.body.currency;

    if (isNaN(day) || day < 1 || day > 28) {
        req.flash('danger', 'Day of month must be between 1 and 28.');
        return res.redirect('/recurring');
    }

    try {
        const newRec = new RecurringExpense({
            user_id,
            amount,
            category,
            payment_method,
            description,
            day_of_month: day,
            currency
        });
        await newRec.save();

        cache_clear_user(user_id);
        req.flash('success', 'Recurring expense scheduled!');
        res.redirect('/recurring');
    } catch (err) {
        next(err);
    }
});

router.post('/recurring/:id/delete', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const rec_id = req.params.id;

    if (!mongoose.isValidObjectId(rec_id)) {
        req.flash('danger', 'Recurring expense not found.');
        return res.redirect('/recurring');
    }

    try {
        await RecurringExpense.deleteOne({ _id: rec_id, user_id });
        cache_clear_user(user_id);
        req.flash('info', 'Recurring expense removed.');
        res.redirect('/recurring');
    } catch (err) {
        next(err);
    }
});

// ------------------------------------------------------------------ //
// Export Route                                                       //
// ------------------------------------------------------------------ //
router.get('/expenses/export', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    try {
        const rows = await Expense.find({ user_id: req.session.user_id }).sort({ date: -1 });
        let csvContent = 'Date,Category,Description,Amount,Currency\r\n';
        for (const r of rows) {
            const date = r.date || '';
            const category = r.category || '';
            const description = (r.description || '').replace(/"/g, '""');
            const amount = Number(r.amount).toFixed(2);
            const currency = r.currency || 'INR';
            csvContent += `${date},${category},"${description}",${amount},${currency}\r\n`;
        }
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=spendly_expenses.csv');
        res.send(csvContent);
    } catch (err) {
        next(err);
    }
});

// ------------------------------------------------------------------ //
// Receipt Scan & Gallery Routes                                      //
// ------------------------------------------------------------------ //
router.get('/receipt/scan', (req, res) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    res.render('scan_receipt.html', { ocr_result: null });
});

router.post('/receipt/scan', receiptUpload.single('receipt'), async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;

    if (!req.file) {
        req.flash('danger', 'No receipt image uploaded.');
        return res.redirect('/receipt/scan');
    }

    try {
        const ocr_result = await process_receipt(req.file.path);
        const filename = req.file.filename;
        ocr_result.image_url = `/uploads/receipts/${filename}`;

        // Save receipt to DB
        const newReceipt = new Receipt({
            user_id,
            filename,
            original_name: req.file.originalname,
            filepath: req.file.path,
            amount: ocr_result.amount,
            category: ocr_result.category,
            raw_text: ocr_result.raw_text
        });
        await newReceipt.save();

        res.render('scan_receipt.html', { ocr_result });
    } catch (err) {
        req.flash('danger', `Scan failed: ${err.message}`);
        res.redirect('/receipt/scan');
    }
});

router.get('/receipts/gallery', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const page = parseInt(req.query.page || '1', 10);
    const per_page = 20;

    try {
        const count = await Receipt.countDocuments({ user_id });
        const total_pages = Math.max(1, Math.ceil(count / per_page));
        const active_page = Math.max(1, Math.min(page, total_pages));
        const offset = (active_page - 1) * per_page;

        const receipts = await Receipt.find({ user_id })
            .sort({ created_at: -1 })
            .skip(offset)
            .limit(per_page)
            .populate('expense_id');

        const user = await mongoose.model('User').findById(user_id);
        const preferred_currency = user?.preferred_currency || 'INR';

        const plainReceipts = receipts.map(r => {
            const o = r.toObject();
            o.id = o._id.toString();
            if (o.expense_id) {
                o.expense_id.id = o.expense_id._id.toString();
                o.expense_desc = o.expense_id.description;
                o.expense_amount = o.expense_id.amount;
                o.expense_date = o.expense_id.date;
            }
            return o;
        });

        // Fetch recent 20 expenses for linking dropdown
        const recentExpenses = await Expense.find({ user_id })
            .sort({ date: -1 })
            .limit(20);

        res.render('receipt_gallery.html', {
            receipts: plainReceipts,
            page: active_page,
            total_pages,
            total_receipts: count,
            preferred_currency,
            recent_expenses: recentExpenses.map(e => {
                const o = e.toObject();
                o.id = o._id.toString();
                return o;
            })
        });
    } catch (err) {
        next(err);
    }
});

router.post('/receipts/:id/link-expense', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const receipt_id = req.params.id;
    const expense_id = req.body.expense_id;

    if (!mongoose.isValidObjectId(receipt_id) || !mongoose.isValidObjectId(expense_id)) {
        req.flash('danger', 'Invalid receipt or expense ID.');
        return res.redirect('/receipts/gallery');
    }

    try {
        const receipt = await Receipt.findOne({ _id: receipt_id, user_id });
        if (!receipt) {
            req.flash('danger', 'Receipt not found.');
            return res.redirect('/receipts/gallery');
        }

        const expense = await Expense.findOne({ _id: expense_id, user_id });
        if (!expense) {
            req.flash('danger', 'Expense not found.');
            return res.redirect('/receipts/gallery');
        }

        receipt.expense_id = expense_id;
        await receipt.save();

        req.flash('success', 'Receipt linked to expense!');
        res.redirect('/receipts/gallery');
    } catch (err) {
        next(err);
    }
});

router.post('/receipts/:id/delete', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const receipt_id = req.params.id;

    if (!mongoose.isValidObjectId(receipt_id)) {
        req.flash('danger', 'Receipt not found.');
        return res.redirect('/receipts/gallery');
    }

    try {
        const receipt = await Receipt.findOne({ _id: receipt_id, user_id });
        if (!receipt) {
            req.flash('danger', 'Receipt not found.');
            return res.redirect('/receipts/gallery');
        }

        // Delete file on disk
        if (receipt.filepath && receipt.filepath.startsWith(receiptFolder)) {
            try {
                await fs.promises.unlink(receipt.filepath);
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    console.error("Error deleting receipt file:", err);
                }
            }
        }

        await Receipt.deleteOne({ _id: receipt_id, user_id });
        req.flash('info', 'Receipt deleted.');
        res.redirect('/receipts/gallery');
    } catch (err) {
        next(err);
    }
});

module.exports = router;
