"""
Email Alert System for Spendly
Sends budget warnings and weekly summaries via SMTP.
"""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


# Configuration — users can set these via environment variables
SMTP_SERVER = os.environ.get('SPENDLY_SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SPENDLY_SMTP_PORT', 587))
SMTP_EMAIL = os.environ.get('SPENDLY_SMTP_EMAIL', '')
SMTP_PASSWORD = os.environ.get('SPENDLY_SMTP_PASSWORD', '')  # App password for Gmail


def _build_budget_alert_html(user_name, spent, budget, projected, top_category, top_amount):
    """Build a premium HTML email for budget alerts."""
    pct = int((spent / budget) * 100) if budget > 0 else 0
    bar_color = '#c0392b' if pct >= 100 else '#f39c12' if pct >= 80 else '#1a472a'
    
    return f"""
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; background: #f7f6f3; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1a472a, #2e7d32); padding: 2rem; color: white; text-align: center;">
            <h1 style="margin: 0; font-size: 1.4rem;">⚠️ Budget Alert</h1>
            <p style="margin: 0.5rem 0 0; opacity: 0.85; font-size: 0.9rem;">Spendly noticed you're spending fast, {user_name}.</p>
        </div>
        <div style="padding: 2rem;">
            <div style="background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <p style="margin: 0 0 0.5rem; color: #6b6b6b; font-size: 0.8rem; text-transform: uppercase; font-weight: 600;">Current Month Progress</p>
                <div style="display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 700; margin-bottom: 0.75rem;">
                    <span>₹{spent:,.0f}</span>
                    <span style="color: #6b6b6b;">/ ₹{budget:,.0f}</span>
                </div>
                <div style="height: 10px; background: #e5e9eb; border-radius: 5px; overflow: hidden;">
                    <div style="width: {min(pct, 100)}%; height: 100%; background: {bar_color}; border-radius: 5px;"></div>
                </div>
                <p style="text-align: right; font-size: 0.8rem; color: {bar_color}; margin: 0.5rem 0 0; font-weight: 600;">{pct}% used</p>
            </div>
            <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                <div style="flex: 1; background: white; border-radius: 12px; padding: 1rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <p style="margin: 0; color: #6b6b6b; font-size: 0.75rem; text-transform: uppercase;">Projected Total</p>
                    <p style="margin: 0.25rem 0 0; font-size: 1.2rem; font-weight: 800; color: {'#c0392b' if projected > budget else '#1a472a'};">₹{projected:,.0f}</p>
                </div>
                <div style="flex: 1; background: white; border-radius: 12px; padding: 1rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <p style="margin: 0; color: #6b6b6b; font-size: 0.75rem; text-transform: uppercase;">Top Category</p>
                    <p style="margin: 0.25rem 0 0; font-size: 1rem; font-weight: 700;">{top_category}</p>
                    <p style="margin: 0; font-size: 0.85rem; color: #6b6b6b;">₹{top_amount:,.0f}</p>
                </div>
            </div>
            <p style="text-align: center; color: #a0a0a0; font-size: 0.75rem; margin-top: 1.5rem;">
                Sent by Spendly &mdash; your personal finance tracker.
            </p>
        </div>
    </div>
    """


def _build_weekly_summary_html(user_name, week_total, daily_avg, expense_count, top_expenses):
    """Build a weekly summary HTML email."""
    top_rows = ""
    for exp in top_expenses[:5]:
        top_rows += f"""
        <tr>
            <td style="padding: 0.5rem; border-bottom: 1px solid #f0ede6;">{exp['date'][:10]}</td>
            <td style="padding: 0.5rem; border-bottom: 1px solid #f0ede6;">{exp['category']}</td>
            <td style="padding: 0.5rem; border-bottom: 1px solid #f0ede6; text-align: right; font-weight: 600;">₹{exp['amount']:,.2f}</td>
        </tr>
        """
    
    return f"""
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; background: #f7f6f3; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1a472a, #2e7d32); padding: 2rem; color: white; text-align: center;">
            <h1 style="margin: 0; font-size: 1.4rem;">📊 Weekly Spending Summary</h1>
            <p style="margin: 0.5rem 0 0; opacity: 0.85; font-size: 0.9rem;">Here's how your week looked, {user_name}.</p>
        </div>
        <div style="padding: 2rem;">
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                <div style="flex: 1; background: white; border-radius: 12px; padding: 1rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <p style="margin: 0; color: #6b6b6b; font-size: 0.75rem; text-transform: uppercase;">This Week</p>
                    <p style="margin: 0.25rem 0 0; font-size: 1.3rem; font-weight: 800;">₹{week_total:,.0f}</p>
                </div>
                <div style="flex: 1; background: white; border-radius: 12px; padding: 1rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <p style="margin: 0; color: #6b6b6b; font-size: 0.75rem; text-transform: uppercase;">Daily Avg</p>
                    <p style="margin: 0.25rem 0 0; font-size: 1.3rem; font-weight: 800;">₹{daily_avg:,.0f}</p>
                </div>
                <div style="flex: 1; background: white; border-radius: 12px; padding: 1rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <p style="margin: 0; color: #6b6b6b; font-size: 0.75rem; text-transform: uppercase;">Transactions</p>
                    <p style="margin: 0.25rem 0 0; font-size: 1.3rem; font-weight: 800;">{expense_count}</p>
                </div>
            </div>
            <div style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <p style="margin: 0 0 0.75rem; font-weight: 700; font-size: 0.95rem;">Top Expenses</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; color: #2d2d2d;">
                    {top_rows}
                </table>
            </div>
            <p style="text-align: center; color: #a0a0a0; font-size: 0.75rem; margin-top: 1.5rem;">
                Sent by Spendly &mdash; your personal finance tracker.
            </p>
        </div>
    </div>
    """


def send_email(to_email, subject, html_body):
    """Send an HTML email using configured SMTP."""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        return {'success': False, 'error': 'SMTP credentials not configured. Set SPENDLY_SMTP_EMAIL and SPENDLY_SMTP_PASSWORD environment variables.'}

    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = f'Spendly <{SMTP_EMAIL}>'
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html_body, 'html'))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())

        return {'success': True, 'error': None}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def send_budget_alert(to_email, user_name, spent, budget, projected, top_category='Other', top_amount=0):
    """Send a budget overspend alert email."""
    html = _build_budget_alert_html(user_name, spent, budget, projected, top_category, top_amount)
    return send_email(to_email, '⚠️ Spendly Budget Alert — You\'re spending fast!', html)


def send_weekly_summary(to_email, user_name, week_total, daily_avg, expense_count, top_expenses):
    """Send a weekly spending summary email."""
    html = _build_weekly_summary_html(user_name, week_total, daily_avg, expense_count, top_expenses)
    return send_email(to_email, '📊 Your Spendly Weekly Summary', html)
