import os
import secrets
import logging
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, session, flash, g
from flask_wtf.csrf import CSRFProtect, generate_csrf, CSRFError
from database.db import init_db
from helpers import currency_symbol, format_amount, format_amount_no_decimal, CURRENCY_CHOICES
from routes.auth import init_oauth, _set_oauth

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
csrf = CSRFProtect(app)
app.jinja_env.globals.update(zip=zip)

# Security headers
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    if not app.debug:
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' https://cdn.jsdelivr.net https://fonts.googleapis.com 'unsafe-inline'; "
            "style-src 'self' https://fonts.googleapis.com https://cdn.jsdelivr.net 'unsafe-inline'; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' https://ui-avatars.com data: blob:; "
            "connect-src 'self' https://accounts.google.com https://api.github.com; "
            "frame-ancestors 'none'"
        )
    return response

@app.context_processor
def inject_csrf_and_now():
    return {
        'now': datetime.now,
        'now_year': datetime.now().year,
        'csrf_token': generate_csrf,
        'currency_symbol': currency_symbol,
        'format_amount': format_amount,
        'format_amount_no_decimal': format_amount_no_decimal,
        'currencies': CURRENCY_CHOICES
    }

app.secret_key = os.environ.get('SECRET_KEY')
if not app.secret_key:
    app.secret_key = 'spendly-local-dev-secret-key-change-in-prod'
    if os.environ.get('VERCEL'):
        # Vercel - warn but still use the default. In production, always set SECRET_KEY.
        logger.warning("SECRET_KEY not set in environment. Vercel sessions will persist across cold starts.")
    else:
        logger.warning("SECRET_KEY not set. Using insecure default key for local development.")

# Error handlers
@app.errorhandler(CSRFError)
def handle_csrf_error(e):
    flash('Session expired. Please try again.', 'danger')
    return redirect(url_for('auth.login'))

import traceback
from werkzeug.exceptions import HTTPException

@app.errorhandler(Exception)
def handle_exception(e):
    if isinstance(e, HTTPException):
        return e
    logger.error(f"Unhandled exception: {e}", exc_info=True)
    if app.debug:
        return "<pre>" + traceback.format_exc() + "</pre>", 500
    return render_template('500.html'), 500

# Database helpers
@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, 'db', None)
    if db is not None:
        db.close()

@app.cli.command('init-db')
def init_db_command():
    init_db()
    print('Database initialized.')

@app.cli.command('seed-db')
def seed_db_command():
    from database.db import seed_db
    init_db()
    seed_db()
    print('Database seeded with demo data.')

# Upload configuration
if os.environ.get('VERCEL'):
    app.config['UPLOAD_FOLDER'] = '/tmp/uploads/profile_pics'
    app.config['RECEIPT_FOLDER'] = '/tmp/uploads/receipts'
else:
    app.config['UPLOAD_FOLDER'] = os.path.join(app.static_folder, 'uploads', 'profile_pics')
    app.config['RECEIPT_FOLDER'] = os.path.join(app.static_folder, 'uploads', 'receipts')

app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'}

try:
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['RECEIPT_FOLDER'], exist_ok=True)
except Exception as e:
    logger.error(f"Error creating upload directories: {e}")

# Register blueprints
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.expenses import expenses_bp
from routes.income import income_bp
from routes.profile import profile_bp
from routes.main import main_bp
from routes.accounts import accounts_bp
from routes.tags import tags_bp
from routes.rules import rules_bp
from routes.webhooks import webhooks_bp
from routes.categories import categories_bp

app.register_blueprint(auth_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(expenses_bp)
app.register_blueprint(income_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(main_bp)
app.register_blueprint(accounts_bp)
app.register_blueprint(tags_bp)
app.register_blueprint(rules_bp)
app.register_blueprint(webhooks_bp)
app.register_blueprint(categories_bp)

# Initialize OAuth (Google + GitHub)
_oauth = init_oauth(app)
_set_oauth(_oauth)

# Initialize database
try:
    with app.app_context():
        init_db()
except Exception as e:
    logger.error(f"Could not initialize database at startup: {e}")

if __name__ == '__main__':
    with app.app_context():
        init_db()
    debug_mode = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(debug=debug_mode, port=5001)
