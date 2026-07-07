from flask import Blueprint, render_template

main_bp = Blueprint('main', __name__)


@main_bp.route('/', endpoint='landing')
def landing():
    return render_template('landing.html')


@main_bp.route('/terms', endpoint='terms')
def terms():
    return render_template('terms.html')


@main_bp.route('/privacy', endpoint='privacy')
def privacy():
    return render_template('privacy.html')


@main_bp.route('/features', endpoint='features')
def features():
    return render_template('features.html')


@main_bp.route('/pricing', endpoint='pricing')
def pricing():
    return render_template('pricing.html')


@main_bp.route('/ocr', endpoint='ocr_scanning')
def ocr_scanning():
    return render_template('ocr.html')


@main_bp.route('/export', endpoint='export_info')
def export_info():
    return render_template('export_info.html')


@main_bp.route('/about', endpoint='about')
def about():
    return render_template('about.html')


@main_bp.route('/blog', endpoint='blog')
def blog():
    return render_template('blog.html')


@main_bp.route('/careers', endpoint='careers')
def careers():
    return render_template('careers.html')
