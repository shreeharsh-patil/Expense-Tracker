import pytest
from app import app, _login_attempts
from database.db import get_db, init_db, seed_db

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret'
    # Reset rate limiter for test isolation
    _login_attempts.clear()
    with app.test_client() as client:
        with app.app_context():
            init_db()
            seed_db()
        yield client

def test_dashboard_renders_successfully(client):
    # Log in
    response = client.post('/login', data={
        'email': 'demo@spendly.com',
        'password': 'demo123'
    }, follow_redirects=True)
    assert response.status_code == 200
    
    # Hit dashboard
    res = client.get('/dashboard')
    assert res.status_code == 200
    
    html = res.data.decode('utf-8')
    assert "chartData" in html
    # Print the script block so we can inspect it in the command output
    idx = html.find("const chartData")
    if idx != -1:
        print("\n=== RENDERED CHART DATA SCRIPT ===\n")
        print(html[idx:idx+500])
        print("==================================\n")

def test_reports_renders_successfully(client):
    # Log in
    response = client.post('/login', data={
        'email': 'demo@spendly.com',
        'password': 'demo123'
    }, follow_redirects=True)
    assert response.status_code == 200
    
    # Hit reports
    res = client.get('/reports')
    assert res.status_code == 200
    
    html = res.data.decode('utf-8')
    assert "reportData" in html
    idx = html.find("const reportData")
    if idx != -1:
        print("\n=== RENDERED REPORT DATA SCRIPT ===\n")
        print(html[idx:idx+500])
        print("==================================\n")

