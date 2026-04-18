import os
import sys
from email_alerts import send_email

def test_connection():
    print("--- Spendly SMTP Connection Tester ---")
    
    email = os.environ.get('SPENDLY_SMTP_EMAIL')
    password = os.environ.get('SPENDLY_SMTP_PASSWORD')
    
    if not email or not password:
        print("ERROR: Environment variables NOT found.")
        print("Please run these commands first:")
        print('  $env:SPENDLY_SMTP_EMAIL = "your-email@gmail.com"')
        print('  $env:SPENDLY_SMTP_PASSWORD = "your-app-password"')
        return

    print(f"Checking connection for: {email}...")
    
    subject = "Spendly - SMTP Connection Test ✅"
    body = f"""
    <h1>It works!</h1>
    <p>This is a test email from <b>Spendly</b>.</p>
    <p>Your SMTP configuration is correct and the app is now ready to send budget alerts and weekly summaries.</p>
    <hr>
    <p><small>Sent via Spendly Test Utility</small></p>
    """
    
    result = send_email(email, subject, body)
    
    if result['success']:
        print("\n✅ SUCCESS! A test email has been sent to your inbox.")
        print("Check your spam folder if you don't see it in a minute.")
    else:
        print("\n❌ FAILED")
        print(f"Error details: {result['error']}")
        print("\nTips:")
        print("1. Ensure 2-Step Verification is ON in your Google Account.")
        print("2. Make sure you are using a 16-character APP PASSWORD, not your regular password.")
        print("3. Check your internet connection.")

if __name__ == "__main__":
    test_connection()
