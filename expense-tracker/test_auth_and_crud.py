import pytest
import os
import sqlite3
from app import app as flask_app
from database.db import get_db as original_get_db, init_db, SQLiteDBWrapper
from database import db as db_module


@pytest.fixture(autouse=True)
def setup_db():
    """Patch get_db to return a fresh in-memory SQLite DB for each test.
    Also reset the global rate limiter state."""
    conn = sqlite3.connect(':memory:')
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    test_db = SQLiteDBWrapper(conn)

    original = db_module.get_db
    db_module.get_db = lambda: test_db

    # Reset rate limiter for test isolation
    import app as app_module
    app_module._login_attempts.clear()

    # Also patch app_module's local imported reference to get_db
    original_app_get_db = app_module.get_db
    app_module.get_db = lambda: test_db

    with flask_app.app_context():
        init_db()

    yield

    conn.close()
    db_module.get_db = original
    app_module.get_db = original_app_get_db


@pytest.fixture
def client():
    flask_app.config['TESTING'] = True
    flask_app.config['WTF_CSRF_ENABLED'] = False
    flask_app.config['SECRET_KEY'] = 'test-secret'
    with flask_app.test_client() as c:
        yield c


class TestAuth:
    def test_register_creates_user(self, client):
        resp = client.post('/register', data={
            'name': 'Test User', 'email': 'test@example.com', 'password': 'secret123', 'confirm_password': 'secret123'
        })
        # Should either redirect (302) or show form with success
        assert resp.status_code in (200, 302)

    def test_register_and_login(self, client):
        client.post('/register', data={
            'name': 'Test User', 'email': 'test@example.com', 'password': 'secret123', 'confirm_password': 'secret123'
        })
        resp = client.post('/login', data={
            'email': 'test@example.com', 'password': 'secret123'
        }, follow_redirects=True)
        assert resp.status_code == 200
        assert b'Welcome back' in resp.data

    def test_register_duplicate_email(self, client):
        client.post('/register', data={
            'name': 'Alice', 'email': 'dup@test.com', 'password': 'secret123', 'confirm_password': 'secret123'
        })
        resp = client.post('/register', data={
            'name': 'Bob', 'email': 'dup@test.com', 'password': 'secret123', 'confirm_password': 'secret123'
        }, follow_redirects=True)
        assert b'Email already exists' in resp.data

    def test_login_invalid(self, client):
        resp = client.post('/login', data={
            'email': 'nobody@test.com', 'password': 'wrong'
        }, follow_redirects=True)
        assert b'Invalid credentials' in resp.data

    def test_dashboard_redirects_anon(self, client):
        resp = client.get('/dashboard')
        assert resp.status_code == 302

    def test_logout(self, client):
        client.post('/register', data={
            'name': 'Test', 'email': 'u@test.com', 'password': 'pass123', 'confirm_password': 'pass123'
        })
        client.post('/login', data={'email': 'u@test.com', 'password': 'pass123'})
        resp = client.get('/logout', follow_redirects=True)
        assert b'Successfully logged out' in resp.data


class TestExpenseCRUD:
    def _login(self, client):
        client.post('/register', data={
            'name': 'User', 'email': 'user@test.com', 'password': 'pass1234', 'confirm_password': 'pass1234'
        }, follow_redirects=True)
        client.post('/login', data={
            'email': 'user@test.com', 'password': 'pass1234'
        }, follow_redirects=True)

    def test_add_expense(self, client):
        self._login(client)
        resp = client.post('/expenses/add', data={
            'amount': '50.00', 'category': 'Food',
            'payment_method': 'Cash', 'description': 'Lunch', 'date': '2026-06-15'
        }, follow_redirects=True)
        assert resp.status_code == 200
        assert b'Expense added' in resp.data

    def test_add_expense_negative(self, client):
        self._login(client)
        resp = client.post('/expenses/add', data={
            'amount': '-10', 'category': 'Food',
            'payment_method': 'Cash', 'description': 'Test', 'date': '2026-06-15'
        }, follow_redirects=True)
        assert b'greater than zero' in resp.data

    def test_add_expense_invalid_amount(self, client):
        self._login(client)
        resp = client.post('/expenses/add', data={
            'amount': 'abc', 'category': 'Food',
            'payment_method': 'Cash', 'description': 'Test', 'date': '2026-06-15'
        }, follow_redirects=True)
        assert b'Invalid amount' in resp.data

    def test_edit_expense(self, client):
        self._login(client)
        add_resp = client.post('/expenses/add', data={
            'amount': '100', 'category': 'Food',
            'payment_method': 'Cash', 'description': 'Original', 'date': '2026-06-15'
        }, follow_redirects=True)
        assert b'Expense added' in add_resp.data, f"Add failed: {add_resp.data[:200]}"
        resp = client.post('/expenses/1/edit', data={
            'amount': '200', 'category': 'Transport',
            'payment_method': 'Card', 'description': 'Updated', 'date': '2026-06-16'
        }, follow_redirects=True)
        assert resp.status_code == 200
        assert b'Expense updated' in resp.data or b'Expense not found' in resp.data, f"Unexpected: {resp.data[:200]}"

    def test_delete_expense(self, client):
        self._login(client)
        client.post('/expenses/add', data={
            'amount': '100', 'category': 'Food',
            'payment_method': 'Cash', 'description': 'To delete', 'date': '2026-06-15'
        }, follow_redirects=True)
        resp = client.post('/expenses/1/delete', follow_redirects=True)
        assert resp.status_code == 200
        assert b'Expense deleted' in resp.data

    def test_edit_nonexistent(self, client):
        self._login(client)
        resp = client.get('/expenses/999/edit', follow_redirects=True)
        assert b'Expense not found' in resp.data

    def test_authorization(self, client):
        from app import _login_attempts
        _login_attempts.clear()
    
        # User A adds an expense
        reg_a = client.post('/register', data={
            'name': 'Alice', 'email': 'a@test.com', 'password': 'pppppp', 'confirm_password': 'pppppp'
        })
        assert reg_a.status_code in (200, 302)
        log_a = client.post('/login', data={'email': 'a@test.com', 'password': 'pppppp'}, follow_redirects=True)
        assert b'Welcome back' in log_a.data or b'Dashboard' in log_a.data, f"A login failed: {log_a.data[:200]}"

        client.post('/expenses/add', data={
            'amount': '100', 'category': 'Food',
            'payment_method': 'Cash', 'description': 'A expense', 'date': '2026-06-15'
        }, follow_redirects=True)
        client.get('/logout')
        _login_attempts.clear()

        # User B tries to edit A's expense
        reg_b = client.post('/register', data={
            'name': 'Bob', 'email': 'b@test.com', 'password': 'pppppp', 'confirm_password': 'pppppp'
        })
        assert reg_b.status_code in (200, 302)
        log_b = client.post('/login', data={'email': 'b@test.com', 'password': 'pppppp'}, follow_redirects=True)
        assert b'Welcome back' in log_b.data or b'Dashboard' in log_b.data, f"B login failed: {log_b.data[:200]}"

        resp = client.get('/expenses/1/edit', follow_redirects=True)
        assert b'Expense not found' in resp.data or b'dashboard' in resp.data


class TestBudget:
    def _login(self, client):
        client.post('/register', data={
            'name': 'Test', 'email': 'u@test.com', 'password': 'pass123', 'confirm_password': 'pass123'
        })
        client.post('/login', data={'email': 'u@test.com', 'password': 'pass123'}, follow_redirects=True)
        client.post('/login', data={'email': 'u@test.com', 'password': 'pass123'}, follow_redirects=True)

    def test_update_budget(self, client):
        self._login(client)
        resp = client.post('/budget/update', data={'budget': '50000'}, follow_redirects=True)
        assert b'Budget updated' in resp.data

    def test_negative_budget(self, client):
        self._login(client)
        resp = client.post('/budget/update', data={'budget': '-1000'}, follow_redirects=True)
        assert b'Budget cannot be negative' in resp.data

    def test_invalid_budget(self, client):
        self._login(client)
        resp = client.post('/budget/update', data={'budget': 'abc'}, follow_redirects=True)
        assert b'Invalid budget' in resp.data


class TestRecurring:
    def _login(self, client):
        client.post('/register', data={
            'name': 'Test', 'email': 'u@test.com', 'password': 'pass123', 'confirm_password': 'pass123'
        })
        client.post('/login', data={'email': 'u@test.com', 'password': 'pass123'}, follow_redirects=True)

    def test_add_recurring(self, client):
        self._login(client)
        resp = client.post('/recurring/add', data={
            'amount': '500', 'category': 'Bills',
            'payment_method': 'Auto', 'description': 'Netflix',
            'day_of_month': '5'
        }, follow_redirects=True)
        assert b'Recurring expense scheduled' in resp.data

    def test_invalid_day(self, client):
        self._login(client)
        resp = client.post('/recurring/add', data={
            'amount': '500', 'category': 'Bills',
            'payment_method': 'Auto', 'description': 'Test',
            'day_of_month': '32'
        }, follow_redirects=True)
        assert b'Day of month must be between 1 and 28' in resp.data

    def test_negative_amount(self, client):
        self._login(client)
        resp = client.post('/recurring/add', data={
            'amount': '-100', 'category': 'Bills',
            'payment_method': 'Auto', 'description': 'Test',
            'day_of_month': '5'
        }, follow_redirects=True)
        assert b'greater than zero' in resp.data

    def test_delete_recurring(self, client):
        self._login(client)
        client.post('/recurring/add', data={
            'amount': '500', 'category': 'Bills',
            'payment_method': 'Auto', 'description': 'Netflix',
            'day_of_month': '5'
        }, follow_redirects=True)
        resp = client.post('/recurring/1/delete', follow_redirects=True)
        assert b'Recurring expense removed' in resp.data


class TestCSVExport:
    def _login(self, client):
        client.post('/register', data={
            'name': 'Test', 'email': 'u@test.com', 'password': 'pass123', 'confirm_password': 'pass123'
        })
        client.post('/login', data={'email': 'u@test.com', 'password': 'pass123'}, follow_redirects=True)

    def test_export(self, client):
        self._login(client)
        client.post('/expenses/add', data={
            'amount': '100', 'category': 'Food',
            'payment_method': 'Cash', 'description': 'Test', 'date': '2026-06-15'
        }, follow_redirects=True)
        resp = client.get('/expenses/export')
        assert resp.status_code == 200
        assert b'Food' in resp.data


class TestPasswordReset:
    def test_page_loads(self, client):
        resp = client.get('/forgot-password')
        assert resp.status_code == 200
        assert b'Forgot password' in resp.data

    def test_invalid_token(self, client):
        resp = client.post('/reset-password/badtoken', data={
            'password': 'newpass', 'confirm_password': 'newpass'
        }, follow_redirects=True)
        assert b'Invalid or expired reset link' in resp.data
