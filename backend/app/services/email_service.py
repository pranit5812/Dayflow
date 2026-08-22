import smtplib
import asyncio
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

def send_email_sync(to_email: str, subject: str, html_content: str) -> bool:
    """
    Synchronous SMTP mail delivery worker using Python smtplib.
    Supports STARTTLS (Port 587) or SSL (Port 465).
    """
    smtp_user = settings.SMTP_USER.strip()
    smtp_password = settings.SMTP_PASSWORD.strip().replace(" ", "")
    smtp_host = settings.SMTP_HOST.strip()
    smtp_port = settings.SMTP_PORT
    
    if not smtp_user or not smtp_password:
        logger.info(f"📧 [SMTP SIMULATION] Real SMTP credentials not set in .env. Email to '{to_email}' logged to console.\nSubject: {subject}")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to_email

    part = MIMEText(html_content, "html")
    msg.attach(part)

    try:
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15) as server:
                server.login(smtp_user, smtp_password)
                server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
                if settings.SMTP_TLS:
                    server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())

        logger.info(f"✅ Real SMTP Email successfully sent to '{to_email}' with subject '{subject}'.")
        return True
    except Exception as e:
        logger.error(f"❌ Real SMTP Email delivery failed to '{to_email}': {str(e)}")
        return False

async def send_email_async(to_email: str, subject: str, html_content: str) -> bool:
    """Non-blocking async wrapper for send_email_sync."""
    return await asyncio.to_thread(send_email_sync, to_email, subject, html_content)

async def send_otp_email(to_email: str, employee_id: str, otp_code: str) -> bool:
    """Sends a styled Password Reset OTP Verification email to the employee."""
    subject = "Dayflow HRMS - Password Reset OTP Verification Code"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }}
            .container {{ max-width: 560px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; }}
            .header {{ text-align: center; border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 24px; }}
            .logo {{ font-size: 24px; font-weight: 900; color: #38bdf8; text-decoration: none; }}
            .otp-box {{ background: linear-gradient(135deg, #0284c7, #6366f1); border-radius: 12px; padding: 20px; text-align: center; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #ffffff; margin: 24px 0; box-shadow: 0 10px 25px -5px rgba(14, 165, 233, 0.4); }}
            .notice {{ font-size: 12px; color: #94a3b8; line-height: 1.6; text-align: center; border-top: 1px solid #334155; padding-top: 20px; margin-top: 28px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">⚡ Dayflow HRMS</div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Human Resource Management Engine</div>
            </div>
            
            <h2 style="font-size: 20px; margin-top: 0;">Password Reset Verification</h2>
            <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
                Hello Employee <strong>{employee_id}</strong>,<br>
                We received a request to reset your password for your Dayflow account registered under <strong>{to_email}</strong>.
            </p>

            <div class="otp-box">{otp_code}</div>

            <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5;">
                This OTP code is valid for <strong>10 minutes</strong>. Please do not share this code with anyone.
            </p>

            <div class="notice">
                If you did not request a password reset, please ignore this email or contact your HR Administrator.<br>
                &copy; 2026 Dayflow HRMS System. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    """
    return await send_email_async(to_email, subject, html_content)
