const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { SmartRule, Tag } = require('../models');

async function apply_smart_rules(user_id, description, category = null, tag_ids = []) {
    if (!description) return { category, tag_ids };

    try {
        const rules = await SmartRule.find({ user_id, is_active: true }).sort({ priority: -1, _id: 1 });

        for (const rule of rules) {
            try {
                const regex = new RegExp(rule.pattern, 'i');
                if (regex.test(description)) {
                    if (rule.category) {
                        category = rule.category;
                    }
                    if (rule.tags) {
                        const rule_tag_ids = rule.tags.split(',')
                            .map(t => t.trim())
                            .filter(t => mongoose.isValidObjectId(t));
                        
                        // Merge tag IDs ensuring unique values
                        tag_ids = [...new Set([...(tag_ids || []), ...rule_tag_ids])];
                    }
                    break; // First matching rule wins
                }
            } catch (regexErr) {
                // Ignore invalid regex pattern in db
            }
        }
    } catch (err) {
        console.error("Error applying smart rules:", err);
    }

    return { category, tag_ids };
}

router.get('/rules', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;

    try {
        const rules = await SmartRule.find({ user_id }).sort({ priority: -1, _id: 1 });
        const tags = await Tag.find({ user_id }).sort({ name: 1 });

        const plainRules = rules.map(r => {
            const o = r.toObject();
            o.id = o._id.toString();
            return o;
        });

        res.render('rules.html', {
            rules: plainRules,
            tags: tags.map(t => {
                const o = t.toObject();
                o.id = o._id.toString();
                return o;
            })
        });
    } catch (err) {
        next(err);
    }
});

router.post('/rules/add', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;

    const name = (req.body.name || '').trim();
    const pattern = (req.body.pattern || '').trim();
    const category = req.body.category || '';
    let tag_ids = req.body.tag_ids || [];
    if (!Array.isArray(tag_ids)) {
        tag_ids = [tag_ids];
    }
    const tags_str = tag_ids.length > 0 ? tag_ids.join(',') : null;

    if (!name || !pattern) {
        req.flash('danger', 'Rule name and pattern are required.');
        return res.redirect('/rules');
    }

    if (pattern.length > 200) {
        req.flash('danger', 'Pattern must be 200 characters or fewer.');
        return res.redirect('/rules');
    }

    // Validate the pattern compiles and guard against ReDoS
    try {
        new RegExp(pattern, 'i');
    } catch (regexErr) {
        req.flash('danger', 'Invalid regex pattern. Please check your syntax.');
        return res.redirect('/rules');
    }
    // Block patterns with dangerous nested quantifiers
    if (/\(.[*+?]\)[+*?]/.test(pattern)) {
        req.flash('danger', 'Pattern uses nested quantifiers which can cause performance issues. Please simplify.');
        return res.redirect('/rules');
    }

    try {
        const newRule = new SmartRule({
            user_id,
            name,
            pattern,
            category: category || null,
            tags: tags_str
        });
        await newRule.save();

        req.flash('success', `Rule "${name}" created!`);
        res.redirect('/rules');
    } catch (err) {
        next(err);
    }
});

router.post('/rules/:id/toggle', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const rule_id = req.params.id;

    if (!mongoose.isValidObjectId(rule_id)) {
        req.flash('danger', 'Rule not found.');
        return res.redirect('/rules');
    }

    try {
        const rule = await SmartRule.findOne({ _id: rule_id, user_id });
        if (rule) {
            rule.is_active = !rule.is_active;
            await rule.save();
        }
        res.redirect('/rules');
    } catch (err) {
        next(err);
    }
});

router.post('/rules/:id/delete', async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    const user_id = req.session.user_id;
    const rule_id = req.params.id;

    if (!mongoose.isValidObjectId(rule_id)) {
        req.flash('danger', 'Rule not found.');
        return res.redirect('/rules');
    }

    try {
        await SmartRule.deleteOne({ _id: rule_id, user_id });
        req.flash('info', 'Rule deleted.');
        res.redirect('/rules');
    } catch (err) {
        next(err);
    }
});

// ------------------------------------------------------------------ //
// JSON API Endpoint                                                  //
// ------------------------------------------------------------------ //
router.get('/api/rules', async (req, res) => {
    if (!req.session.user_id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const rules = await SmartRule.find({ user_id: req.session.user_id }).sort({ priority: -1, _id: 1 }).lean();
        const tags = await Tag.find({ user_id: req.session.user_id }).sort({ name: 1 }).lean();
        res.json({
            rules: rules.map(r => ({
                id: r._id.toString(),
                name: r.name,
                pattern: r.pattern,
                category: r.category,
                is_active: r.is_active
            })),
            tags: tags.map(t => ({
                id: t._id.toString(),
                name: t.name,
                color: t.color
            }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/api/rules', async (req, res) => {
    if (!req.session.user_id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const user_id = req.session.user_id;
    const name = (req.body.name || '').trim();
    const pattern = (req.body.pattern || '').trim();
    const category = req.body.category || '';
    let tag_ids = req.body.tag_ids || [];
    if (!Array.isArray(tag_ids)) tag_ids = [tag_ids];
    const tags_str = tag_ids.length > 0 ? tag_ids.join(',') : null;

    if (!name || !pattern) {
        return res.status(400).json({ error: 'Rule name and pattern are required.' });
    }
    if (pattern.length > 200) {
        return res.status(400).json({ error: 'Pattern must be 200 characters or fewer.' });
    }
    try { new RegExp(pattern, 'i'); } catch (e) {
        return res.status(400).json({ error: 'Invalid regex pattern.' });
    }
    if (/\(.[*+?]\)[+*?]/.test(pattern)) {
        return res.status(400).json({ error: 'Pattern uses nested quantifiers.' });
    }

    try {
        const newRule = new SmartRule({ user_id, name, pattern, category: category || null, tags: tags_str });
        await newRule.save();
        return res.json({ success: true, id: newRule._id.toString() });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.post('/api/rules/:id/toggle', async (req, res) => {
    if (!req.session.user_id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ error: 'Rule not found.' });
    }
    try {
        const rule = await SmartRule.findOne({ _id: req.params.id, user_id: req.session.user_id });
        if (rule) {
            rule.is_active = !rule.is_active;
            await rule.save();
        }
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.delete('/api/rules/:id', async (req, res) => {
    if (!req.session.user_id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ error: 'Rule not found.' });
    }
    try {
        await SmartRule.deleteOne({ _id: req.params.id, user_id: req.session.user_id });
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
module.exports.apply_smart_rules = apply_smart_rules;
