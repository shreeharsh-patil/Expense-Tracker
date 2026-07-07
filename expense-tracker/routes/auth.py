import os
import re
import secrets
from datetime import datetime, timedelta
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from authlib.integrations.flask_client import OAuth
from database.db import get_db
from helpers import (
    is_rate_limited, record_login_attempt,
    generate_reset_token, verify_reset_token, consume_reset_token,
    send_email_async, cache_clear_user,
    generate_otp, get_otp_remaining_cooldown, send_otp_email
)
from email_alerts import send_signin_confirmation, send_password_reset_email

auth_bp = Blueprint('auth', __name__)

# ------------------------------------------------------------------ #
# OAuth Setup (Google + GitHub)                                      #
# ------------------------------------------------------------------ #
def init_oauth(app):
    """Register OAuth clients on the Flask app. Called from app.py."""
    oauth = OAuth(app)

    google_client_id = os.environ.get('GOOGLE_CLIENT_ID', '')
    google_client_secret = os.environ.get('GOOGLE_CLIENT_SECRET', '')
    github_client_id = os.environ.get('GITHUB_CLIENT_ID', '')
    github_client_secret = os.environ.get('GITHUB_CLIENT_SECRET', '')

    if google_client_id and google_client_secret:
        oauth.register(
            name='google',
            client_id=google_client_id,
            client_secret=google_client_secret,
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            client_kwargs={'scope': 'openid email profile'},
        )

    if github_client_id and github_client_secret:
        oauth.register(
            name='github',
            client_id=github_client_id,
            client_secret=github_client_secret,
            access_token_url='https://github.com/login/oauth/access_token',
            authorize_url='https://github.com/login/oauth/authorize',
            api_base_url='https://api.github.com/',
            client_kwargs={'scope': 'user:email'},
        )

    return oauth

# Store oauth reference on the blueprint for route access
oauth_client = None


def _get_oauth():
    global oauth_client
    return oauth_client


def _set_oauth(oauth):
    global oauth_client
    oauth_client = oauth


# ------------------------------------------------------------------ #
# OAuth Login Routes                                                 #
# ------------------------------------------------------------------ #

@auth_bp.route('/login/<provider>')
def oauth_login(provider):
    if 'user_id' in session:
        return redirect(url_for('dashboard.dashboard'))
    oauth = _get_oauth()
    if not oauth:
        flash('OAuth is not configured. Please sign in with email.', 'danger')
        return redirect(url_for('auth.login'))
    client = oauth.create_client(provider)
    if not client:
        flash(f'{provider} login is not configured.', 'danger')
        return redirect(url_for('auth.login'))
    redirect_uri = url_for('auth.oauth_authorize', provider=provider, _external=True)
    return client.authorize_redirect(redirect_uri)


@auth_bp.route('/authorize/<provider>')
def oauth_authorize(provider):
    if 'user_id' in session:
        return redirect(url_for('dashboard.dashboard'))
    oauth = _get_oauth()
    if not oauth:
        flash('OAuth is not configured.', 'danger')
        return redirect(url_for('auth.login'))
    client = oauth.create_client(provider)
    if not client:
        flash('OAuth provider not found.', 'danger')
        return redirect(url_for('auth.login'))

    try:
        token = client.authorize_access_token()
    except Exception as e:
        flash(f'OAuth authorization failed: {e}', 'danger')
        return redirect(url_for('auth.login'))

    if provider == 'google':
        userinfo = client.parse_id_token(token)
        oauth_id = userinfo.get('sub', '')
        email = (userinfo.get('email') or '').lower()
        name = userinfo.get('name', '')
        email_verified = userinfo.get('email_verified', False)
    else:  # github
        userinfo = client.get('user').json()
        raw_id = userinfo.get('id')
        if not raw_id:
            flash('Could not retrieve your GitHub profile ID.', 'danger')
            return redirect(url_for('auth.login'))
        oauth_id = str(raw_id)
        name = userinfo.get('name', userinfo.get('login', ''))
        email = (userinfo.get('email') or '').lower()
        # GitHub often returns null email; fetch from /user/emails
        if not email:
            try:
                emails = client.get('user/emails').json()
                primary = [e for e in emails if e.get('primary')]
                if primary:
                    email = primary[0].get('email', '')
                elif emails:
                    email = emails[0].get('email', '')
            except Exception:
                pass
        email_verified = bool(email)

    if not email:
        flash('Could not retrieve email from provider. Make sure your email is public on GitHub.', 'danger')
        return redirect(url_for('auth.login'))

    db = get_db()
    # Check if this OAuth ID already linked to a user
    user = db.execute(
        'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?',
        (provider, oauth_id)
    ).fetchone()

    now_str = datetime.now().strftime('%B %d, %Y at %I:%M %p')
    ip_addr = request.remote_addr or 'Unknown'

    if user:
        # Existing OAuth user — log them in
        session.clear()
        session['user_id'] = user['id']
        session['user_name'] = user['name']
        send_signin_confirmation(email, user['name'], now_str, ip_addr, provider)
        flash(f"Welcome back, {user['name']}!", 'success')
        return redirect(url_for('dashboard.dashboard'))

    # Check if email already registered (link OAuth to existing account)
    existing = db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    if existing:
        db.execute(
            'UPDATE users SET oauth_provider = ?, oauth_id = ?, email_verified = 1 WHERE id = ?',
            (provider, oauth_id, existing['id'])
        )
        db.commit()
        session.clear()
        session['user_id'] = existing['id']
        session['user_name'] = existing['name']
        send_signin_confirmation(email, existing['name'], now_str, ip_addr, provider)
        flash('Linked OAuth account. Welcome back!', 'success')
        return redirect(url_for('dashboard.dashboard'))

    # New user — create account with OAuth info
    try:
        db.execute(
            'INSERT INTO users (name, email, password_hash, oauth_provider, oauth_id, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
            (name, email, None, provider, oauth_id, 1 if email_verified else 0)
        )
        db.commit()
        new_user = db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        session.clear()
        session['user_id'] = new_user['id']
        session['user_name'] = new_user['name']
        send_signin_confirmation(email, name, now_str, ip_addr, provider)
        flash('Account created successfully!', 'success')
        return redirect(url_for('dashboard.dashboard'))
    except Exception as e:
        flash('Failed to create account with OAuth. Please try again.', 'danger')
        return redirect(url_for('auth.login'))



@auth_bp.route('/register', methods=['GET', 'POST'], endpoint='register')
def register():
    if 'user_id' in session:
        return redirect(url_for('dashboard.dashboard'))

    # On GET, check if there's a pending registration to auto-show the OTP step
    otp_sent = session.get('pending_registration') is not None
    otp_email = session.get('pending_registration', {}).get('email', '')
    otp_name = session.get('pending_registration', {}).get('name', '')

    if request.method == 'POST':
        # Check if this is the OTP verification step
        otp_code = request.form.get('otp_code', '').strip()
        if otp_code:
            # --- OTP Verification Step ---
            reg_data = session.get('pending_registration')
            if not reg_data:
                flash('Registration session expired. Please start over.', 'danger')
                return redirect(url_for('auth.register'))

            db = get_db()
            now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            stored = db.execute(
                'SELECT * FROM email_otps WHERE email = ? AND otp = ? AND used = 0 AND expires_at > ? ORDER BY id DESC LIMIT 1',
                (reg_data['email'], otp_code, now_str)
            ).fetchone()

            if not stored:
                flash('Invalid or expired OTP. Please try again.', 'danger')
                return render_template('register.html', otp_sent=True, otp_email=reg_data['email'], otp_name=reg_data['name'])

            # Mark OTP as used
            db.execute('UPDATE email_otps SET used = 1 WHERE id = ?', (stored['id'],))

            # Create the user account
            try:
                db.execute(
                    'INSERT INTO users (name, email, password_hash, email_verified) VALUES (?, ?, ?, ?)',
                    (reg_data['name'], reg_data['email'], reg_data['password_hash'], 1)
                )
                db.commit()
                session.pop('pending_registration', None)

                # Log the user in immediately
                new_user = db.execute('SELECT * FROM users WHERE email = ?', (reg_data['email'],)).fetchone()
                session['user_id'] = new_user['id']
                session['user_name'] = new_user['name']
                flash('Account created and verified! Welcome!', 'success')
                return redirect(url_for('dashboard.dashboard'))
            except db.IntegrityError:
                flash('Email already registered. Please log in.', 'danger')
                return redirect(url_for('auth.login'))
        else:
            # --- Initial Registration Step ---
            name = (request.form.get('name') or '').strip()
            email = (request.form.get('email') or '').strip().lower()
            password = request.form.get('password') or ''
            confirm_password = request.form.get('confirm_password') or ''

            if not name or len(name) < 2:
                flash('Name must be at least 2 characters.', 'danger')
                return render_template('register.html')
            if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
                flash('Invalid email address.', 'danger')
                return render_template('register.html')
            if len(password) < 6:
                flash('Password must be at least 6 characters.', 'danger')
                return render_template('register.html')
            if password != confirm_password:
                flash('Passwords do not match.', 'danger')
                return render_template('register.html')

            db = get_db()
            # Check if email already exists
            existing = db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
            if existing:
                flash('Email already registered. Please log in.', 'danger')
                return render_template('register.html')

            # Generate and send OTP
            otp = generate_otp(email)
            if otp is None:
                cooldown = get_otp_remaining_cooldown(email)
                flash(f'Please wait {cooldown} seconds before requesting another OTP.', 'warning')
                return render_template('register.html')

            password_hash = generate_password_hash(password)

            # Store OTP in database
            expires_at = (datetime.now() + timedelta(minutes=10)).strftime('%Y-%m-%d %H:%M:%S')
            db.execute(
                'INSERT INTO email_otps (email, otp, name, password_hash, expires_at) VALUES (?, ?, ?, ?, ?)',
                (email, otp, name, password_hash, expires_at)
            )
            db.commit()

            # Store pending registration in session
            session['pending_registration'] = {
                'name': name,
                'email': email,
                'password_hash': password_hash,
            }

            # Send OTP email
            send_otp_email(email, otp, name)

            flash('A verification code has been sent to your email.', 'info')
            return render_template('register.html', otp_sent=True, otp_email=email, otp_name=name)

    return render_template('register.html')


@auth_bp.route('/resend-otp', methods=['POST'], endpoint='resend_otp')
def resend_otp():
    reg_data = session.get('pending_registration')
    if not reg_data:
        flash('Registration session not found.', 'danger')
        return redirect(url_for('auth.register'))

    email = reg_data['email']
    name = reg_data['name']

    cooldown = get_otp_remaining_cooldown(email)
    if cooldown > 0:
        flash(f'Please wait {cooldown} seconds before requesting a new code.', 'warning')
        return redirect(url_for('auth.register'))

    otp = generate_otp(email)
    if otp is None:
        flash('Too many requests. Please wait a moment.', 'warning')
        return redirect(url_for('auth.register'))

    db = get_db()
    expires_at = (datetime.now() + timedelta(minutes=10)).strftime('%Y-%m-%d %H:%M:%S')
    password_hash = reg_data.get('password_hash', '')
    db.execute(
        'INSERT INTO email_otps (email, otp, name, password_hash, expires_at) VALUES (?, ?, ?, ?, ?)',
        (email, otp, name, password_hash, expires_at)
    )
    db.commit()

    send_otp_email(email, otp, name)
    flash('A new verification code has been sent.', 'info')
    return redirect(url_for('auth.register'))


@auth_bp.route('/login', methods=['GET', 'POST'], endpoint='login')
def login():
    if 'user_id' in session:
        return redirect(url_for('dashboard.dashboard'))
    if request.method == 'POST':
        email = (request.form.get('email') or '').strip().lower()
        password = request.form.get('password') or ''
        if not email or not password:
            flash('Email and password are required.', 'danger')
            return render_template('login.html')
        ip = request.remote_addr or 'unknown'
        if is_rate_limited(ip):
            flash('Too many login attempts. Please try again in 15 minutes.', 'danger')
            return render_template('login.html'), 429
        db = get_db()
        user = db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        if user and user['password_hash'] and check_password_hash(user['password_hash'], password):
            session.clear()
            session['user_id'] = user['id']
            session['user_name'] = user['name']
            now_str = datetime.now().strftime('%B %d, %Y at %I:%M %p')
            ip_addr = request.remote_addr or 'Unknown'
            send_signin_confirmation(email, user['name'], now_str, ip_addr, 'email')
            flash(f"Welcome back, {user['name']}!", 'success')
            return redirect(url_for('dashboard.dashboard'))
        record_login_attempt(ip)
        flash('Invalid credentials.', 'danger')
    return render_template('login.html')


@auth_bp.route('/logout', endpoint='logout')
def logout():
    session.clear()
    flash('Successfully logged out.', 'info')
    return redirect(url_for('main.landing'))


@auth_bp.route('/forgot-password', methods=['GET', 'POST'], endpoint='forgot_password')
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email')
        db = get_db()
        user = db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        if user:
            token = generate_reset_token(email)
            reset_url = url_for('auth.reset_password', token=token, _external=True)
            send_password_reset_email(email, reset_url)
        flash('If that email is registered, a password reset link has been sent.', 'info')
        return redirect(url_for('auth.login'))
    return render_template('forgot_password.html')


@auth_bp.route('/reset-password/<token>', methods=['GET', 'POST'], endpoint='reset_password')
def reset_password(token):
    email = verify_reset_token(token)
    if not email:
        flash('Invalid or expired reset link. Please request a new one.', 'danger')
        return redirect(url_for('auth.forgot_password'))
    if request.method == 'POST':
        password = request.form.get('password')
        confirm = request.form.get('confirm_password')
        if not password or len(password) < 6:
            flash('Password must be at least 6 characters.', 'danger')
            return render_template('reset_password.html', token=token)
        if password != confirm:
            flash('Passwords do not match.', 'danger')
            return render_template('reset_password.html', token=token)
        db = get_db()
        db.execute(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            (generate_password_hash(password), email)
        )
        db.commit()
        consume_reset_token(token)
        flash('Password reset successfully! Please log in.', 'success')
        return redirect(url_for('auth.login'))
    return render_template('reset_password.html', token=token)
