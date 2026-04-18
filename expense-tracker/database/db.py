import sqlite3
import os
from flask import g
from werkzeug.security import generate_password_hash
from datetime import date

DATABASE = os.path.join(os.path.dirname(__file__), 'spendly.db')


def get_db():
    """Open a connection to the SQLite database, reusing it within the request context."""
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON;")
    return g.db


def init_db():
    """Create all tables if they don't already exist. Safe to call multiple times."""
    db = get_db()

    # Users table (extended with optional profile fields used by the app)
    db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            name           TEXT    NOT NULL,
            email          TEXT    UNIQUE NOT NULL,
            password_hash  TEXT    NOT NULL,
            monthly_budget REAL    DEFAULT 10000.0,
            phone          TEXT,
            avatar_url     TEXT,
            created_at     TEXT    DEFAULT (datetime('now'))
        )
    """)

    # Expenses table
    db.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            amount      REAL    NOT NULL,
            category    TEXT    NOT NULL,
            payment_method TEXT DEFAULT 'Cash',
            date        TEXT    NOT NULL,
            description TEXT,
            created_at  TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # Recurring expenses table
    db.execute("""
        CREATE TABLE IF NOT EXISTS recurring_expenses (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            amount      REAL    NOT NULL,
            category    TEXT    NOT NULL,
            payment_method TEXT DEFAULT 'Cash',
            description TEXT,
            day_of_month INTEGER NOT NULL,
            last_processed_month TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # Savings Goals table
    db.execute("""
        CREATE TABLE IF NOT EXISTS goals (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id        INTEGER NOT NULL,
            name           TEXT    NOT NULL,
            target_amount  REAL    NOT NULL,
            current_saved   REAL    DEFAULT 0,
            deadline       TEXT,
            created_at     TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    db.commit()


def seed_db():
    """Insert demo user and sample expenses only if the users table is empty."""
    db = get_db()

    # Guard: skip seeding if data already exists
    existing = db.execute("SELECT COUNT(*) as cnt FROM users").fetchone()
    if existing['cnt'] > 0:
        return

    # Insert demo user
    db.execute(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        (
            "Demo User",
            "demo@spendly.com",
            generate_password_hash("demo123"),
        ),
    )
    db.commit()

    user = db.execute("SELECT id FROM users WHERE email = ?", ("demo@spendly.com",)).fetchone()
    user_id = user['id']

    # 8 sample expenses spread across the current month, one per required category
    # Dates are hardcoded to April 2026 (current month as of spec creation)
    sample_expenses = [
        (user_id, 850.00,  "Food",          "2026-04-01", "Grocery run – weekly vegetables and dairy"),
        (user_id, 320.00,  "Transport",     "2026-04-03", "Ola cab – commute to office"),
        (user_id, 1500.00, "Bills",         "2026-04-05", "Electricity bill for March"),
        (user_id, 600.00,  "Health",        "2026-04-08", "Pharmacy – vitamins and medicines"),
        (user_id, 450.00,  "Entertainment", "2026-04-10", "Netflix + Spotify subscriptions"),
        (user_id, 2200.00, "Shopping",      "2026-04-13", "Myntra order – summer clothing haul"),
        (user_id, 780.00,  "Food",          "2026-04-15", "Zomato orders for the week"),
        (user_id, 300.00,  "Other",         "2026-04-17", "Miscellaneous – stationery and home supplies"),
    ]

    db.executemany(
        "INSERT INTO expenses (user_id, amount, category, date, description) VALUES (?, ?, ?, ?, ?)",
        sample_expenses,
    )
    db.commit()


def process_recurring_expenses(user_id):
    """Checks recurring expenses and creates entries in 'expenses' table if due."""
    db = get_db()
    today = date.today()
    current_month_str = today.strftime("%Y-%m")
    
    recurring = db.execute(
        "SELECT * FROM recurring_expenses WHERE user_id = ?",
        (user_id,)
    ).fetchall()

    for rec in recurring:
        last_month = rec['last_processed_month']
        
        # If not processed for current month AND we are on or past the due day
        if last_month != current_month_str and today.day >= rec['day_of_month']:
            # Create the actual expense
            due_date = f"{current_month_str}-{rec['day_of_month']:02d}"
            db.execute(
                "INSERT INTO expenses (user_id, amount, category, payment_method, date, description) VALUES (?, ?, ?, ?, ?, ?)",
                (user_id, rec['amount'], rec['category'], rec['payment_method'], due_date, f"[Recurring] {rec['description']}")
            )
            # Update last processed month
            db.execute(
                "UPDATE recurring_expenses SET last_processed_month = ? WHERE id = ?",
                (current_month_str, rec['id'])
            )
            
    db.commit()
