const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { User, EmailOtp } = require('../models');
const {
    is_rate_limited, record_login_attempt,
    generate_reset_token, verify_reset_token, consume_reset_token,
    generate_otp, get_otp_remaining_cooldown
} = require('../src/helpers');
const {
    send_otp_email, send_signin_confirmation, send_password_reset_email
} = require('../src/email_alerts');

// Helper to format date similar to Python's datetime.now().strftime('%B %d, %Y at %I:%M %p')
function formatCurrentTime() {
    const d = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${month} ${day}, ${year} at ${hours}:${minutes} ${ampm}`;
}

// ------------------------------------------------------------------ //
// OAuth Setup (Google + GitHub)                                      //
// ------------------------------------------------------------------ //
router.get('/login/:provider', (req, res) => {
    if (req.session.user_id) {
        return res.redirect('/dashboard');
    }
    const provider = req.params.provider;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const redirect_uri = `${protocol}://${req.get('host')}/authorize/${provider}`;

    if (provider === 'google') {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            req.flash('danger', 'Google OAuth is not configured. Please sign in with email.');
            return res.redirect('/login');
        }
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&scope=openid%20email%20profile`;
        return res.redirect(authUrl);
    } else if (provider === 'github') {
        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            req.flash('danger', 'GitHub OAuth is not configured. Please sign in with email.');
            return res.redirect('/login');
        }
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=user:email`;
        return res.redirect(authUrl);
    } else {
        req.flash('danger', 'Invalid provider.');
        return res.redirect('/login');
    }
});

router.get('/authorize/:provider', async (req, res) => {
    if (req.session.user_id) {
        return res.redirect('/dashboard');
    }
    const provider = req.params.provider;
    const code = req.query.code;
    if (!code) {
        req.flash('danger', 'OAuth authorization failed: code is missing.');
        return res.redirect('/login');
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const redirect_uri = `${protocol}://${req.get('host')}/authorize/${provider}`;
    let email = '';
    let name = '';
    let oauth_id = '';
    let email_verified = false;

    try {
        if (provider === 'google') {
            const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri,
                grant_type: 'authorization_code'
            });
            const { access_token } = tokenRes.data;
            const userRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            oauth_id = userRes.data.sub;
            email = (userRes.data.email || '').toLowerCase();
            name = userRes.data.name || '';
            email_verified = userRes.data.email_verified || false;
        } else if (provider === 'github') {
            const tokenRes = await axios.post('https://github.com/login/oauth/access_token', {
                code,
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                redirect_uri
            }, {
                headers: { Accept: 'application/json' }
            });
            const { access_token } = tokenRes.data;
            const userRes = await axios.get('https://api.github.com/user', {
                headers: {
                    Authorization: `token ${access_token}`,
                    'User-Agent': 'Spendly-Node-App'
                }
            });
            oauth_id = String(userRes.data.id);
            name = userRes.data.name || userRes.data.login || '';
            email = (userRes.data.email || '').toLowerCase();

            if (!email) {
                // Fetch public/private emails from GitHub
                const emailsRes = await axios.get('https://api.github.com/user/emails', {
                    headers: {
                        Authorization: `token ${access_token}`,
                        'User-Agent': 'Spendly-Node-App'
                    }
                });
                const primary = emailsRes.data.find(e => e.primary);
                if (primary) {
                    email = primary.email;
                } else if (emailsRes.data.length > 0) {
                    email = emailsRes.data[0].email;
                }
            }
            email_verified = !!email;
        }

        if (!email) {
            req.flash('danger', 'Could not retrieve email from provider. Make sure your email is public on GitHub.');
            return res.redirect('/login');
        }

        let user = await User.findOne({ oauth_provider: provider, oauth_id });
        const now_str = formatCurrentTime();
        const ip_addr = req.ip || 'Unknown';

        if (user) {
            req.session.clear();
            req.session.user_id = user._id.toString();
            req.session.user_name = user.name;
            await send_signin_confirmation(email, user.name, now_str, ip_addr, provider);
            req.flash('success', `Welcome back, ${user.name}!`);
            return res.redirect('/dashboard');
        }

        // Check if email already registered
        const existing = await User.findOne({ email });
        if (existing) {
            existing.oauth_provider = provider;
            existing.oauth_id = oauth_id;
            existing.email_verified = true;
            await existing.save();

            req.session.clear();
            req.session.user_id = existing._id.toString();
            req.session.user_name = existing.name;
            await send_signin_confirmation(email, existing.name, now_str, ip_addr, provider);
            req.flash('success', 'Linked OAuth account. Welcome back!');
            return res.redirect('/dashboard');
        }

        // Create new user
        const newUser = new User({
            name,
            email,
            password_hash: null,
            oauth_provider: provider,
            oauth_id: oauth_id,
            email_verified: email_verified
        });
        await newUser.save();

        req.session.clear();
        req.session.user_id = newUser._id.toString();
        req.session.user_name = newUser.name;
        await send_signin_confirmation(email, name, now_str, ip_addr, provider);
        req.flash('success', 'Account created successfully!');
        return res.redirect('/dashboard');

    } catch (err) {
        req.flash('danger', `OAuth authorization failed: ${err.message}`);
        return res.redirect('/login');
    }
});

// ------------------------------------------------------------------ //
// Register Routes                                                    //
// ------------------------------------------------------------------ //
router.get('/register', (req, res) => {
    if (req.session.user_id) {
        return res.redirect('/dashboard');
    }
    const pending = req.session.pending_registration;
    res.render('register.html', {
        otp_sent: !!pending,
        otp_email: pending ? pending.email : '',
        otp_name: pending ? pending.name : ''
    });
});

router.post('/register', async (req, res) => {
    if (req.session.user_id) {
        return res.redirect('/dashboard');
    }

    const otp_code = (req.body.otp_code || '').trim();
    if (otp_code) {
        // --- OTP Verification Step ---
        const reg_data = req.session.pending_registration;
        if (!reg_data) {
            req.flash('danger', 'Registration session expired. Please start over.');
            return res.redirect('/register');
        }

        const stored = await EmailOtp.findOne({
            email: reg_data.email,
            otp: otp_code,
            used: false,
            expires_at: { $gt: new Date() }
        }).sort({ _id: -1 });

        if (!stored) {
            req.flash('danger', 'Invalid or expired OTP. Please try again.');
            return res.render('register.html', {
                otp_sent: true,
                otp_email: reg_data.email,
                otp_name: reg_data.name
            });
        }

        // Mark OTP as used
        stored.used = true;
        await stored.save();

        try {
            const newUser = new User({
                name: reg_data.name,
                email: reg_data.email,
                password_hash: reg_data.password_hash,
                email_verified: true
            });
            await newUser.save();
            delete req.session.pending_registration;

            req.session.user_id = newUser._id.toString();
            req.session.user_name = newUser.name;
            req.flash('success', 'Account created and verified! Welcome!');
            return res.redirect('/dashboard');
        } catch (err) {
            if (err.code === 11000) {
                req.flash('danger', 'Email already registered. Please log in.');
                return res.redirect('/login');
            }
            throw err;
        }
    } else {
        // --- Initial Registration Step ---
        const name = (req.body.name || '').trim();
        const email = (req.body.email || '').trim().toLowerCase();
        const password = req.body.password || '';
        const confirm_password = req.body.confirm_password || '';

        if (!name || name.length < 2) {
            req.flash('danger', 'Name must be at least 2 characters.');
            return res.render('register.html');
        }
        if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
            req.flash('danger', 'Invalid email address.');
            return res.render('register.html');
        }
        if (password.length < 6) {
            req.flash('danger', 'Password must be at least 6 characters.');
            return res.render('register.html');
        }
        if (password !== confirm_password) {
            req.flash('danger', 'Passwords do not match.');
            return res.render('register.html');
        }

        // Check if email already registered
        const existing = await User.findOne({ email });
        if (existing) {
            req.flash('danger', 'Email already registered. Please log in.');
            return res.render('register.html');
        }

        // Generate and send OTP
        const otp = generate_otp(email);
        if (otp === null) {
            const cooldown = get_otp_remaining_cooldown(email);
            req.flash('warning', `Please wait ${cooldown} seconds before requesting another OTP.`);
            return res.render('register.html');
        }

        const password_hash = await bcrypt.hash(password, 10);
        const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const emailOtp = new EmailOtp({
            email,
            otp,
            name,
            password_hash,
            expires_at
        });
        await emailOtp.save();

        req.session.pending_registration = {
            name,
            email,
            password_hash
        };

        // Send OTP email
        const emailResult = await send_otp_email(email, name, otp);
        if (!emailResult.success) {
            console.log(`\n==================================================`);
            console.log(`[DEV ONLY] Failed to send email. Verification OTP: ${otp}`);
            console.log(`==================================================\n`);
        }

        req.flash('info', 'A verification code has been sent to your email.');
        return res.render('register.html', {
            otp_sent: true,
            otp_email: email,
            otp_name: name
        });
    }
});

router.post('/resend-otp', async (req, res) => {
    const reg_data = req.session.pending_registration;
    if (!reg_data) {
        req.flash('danger', 'Registration session not found.');
        return res.redirect('/register');
    }

    const { email, name, password_hash } = reg_data;
    const cooldown = get_otp_remaining_cooldown(email);
    if (cooldown > 0) {
        req.flash('warning', `Please wait ${cooldown} seconds before requesting a new code.`);
        return res.redirect('/register');
    }

    const otp = generate_otp(email);
    if (otp === null) {
        req.flash('warning', 'Too many requests. Please wait a moment.');
        return res.redirect('/register');
    }

    const expires_at = new Date(Date.now() + 10 * 60 * 1000);
    const emailOtp = new EmailOtp({
        email,
        otp,
        name,
        password_hash,
        expires_at
    });
    await emailOtp.save();

    const emailResult = await send_otp_email(email, name, otp);
    if (!emailResult.success) {
        console.log(`\n==================================================`);
        console.log(`[DEV ONLY] Failed to send email. Verification OTP: ${otp}`);
        console.log(`==================================================\n`);
    }
    req.flash('info', 'A new verification code has been sent.');
    return res.redirect('/register');
});

// ------------------------------------------------------------------ //
// Login / Logout Routes                                              //
// ------------------------------------------------------------------ //
router.get('/login', (req, res) => {
    if (req.session.user_id) {
        return res.redirect('/dashboard');
    }
    res.render('login.html');
});

router.post('/login', async (req, res) => {
    if (req.session.user_id) {
        return res.redirect('/dashboard');
    }

    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email || !password) {
        req.flash('danger', 'Email and password are required.');
        return res.render('login.html');
    }

    const ip = req.ip || 'unknown';
    if (is_rate_limited(ip)) {
        req.flash('danger', 'Too many login attempts. Please try again in 15 minutes.');
        return res.status(429).render('login.html');
    }

    const user = await User.findOne({ email });
    if (user && user.password_hash && await bcrypt.compare(password, user.password_hash)) {
        req.session.clear();
        req.session.user_id = user._id.toString();
        req.session.user_name = user.name;

        const now_str = formatCurrentTime();
        const ip_addr = req.ip || 'Unknown';
        await send_signin_confirmation(email, user.name, now_str, ip_addr, 'email');

        req.flash('success', `Welcome back, ${user.name}!`);
        return res.redirect('/dashboard');
    }

    record_login_attempt(ip);
    req.flash('danger', 'Invalid credentials.');
    return res.render('login.html');
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    // Redirect to landing
    res.redirect('/');
});

// ------------------------------------------------------------------ //
// Forgot / Reset Password Routes                                     //
// ------------------------------------------------------------------ //
router.get('/forgot-password', (req, res) => {
    res.render('forgot_password.html');
});

router.post('/forgot-password', async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email });
    if (user) {
        const token = generate_reset_token(email);
        const reset_url = `${req.protocol}://${req.get('host')}/reset-password/${token}`;
        await send_password_reset_email(email, reset_url);
    }
    req.flash('info', 'If that email is registered, a password reset link has been sent.');
    return res.redirect('/login');
});

router.get('/reset-password/:token', (req, res) => {
    const token = req.params.token;
    const email = verify_reset_token(token);
    if (!email) {
        req.flash('danger', 'Invalid or expired reset link. Please request a new one.');
        return res.redirect('/forgot-password');
    }
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/reset-password/${token}`);
});

router.post('/reset-password/:token', async (req, res) => {
    const token = req.params.token;
    const email = verify_reset_token(token);
    if (!email) {
        req.flash('danger', 'Invalid or expired reset link. Please request a new one.');
        return res.redirect('/forgot-password');
    }

    const password = req.body.password || '';
    const confirm = req.body.confirm_password || '';

    if (!password || password.length < 6) {
        req.flash('danger', 'Password must be at least 6 characters.');
        return res.render('reset_password.html', { token });
    }
    if (password !== confirm) {
        req.flash('danger', 'Passwords do not match.');
        return res.render('reset_password.html', { token });
    }

    const user = await User.findOne({ email });
    if (user) {
        user.password_hash = await bcrypt.hash(password, 10);
        await user.save();
    }

    consume_reset_token(token);
    req.flash('success', 'Password reset successfully! Please log in.');
    return res.redirect('/login');
});

module.exports = router;
