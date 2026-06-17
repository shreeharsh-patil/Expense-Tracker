import os
import sqlite3
import pytest
import database.db as db_module
from database.db import SQLiteDBWrapper
from flask import Flask

def test_sqlite_wrapper_translation():
    wrapper = SQLiteDBWrapper(None)
    
    # Test cases for query translations
    queries = [
        (
            "SELECT TO_CHAR(date::date, 'YYYY-MM') as month, SUM(amount) as total FROM expenses GROUP BY month",
            "SELECT strftime('%Y-%m', date) as month, SUM(amount) as total FROM expenses GROUP BY month"
        ),
        (
            "SELECT TO_CHAR(date::date, 'MM') as month FROM expenses WHERE TO_CHAR(date::date, 'YYYY') = '2026'",
            "SELECT strftime('%m', date) as month FROM expenses WHERE strftime('%Y', date) = '2026'"
        ),
        (
            "SELECT DISTINCT TO_CHAR(date::date, 'YYYY') as yr FROM expenses",
            "SELECT DISTINCT strftime('%Y', date) as yr FROM expenses"
        )
    ]
    
    for pg_query, expected_sqlite in queries:
        assert wrapper._translate_query(pg_query) == expected_sqlite

def test_db_lifecycle():
    # Setup temporary database file path absolutely to avoid confusion
    db_dir = os.path.dirname(os.path.abspath(__file__))
    db_file = os.path.join(db_dir, "database", "test_spendly.db")
    
    if os.path.exists(db_file):
        os.remove(db_file)
        
    app = Flask(__name__)
    app.secret_key = "test-secret"
    
    # Temporarily override database path in db.py to test_spendly.db
    original_get_db = db_module.get_db
    
    # We maintain a single connection for the duration of get_test_db calls if we want to mimic request context caching
    _test_db_connection = None
    
    def get_test_db():
        nonlocal _test_db_connection
        if _test_db_connection is None:
            conn = sqlite3.connect(db_file)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA foreign_keys = ON")
            _test_db_connection = SQLiteDBWrapper(conn)
        return _test_db_connection
        
    db_module.get_db = get_test_db
    
    try:
        with app.app_context():
            # Initialize
            db_module.init_db()
            
            # Verify tables exist
            db = db_module.get_db()
            cursor = db.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row['name'] for row in cursor.fetchall()]
            assert "users" in tables
            assert "expenses" in tables
            assert "recurring_expenses" in tables
            assert "goals" in tables
            
            # Seed first time
            db_module.seed_db()
            cursor = db.execute("SELECT COUNT(*) as cnt FROM users")
            user_count = cursor.fetchone()['cnt']
            assert user_count == 1
            
            cursor = db.execute("SELECT COUNT(*) as cnt FROM expenses")
            expense_count = cursor.fetchone()['cnt']
            assert expense_count == 8
            
            # Seed second time (should not duplicate)
            db_module.seed_db()
            cursor = db.execute("SELECT COUNT(*) as cnt FROM users")
            assert cursor.fetchone()['cnt'] == 1
            cursor = db.execute("SELECT COUNT(*) as cnt FROM expenses")
            assert cursor.fetchone()['cnt'] == 8
            
            # Close connection
            db.close()
            _test_db_connection = None
            
    finally:
        # Restore original get_db
        db_module.get_db = original_get_db
        
        # Clean up test file
        if os.path.exists(db_file):
            try:
                os.remove(db_file)
            except Exception:
                pass
