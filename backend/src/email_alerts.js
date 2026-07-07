/**
 * Email Alert System for Spendly
 * Sends budget warnings, OTP codes, sign-in confirmations, and weekly summaries via SMTP.
 */

const nodemailer = require('nodemailer');

const SMTP_SERVER = process.env.SPENDLY_SMTP_SERVER || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SPENDLY_SMTP_PORT || '587', 10);
const SMTP_EMAIL = process.env.SPENDLY_SMTP_EMAIL || '';
const SMTP_PASSWORD = process.env.SPENDLY_SMTP_PASSWORD || '';

const BRAND_GREEN_DARK = '#1a472a';
const BRAND_GREEN_MID = '#2e7d32';
const BRAND_GREEN_LIGHT = '#4caf50';

function escape(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function _build_spendly_email_base(title, content_html) {
    const e_title = escape(title);
    return `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; background: #f7f6f3; border-radius: 16px; overflow: hidden;">
  <!-- Branded Header -->
  <div style="background: linear-gradient(135deg, ${BRAND_GREEN_DARK}, ${BRAND_GREEN_MID}); padding: 2rem; text-align: center;">
    <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 1rem;">
      <span style="display: inline-block; width: 10px; height: 10px; background: ${BRAND_GREEN_LIGHT}; border-radius: 50%; box-shadow: 0 0 12px rgba(76, 175, 80, 0.5);"></span>
      <span style="color: rgba(255,255,255,0.7); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Spendly</span>
    </div>
    <h1 style="margin: 0; font-size: 1.35rem; color: #ffffff; font-weight: 700;">${e_title}</h1>
  </div>

  <!-- Body Content -->
  <div style="padding: 2rem;">
    ${content_html}
  </div>

  <!-- Footer -->
  <div style="padding: 1.5rem 2rem; text-align: center; border-top: 1px solid #e8e5df;">
    <div style="display: inline-flex; align-items: center; gap: 6px; margin-bottom: 0.5rem;">
      <span style="display: inline-block; width: 6px; height: 6px; background: ${BRAND_GREEN_MID}; border-radius: 50%;"></span>
      <span style="color: #1a472a; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.02em;">Spendly</span>
    </div>
    <p style="margin: 0; color: #a0a0a0; font-size: 0.7rem;">
      Your personal finance tracker &mdash;
      <a href="#" style="color: #2e7d32; text-decoration: underline;">spendly.app</a>
    </p>
  </div>
</div>`;
}

function _build_budget_alert_html(user_name, spent, budget, projected, top_category, top_amount) {
    const pct = budget > 0 ? Math.floor((spent / budget) * 100) : 0;
    const bar_color = pct >= 100 ? '#c0392b' : pct >= 80 ? '#f39c12' : BRAND_GREEN_DARK;

    const e_user_name = escape(user_name);
    const e_top_category = escape(top_category);

    const content = `
    <p style="margin: 0 0 1.25rem; color: #2d2d2d; font-size: 0.9rem;">
      Hi ${e_user_name}, we noticed your spending is picking up this month. Here's where you stand:
    </p>
    <div style="background: #ffffff; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <p style="margin: 0 0 0.5rem; color: #6b6b6b; font-size: 0.75rem; text-transform: uppercase; font-weight: 600; letter-spacing: 0.03em;">Monthly Budget Progress</p>
      <div style="display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 700; margin-bottom: 0.75rem;">
        <span style="color: ${bar_color};">₹${Number(spent).toLocaleString()}</span>
        <span style="color: #6b6b6b;">/ ₹${Number(budget).toLocaleString()}</span>
      </div>
      <div style="height: 10px; background: #e5e9eb; border-radius: 5px; overflow: hidden;">
        <div style="width: ${Math.min(pct, 100)}%; height: 100%; background: ${bar_color}; border-radius: 5px; transition: width 0.5s;"></div>
      </div>
      <p style="text-align: right; font-size: 0.8rem; color: ${bar_color}; margin: 0.5rem 0 0; font-weight: 600;">${pct}% used</p>
    </div>
    <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
      <div style="flex: 1; background: #ffffff; border-radius: 12px; padding: 1rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <p style="margin: 0; color: #6b6b6b; font-size: 0.7rem; text-transform: uppercase; font-weight: 600;">Projected Total</p>
        <p style="margin: 0.25rem 0 0; font-size: 1.2rem; font-weight: 800; color: ${projected > budget ? '#c0392b' : BRAND_GREEN_DARK};">₹${Number(projected).toLocaleString()}</p>
      </div>
      <div style="flex: 1; background: #ffffff; border-radius: 12px; padding: 1rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <p style="margin: 0; color: #6b6b6b; font-size: 0.7rem; text-transform: uppercase; font-weight: 600;">Top Category</p>
        <p style="margin: 0.25rem 0 0; font-size: 1rem; font-weight: 700;">${e_top_category}</p>
        <p style="margin: 0; font-size: 0.85rem; color: #6b6b6b;">₹${Number(top_amount).toLocaleString()}</p>
      </div>
    </div>
    <div style="background: #f0f7f0; border-radius: 10px; padding: 1rem; text-align: center;">
      <p style="margin: 0; font-size: 0.8rem; color: ${BRAND_GREEN_DARK};">
        💡 Tip: Try setting a lower category budget or reducing non-essential spending.
      </p>
    </div>
    `;
    return _build_spendly_email_base('⚠️ Budget Alert', content);
}

function _build_weekly_summary_html(user_name, week_total, daily_avg, expense_count, top_expenses) {
    let top_rows = '';
    for (const exp of top_expenses.slice(0, 5)) {
        top_rows += `
        <tr>
          <td style="padding: 0.5rem; border-bottom: 1px solid #f0ede6; color: #6b6b6b; font-size: 0.8rem;">${escape(exp.date.substring(0, 10))}</td>
          <td style="padding: 0.5rem; border-bottom: 1px solid #f0ede6; font-size: 0.85rem;">${escape(exp.category)}</td>
          <td style="padding: 0.5rem; border-bottom: 1px solid #f0ede6; text-align: right; font-weight: 700; font-size: 0.85rem;">₹${Number(exp.amount).toFixed(2)}</td>
        </tr>
        `;
    }

    const e_user_name = escape(user_name);

    const content = `
    <p style="margin: 0 0 1.25rem; color: #2d2d2d; font-size: 0.9rem;">
      Here's your spending breakdown for the past week, ${e_user_name}.
    </p>
    <div style="display: flex; gap: 1rem; margin-bottom: 1.25rem;">
      <div style="flex: 1; background: #ffffff; border-radius: 12px; padding: 1rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <p style="margin: 0; color: #6b6b6b; font-size: 0.7rem; text-transform: uppercase; font-weight: 600;">This Week</p>
        <p style="margin: 0.25rem 0 0; font-size: 1.3rem; font-weight: 800; color: ${BRAND_GREEN_DARK};">₹${Number(week_total).toLocaleString()}</p>
      </div>
      <div style="flex: 1; background: #ffffff; border-radius: 12px; padding: 1rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <p style="margin: 0; color: #6b6b6b; font-size: 0.7rem; text-transform: uppercase; font-weight: 600;">Daily Avg</p>
        <p style="margin: 0.25rem 0 0; font-size: 1.3rem; font-weight: 800;">₹${Number(daily_avg).toLocaleString()}</p>
      </div>
      <div style="flex: 1; background: #ffffff; border-radius: 12px; padding: 1rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <p style="margin: 0; color: #6b6b6b; font-size: 0.7rem; text-transform: uppercase; font-weight: 600;">Transactions</p>
        <p style="margin: 0.25rem 0 0; font-size: 1.3rem; font-weight: 800;">${expense_count}</p>
      </div>
    </div>
    <div style="background: #ffffff; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <p style="margin: 0 0 0.75rem; font-weight: 700; font-size: 0.9rem;">Top Expenses</p>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #f0ede6;">
            <th style="padding: 0.5rem; text-align: left; font-size: 0.7rem; color: #6b6b6b; text-transform: uppercase; font-weight: 600;">Date</th>
            <th style="padding: 0.5rem; text-align: left; font-size: 0.7rem; color: #6b6b6b; text-transform: uppercase; font-weight: 600;">Category</th>
            <th style="padding: 0.5rem; text-align: right; font-size: 0.7rem; color: #6b6b6b; text-transform: uppercase; font-weight: 600;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${top_rows}
        </tbody>
      </table>
    </div>
    `;
    return _build_spendly_email_base('📊 Weekly Spending Summary', content);
}

function _build_otp_email_html(name, otp) {
    const e_name = escape(name);
    const e_otp = escape(otp);
    const content = `
    <p style="margin: 0 0 0.25rem; color: #2d2d2d; font-size: 0.95rem;">
      Welcome to Spendly, <strong>${e_name}</strong>!
    </p>
    <p style="margin: 0 0 1.5rem; color: #6b6b6b; font-size: 0.85rem;">
      Use the code below to verify your email address and activate your account.
    </p>
    <div style="background: #ffffff; border-radius: 16px; padding: 1.5rem; text-align: center; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e8e5df;">
      <p style="margin: 0 0 0.75rem; color: #6b6b6b; font-size: 0.7rem; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Verification Code</p>
      <div style="background: #f7f6f3; border-radius: 12px; padding: 0.75rem 1.5rem; display: inline-block;">
        <span style="font-size: 2.2rem; font-weight: 800; letter-spacing: 0.35em; color: ${BRAND_GREEN_DARK}; font-family: 'Courier New', monospace;">${e_otp}</span>
      </div>
      <p style="margin: 1rem 0 0; color: #a0a0a0; font-size: 0.75rem;">
        This code expires in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    <div style="background: #f0f7f0; border-radius: 10px; padding: 0.75rem 1rem; margin-top: 1rem; text-align: center;">
      <p style="margin: 0; font-size: 0.75rem; color: ${BRAND_GREEN_DARK};">
        📌 Why verify? It helps us keep your financial data secure.
      </p>
    </div>
    `;
    return _build_spendly_email_base('Verify your email address', content);
}

function _build_signin_confirmation_html(user_name, time_str, ip_address, provider) {
    const e_name = escape(user_name);
    const e_time = escape(time_str);
    const e_ip = escape(ip_address);

    const provider_badge = {
        'email': '🔐 Email & Password',
        'google': '🔵 Google',
        'github': '🐙 GitHub'
    }[provider] || '🔐 Email & Password';

    const content = `
    <p style="margin: 0 0 0.25rem; color: #2d2d2d; font-size: 0.95rem;">
      Hi <strong>${e_name}</strong>, you've successfully signed in to your Spendly account.
    </p>
    <p style="margin: 0 0 1.5rem; color: #6b6b6b; font-size: 0.85rem;">
      This is a security notification — here are the details of this sign-in:
    </p>
    <div style="background: #ffffff; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 1rem;">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
        <tr>
          <td style="padding: 0.6rem 0; color: #6b6b6b; font-weight: 600; width: 80px;">Time</td>
          <td style="padding: 0.6rem 0; color: #2d2d2d;">${e_time}</td>
        </tr>
        <tr style="border-top: 1px solid #f0ede6;">
          <td style="padding: 0.6rem 0; color: #6b6b6b; font-weight: 600;">Method</td>
          <td style="padding: 0.6rem 0; color: #2d2d2d;">${provider_badge}</td>
        </tr>
        <tr style="border-top: 1px solid #f0ede6;">
          <td style="padding: 0.6rem 0; color: #6b6b6b; font-weight: 600;">IP Address</td>
          <td style="padding: 0.6rem 0; color: #2d2d2d;">${e_ip}</td>
        </tr>
      </table>
    </div>
    <div style="background: #f0f7f0; border-radius: 10px; padding: 0.75rem 1rem; text-align: center;">
      <p style="margin: 0; font-size: 0.75rem; color: ${BRAND_GREEN_DARK};">
        🔒 Wasn't you? <a href="#" style="color: ${BRAND_GREEN_DARK}; font-weight: 600;">Secure your account</a> immediately.
      </p>
    </div>
    `;
    return _build_spendly_email_base('✅ Successful Sign-In Confirmed', content);
}

function _build_password_reset_html(reset_url) {
    const e_reset_url = escape(reset_url);
    const content = `
    <p style="margin: 0 0 1.5rem; color: #2d2d2d; font-size: 0.9rem;">
      We received a request to reset your Spendly password. Click the button below to create a new one.
    </p>
    <div style="text-align: center; margin: 1.5rem 0;">
      <a href="${e_reset_url}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, ${BRAND_GREEN_DARK}, ${BRAND_GREEN_MID}); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 0.9rem; box-shadow: 0 4px 14px rgba(26, 71, 42, 0.3);">
        Reset Password
      </a>
    </div>
    <p style="margin: 1.5rem 0 0; color: #a0a0a0; font-size: 0.75rem; text-align: center;">
      This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
    </p>
    <div style="background: #f0f7f0; border-radius: 10px; padding: 0.75rem 1rem; margin-top: 1rem; text-align: center;">
      <p style="margin: 0; font-size: 0.75rem; color: ${BRAND_GREEN_DARK};">
        🔗 Or copy this link: ${e_reset_url}
      </p>
    </div>
    `;
    return _build_spendly_email_base('Reset Your Password', content);
}

async function send_email(to_email, subject, html_body) {
    if (!SMTP_EMAIL || !SMTP_PASSWORD) {
        console.error('SMTP credentials not configured. Set SPENDLY_SMTP_EMAIL and SPENDLY_SMTP_PASSWORD.');
        return { success: false, error: 'SMTP not configured' };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: SMTP_SERVER,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465, // true for 465, false for other ports (like 587)
            auth: {
                user: SMTP_EMAIL,
                pass: SMTP_PASSWORD
            }
        });

        const info = await transporter.sendMail({
            from: `Spendly <${SMTP_EMAIL}>`,
            to: to_email,
            subject: subject,
            html: html_body
        });

        console.log(`Email sent successfully to ${to_email}: ${info.messageId}`);
        return { success: true, error: null };
    } catch (err) {
        console.error(`Failed to send email to ${to_email}:`, err);
        return { success: false, error: err.message };
    }
}

function send_budget_alert(to_email, user_name, spent, budget, projected, top_category = 'Other', top_amount = 0) {
    const html = _build_budget_alert_html(user_name, spent, budget, projected, top_category, top_amount);
    return send_email(to_email, "⚠️ Spendly Budget Alert — You're spending fast!", html);
}

function send_weekly_summary(to_email, user_name, week_total, daily_avg, expense_count, top_expenses) {
    const html = _build_weekly_summary_html(user_name, week_total, daily_avg, expense_count, top_expenses);
    return send_email(to_email, '📊 Your Spendly Weekly Summary', html);
}

function send_signin_confirmation(to_email, user_name, time_str, ip_address, provider = 'email') {
    const html = _build_signin_confirmation_html(user_name, time_str, ip_address, provider);
    return send_email(to_email, '✅ Signed in to Spendly', html);
}

function send_otp_email(to_email, name, otp) {
    const html = _build_otp_email_html(name, otp);
    return send_email(to_email, 'Spendly — Verify your email address', html);
}

function send_password_reset_email(to_email, reset_url) {
    const html = _build_password_reset_html(reset_url);
    return send_email(to_email, 'Spendly — Reset Your Password', html);
}

module.exports = {
    send_email,
    send_budget_alert,
    send_weekly_summary,
    send_signin_confirmation,
    send_otp_email,
    send_password_reset_email
};
