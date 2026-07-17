const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { User } = require('../models');
const { CURRENCY_CHOICES } = require('../src/helpers');

const isVercel = process.env.VERCEL;
const uploadFolder = isVercel
    ? '/tmp/uploads/profile_pics'
    : path.join(__dirname, '../static/uploads/profile_pics');

fs.mkdirSync(uploadFolder, { recursive: true });

const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadFolder);
    },
    filename: (req, file, cb) => {
        const uniqueName = `user_${req.session.user_id}_${Date.now()}_${path.basename(file.originalname).replace(/\s+/g, '_')}`;
        cb(null, uniqueName);
    }
});

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp'];

const profileUpload = multer({
    storage: profileStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Please upload an image (PNG, JPEG, GIF, WebP, or BMP).'), false);
        }
    }
});

router.get('/profile', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    try {
        const user = await User.findById(req.session.user_id);
        const userObj = user ? user.toObject() : null;
        if (userObj) userObj.id = userObj._id.toString();

        res.render('profile.html', {
            user: userObj,
            currencies: CURRENCY_CHOICES
        });
    } catch (err) {
        next(err);
    }
});

router.post('/profile', profileUpload.single('profile_photo'), async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;

    const new_name = (req.body.name || '').trim();
    const new_email = (req.body.email || '').trim().toLowerCase();
    const new_phone = (req.body.phone || '').trim();
    const new_currency = (req.body.preferred_currency || 'INR').trim();

    if (!new_name || new_name.length < 2) {
        req.flash('danger', 'Name must be at least 2 characters.');
        return res.redirect('/profile');
    }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(new_email)) {
        req.flash('danger', 'Invalid email address.');
        return res.redirect('/profile');
    }

    try {
        const user = await User.findById(user_id);
        if (!user) {
            req.flash('danger', 'User not found.');
            return res.redirect('/login');
        }

        // Email conflict check
        const conflict = await User.findOne({ email: new_email, _id: { $ne: user_id } });
        if (conflict) {
            req.flash('danger', 'Email address already in use.');
            return res.redirect('/profile');
        }

        let new_avatar_url = user.avatar_url;
        if (req.file) {
            new_avatar_url = `/uploads/profile_pics/${req.file.filename}`;
        }

        user.name = new_name;
        user.email = new_email;
        user.phone = new_phone;
        user.avatar_url = new_avatar_url;
        user.preferred_currency = new_currency;

        await user.save();

        req.session.user_name = new_name;
        req.flash('success', 'Profile updated successfully!');
        res.redirect('/profile');
    } catch (err) {
        next(err);
    }
});

// ------------------------------------------------------------------ //
// JSON API Endpoint                                                  //
// ------------------------------------------------------------------ //
router.get('/api/profile', async (req, res) => {
    if (!req.session.user_id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const user = await User.findById(req.session.user_id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                preferred_currency: user.preferred_currency || 'INR',
                avatar_url: user.avatar_url || '',
                oauth_provider: user.oauth_provider || ''
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/api/profile', profileUpload.single('profile_photo'), async (req, res) => {
    if (!req.session.user_id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const user_id = req.session.user_id;

    const new_name = (req.body.name || '').trim();
    const new_email = (req.body.email || '').trim().toLowerCase();
    const new_phone = (req.body.phone || '').trim();
    const new_currency = (req.body.preferred_currency || 'INR').trim();

    if (!new_name || new_name.length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(new_email)) {
        return res.status(400).json({ error: 'Invalid email address.' });
    }

    try {
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const conflict = await User.findOne({ email: new_email, _id: { $ne: user_id } });
        if (conflict) {
            return res.status(400).json({ error: 'Email address already in use.' });
        }

        let new_avatar_url = user.avatar_url;
        if (req.file) {
            new_avatar_url = `/uploads/profile_pics/${req.file.filename}`;
        }

        user.name = new_name;
        user.email = new_email;
        user.phone = new_phone;
        user.avatar_url = new_avatar_url;
        user.preferred_currency = new_currency;
        await user.save();

        req.session.user_name = new_name;
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
