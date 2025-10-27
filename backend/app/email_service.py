"""
Email service for sending OTPs and notifications.
"""
import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import os
from datetime import datetime, timedelta


def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP."""
    return ''.join(random.choices(string.digits, k=length))


def send_otp_email(receiver_email: str, otp: str) -> bool:
    """
    Send OTP to user's email for password reset verification.

    Args:
        receiver_email: Recipient's email address
        otp: The OTP code to send

    Returns:
        True if email sent successfully, False otherwise
    """
    sender_email = os.getenv("SMTP_EMAIL", "abhishek@textraja.com")
    app_password = os.getenv("SMTP_APP_PASSWORD", "xigq zhzc kxqr smry")

    subject = "Password Reset OTP - Therapy Bro"
    body = f"""
Hello,

You requested to reset your password for Therapy Bro.

Your OTP code is: {otp}

This code will expire in 10 minutes.

If you did not request this password reset, please ignore this email.

Best regards,
Therapy Bro Team
    """

    try:
        # Create the email
        message = MIMEMultipart()
        message["From"] = sender_email
        message["To"] = receiver_email
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain"))

        # Connect to Gmail SMTP server
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()  # Secure connection
            server.login(sender_email, app_password)
            server.send_message(message)

        print(f"✅ OTP email sent successfully to {receiver_email}")
        return True
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        return False
