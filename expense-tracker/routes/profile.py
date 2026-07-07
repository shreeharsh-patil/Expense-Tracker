import os
import re
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, current_app
from helpers import CURRENCY_CHOICES
from werkzeug.utils import secure_filename
from database.db import get_db

profile_bp = Blueprint('profile', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@profile_bp.route('/profile', methods=['GET', 'POST'], endpoint='profile')
def profile():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    db = get_db()
    if request.method == 'POST':
        new_name = (request.form.get('name') or '').strip()
        new_email = (request.form.get('email') or '').strip().lower()
        new_phone = (request.form.get('phone') or '').strip()
        new_currency = (request.form.get('preferred_currency') or 'INR').strip()
        if not new_name or len(new_name) < 2:
            flash('Name must be at least 2 characters.', 'danger')
            return redirect(url_for('profile.profile'))
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', new_email):
            flash('Invalid email address.', 'danger')
            return redirect(url_for('profile.profile'))
        current_data = db.execute("SELECT avatar_url FROM users WHERE id = ?", (session['user_id'],)).fetchone()
        new_avatar_url = current_data['avatar_url'] if current_data else None
        if 'profile_photo' in request.files:
            file = request.files['profile_photo']
            if file and file.filename != '' and allowed_file(file.filename):
                filename = secure_filename(f"user_{session['user_id']}_{file.filename}")
                file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
                file.save(file_path)
                new_avatar_url = url_for('static', filename=f'uploads/profile_pics/{filename}')
        try:
            db.execute(
                "UPDATE users SET name = ?, email = ?, phone = ?, avatar_url = ?, preferred_currency = ? WHERE id = ?",
                (new_name, new_email, new_phone, new_avatar_url, new_currency, session['user_id'])
            )
            db.commit()
            session['user_name'] = new_name
            flash('Profile updated successfully!', 'success')
        except db.IntegrityError:
            flash('Email address already in use.', 'danger')
        return redirect(url_for('profile.profile'))
    user = db.execute("SELECT * FROM users WHERE id = ?", (session['user_id'],)).fetchone()
    return render_template('profile.html', user=user, currencies=CURRENCY_CHOICES)