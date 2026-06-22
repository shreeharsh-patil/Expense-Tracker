import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False
    with app.test_client() as client:
        yield client

def test_landing_renders_successfully(client):
    res = client.get('/')
    assert res.status_code == 200
    html = res.data.decode('utf-8')
    
    # Assert that Spendly branding is present
    assert "Spendly" in html
    
    # Assert that the Tailwind stylesheet is loaded (from base.html layout)
    assert "tailwind.css" in html
    
    # Assert that it loads features section content
    assert "OCR Ingestion" in html or "ocr" in html.lower()
    assert "Forecasting" in html or "forecast" in html.lower()
    
    # Assert register and login navigation routes are present
    assert "/register" in html
    assert "/login" in html
    
    # Assert live demo simulator section is configured
    assert "live-demo" in html
    assert "updateDemoLedger" in html

    print("Spendly landing page test passed successfully!")
