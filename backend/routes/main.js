const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('landing.html');
});

router.get('/terms', (req, res) => {
    res.render('terms.html');
});

router.get('/privacy', (req, res) => {
    res.render('privacy.html');
});

router.get('/features', (req, res) => {
    res.render('features.html');
});

router.get('/pricing', (req, res) => {
    res.render('pricing.html');
});

router.get('/ocr', (req, res) => {
    res.render('ocr.html');
});

router.get('/export', (req, res) => {
    res.render('export_info.html');
});

router.get('/about', (req, res) => {
    res.render('about.html');
});

router.get('/blog', (req, res) => {
    res.render('blog.html');
});

router.get('/careers', (req, res) => {
    res.render('careers.html');
});

module.exports = router;
