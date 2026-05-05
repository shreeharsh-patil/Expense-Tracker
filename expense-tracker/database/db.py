import os
import psycopg2
import psycopg2.extras
from flask import g
from werkzeug.security import generate_password_hash
from datetime import date

class PostgresDBWrapper:
    """A wrapper around psycopg2 connection to mimic sqlite3 connection API
    used by the Spendly Flask application, so we don't have to rewrite app.py."""
    
    def __init__(self, conn):
        self.conn = conn
        # Expose IntegrityError so app.py can catch db.IntegrityError
        self.IntegrityError = psycopg2.IntegrityError
        
    def execute(self, query, params=None):
        # Automatically replace ? with %s for Postgres compatibility
        q_converted = query.replace('?', '%s')
        cursor = self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if params is not None:
            cursor.execute(q_converted, params)
        else:
            cursor.execute(q_converted)
        return cursor

    def executemany(self, query, params_list):
        q_converted = query.replace('?', '%s')
        cursor = self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.executemany(q_converted, params_list)
        return cursor
        
    def commit(self):
        self.conn.commit()
        
    def close(self):
        self.conn.close()


def get_db():
    """Open a connection to the Postgres database, reusing it within the request context."""
    if 'db' not in g:
        database_url = os.environ.get('POSTGRES_URL')
        if not database_url:
            raise RuntimeError("POSTGRES_URL environment variable is missing!")
            
        # Ensure sslmode is set for Vercel/Neon Postgres
        if '?' not in database_url and ('vercel-storage' in database_url or 'neon.tech' in database_url):
            database_url += "?sslmode=require"
            
        conn = psycopg2.connect(database_url)
        g.db = PostgresDBWrapper(conn)
    return g.db


def init_db():
    """Create all tables if they don't already exist. Safe to call multiple times."""
    db = get_db()

    # Users table
    db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id             SERIAL PRIMARY KEY,
            name           TEXT    NOT NULL,
            email          TEXT    UNIQUE NOT NULL,
            password_hash  TEXT    NOT NULL,
            monthly_budget REAL    DEFAULT 10000.0,
            phone          TEXT,
            avatar_url     TEXT,
            created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Expenses table
    db.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id          SERIAL PRIMARY KEY,
            user_id     INTEGER NOT NULL,
            amount      REAL    NOT NULL,
            category    TEXT    NOT NULL,
            payment_method TEXT DEFAULT 'Cash',
            date        TEXT    NOT NULL,
            description TEXT,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # Recurring expenses table
    db.execute("""
        CREATE TABLE IF NOT EXISTS recurring_expenses (
            id          SERIAL PRIMARY KEY,
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
            id             SERIAL PRIMARY KEY,
            user_id        INTEGER NOT NULL,
            name           TEXT    NOT NULL,
            target_amount  REAL    NOT NULL,
            current_saved   REAL    DEFAULT 0,
            deadline       TEXT,
            created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    sample_expenses = [
        (user_id, 850.00,  "Food",          "2026-04-01", "Grocery run - weekly vegetables and dairy"),
        (user_id, 320.00,  "Transport",     "2026-04-03", "Ola cab - commute to office"),
        (user_id, 1500.00, "Bills",         "2026-04-05", "Electricity bill for March"),
        (user_id, 600.00,  "Health",        "2026-04-08", "Pharmacy - vitamins and medicines"),
        (user_id, 450.00,  "Entertainment", "2026-04-10", "Netflix + Spotify subscriptions"),
        (user_id, 2200.00, "Shopping",      "2026-04-13", "Myntra order - summer clothing haul"),
        (user_id, 780.00,  "Food",          "2026-04-15", "Zomato orders for the week"),
        (user_id, 300.00,  "Other",         "2026-04-17", "Miscellaneous - stationery and home supplies"),
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
