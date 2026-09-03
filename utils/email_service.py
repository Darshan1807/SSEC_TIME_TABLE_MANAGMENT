import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app
from flask_mail import Mail, Message

mail = Mail()

def init_mail(app):
    """Initialize Flask-Mail with the Flask application context."""
    mail.init_app(app)

class EmailService:
    @staticmethod
    def get_registration_text(recipient_name: str, otp: str, expiry_minutes: int = 5) -> str:
        return f"""SSEC IT Department
Timetable Management System

Hello {recipient_name},

Your email verification OTP is:

{otp}

This OTP will expire in {expiry_minutes} minutes.

If you did not request this verification, please ignore this email.

Regards,
SSEC IT Department
Shantilal Shah Engineering College (SSEC), Bhavnagar
"""

    @staticmethod
    def get_registration_html(recipient_name: str, otp: str, expiry_minutes: int = 5) -> str:
        return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
    .header {{ text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 18px; }}
    .dept-title {{ color: #0284c7; font-size: 20px; font-weight: 800; margin: 0; }}
    .college-name {{ color: #64748b; font-size: 13px; margin: 4px 0 0 0; }}
    .body-content {{ padding: 24px 0; font-size: 14px; line-height: 1.6; color: #334155; }}
    .otp-card {{ background: #f0f9ff; border: 2px dashed #0284c7; border-radius: 12px; text-align: center; padding: 20px; margin: 20px 0; }}
    .otp-value {{ font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0369a1; font-family: 'Courier New', monospace; margin: 8px 0; }}
    .expiry {{ font-size: 12px; color: #64748b; font-weight: 500; }}
    .footer {{ border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5; }}
    .notice {{ background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; font-size: 12px; color: #92400e; margin-top: 20px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 class="dept-title">SSEC IT Department</h2>
      <p class="college-name">Timetable Management System &bull; Email Verification</p>
    </div>
    <div class="body-content">
      <p>Hello <strong>{recipient_name}</strong>,</p>
      <p>Thank you for registering on the SSEC IT Timetable Management Portal. Your email verification OTP is:</p>
      
      <div class="otp-card">
        <div style="font-size: 11px; color: #0284c7; font-weight: 700; text-transform: uppercase;">6-Digit Verification OTP</div>
        <div class="otp-value">{otp}</div>
        <div class="expiry">This OTP will expire in {expiry_minutes} minutes.</div>
      </div>

      <div class="notice">
        <strong>Security Notice:</strong> If you did not request this verification, please ignore this email. Never share this code with anyone.
      </div>
    </div>
    <div class="footer">
      Regards,<br>
      <strong>SSEC IT Department</strong><br>
      Shantilal Shah Engineering College, Bhavnagar
    </div>
  </div>
</body>
</html>"""

    @staticmethod
    def get_password_reset_text(recipient_name: str, otp: str, expiry_minutes: int = 5) -> str:
        return f"""SSEC IT Department
Timetable Management System

Hello {recipient_name},

Your password reset OTP is:

{otp}

This OTP will expire in {expiry_minutes} minutes.

If you did not request a password reset, please ignore this email immediately.

Regards,
SSEC IT Department
Shantilal Shah Engineering College (SSEC), Bhavnagar
"""

    @staticmethod
    def get_password_reset_html(recipient_name: str, otp: str, expiry_minutes: int = 5) -> str:
        return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
    .header {{ text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 18px; }}
    .dept-title {{ color: #d97706; font-size: 20px; font-weight: 800; margin: 0; }}
    .college-name {{ color: #64748b; font-size: 13px; margin: 4px 0 0 0; }}
    .body-content {{ padding: 24px 0; font-size: 14px; line-height: 1.6; color: #334155; }}
    .otp-card {{ background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 12px; text-align: center; padding: 20px; margin: 20px 0; }}
    .otp-value {{ font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #b45309; font-family: 'Courier New', monospace; margin: 8px 0; }}
    .expiry {{ font-size: 12px; color: #64748b; font-weight: 500; }}
    .footer {{ border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5; }}
    .notice {{ background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; font-size: 12px; color: #991b1b; margin-top: 20px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 class="dept-title">SSEC IT Department</h2>
      <p class="college-name">Timetable Management System &bull; Password Reset</p>
    </div>
    <div class="body-content">
      <p>Hello <strong>{recipient_name}</strong>,</p>
      <p>We received a request to reset your password. Your password reset verification code is:</p>
      
      <div class="otp-card">
        <div style="font-size: 11px; color: #b45309; font-weight: 700; text-transform: uppercase;">Password Reset OTP</div>
        <div class="otp-value">{otp}</div>
        <div class="expiry">This OTP will expire in {expiry_minutes} minutes.</div>
      </div>

      <div class="notice">
        <strong>Important:</strong> If you did not request a password reset, please ignore this email or contact the SSEC IT administrator immediately.
      </div>
    </div>
    <div class="footer">
      Regards,<br>
      <strong>SSEC IT Department</strong><br>
      Shantilal Shah Engineering College, Bhavnagar
    </div>
  </div>
</body>
</html>"""

    @classmethod
    def dispatch_email(cls, to_email: str, subject: str, body_text: str, body_html: str) -> dict:
        """
        Sends email strictly via real Gmail SMTP.
        """
        clean_email = to_email.strip().lower()
        
        # 1. First attempt: Flask-Mail with current app context
        try:
            if current_app and current_app.config.get('MAIL_SERVER') and current_app.config.get('MAIL_PASSWORD'):
                sender = current_app.config.get('MAIL_DEFAULT_SENDER') or current_app.config.get('MAIL_USERNAME', 'darshanparmar1100@gmail.com')
                msg = Message(
                    subject=subject,
                    recipients=[clean_email],
                    body=body_text,
                    html=body_html,
                    sender=sender
                )
                mail.send(msg)
                return {"success": True, "method": "Flask-Mail SMTP", "recipient": clean_email}
        except Exception as app_err:
            pass

        # 2. Direct smtplib fallback using environment variables
        smtp_server = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('MAIL_PORT', 587))
        username = os.environ.get('MAIL_USERNAME', 'darshanparmar1100@gmail.com')
        password = os.environ.get('MAIL_PASSWORD', '')
        sender = os.environ.get('MAIL_DEFAULT_SENDER', username)
        use_tls = os.environ.get('MAIL_USE_TLS', 'True').lower() in ('true', '1', 't')
        use_ssl = os.environ.get('MAIL_USE_SSL', 'False').lower() in ('true', '1', 't')

        if not password or password == 'your_gmail_app_password':
            # Missing real SMTP credentials in environment
            return {
                "success": False, 
                "error": "Gmail SMTP credentials not configured. Please set MAIL_PASSWORD (Gmail App Password) in .env.",
                "recipient": clean_email
            }

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = sender
            msg["To"] = clean_email

            part1 = MIMEText(body_text, "plain", "utf-8")
            part2 = MIMEText(body_html, "html", "utf-8")
            msg.attach(part1)
            msg.attach(part2)

            if use_ssl:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(smtp_server, smtp_port, context=context, timeout=15) as server:
                    server.login(username, password)
                    server.sendmail(sender, [clean_email], msg.as_string())
            else:
                with smtplib.SMTP(smtp_server, smtp_port, timeout=15) as server:
                    if use_tls:
                        context = ssl.create_default_context()
                        server.starttls(context=context)
                    server.login(username, password)
                    server.sendmail(sender, [clean_email], msg.as_string())

            return {"success": True, "method": "Gmail SMTP", "recipient": clean_email}
        except Exception as e:
            return {"success": False, "error": f"SMTP Dispatch Error: {str(e)}", "recipient": clean_email}

def send_registration_otp(email: str, otp: str, recipient_name: str = "Student/Faculty", expiry_minutes: int = 5) -> dict:
    """
    Dispatches the Registration Verification OTP email via real Gmail SMTP.
    """
    subject = "[SSEC IT Portal] Verify Your Email Address - OTP"
    body_text = EmailService.get_registration_text(recipient_name, otp, expiry_minutes)
    body_html = EmailService.get_registration_html(recipient_name, otp, expiry_minutes)
    return EmailService.dispatch_email(email, subject, body_text, body_html)

def send_password_reset_otp(email: str, otp: str, recipient_name: str = "User", expiry_minutes: int = 5) -> dict:
    """
    Dispatches the Password Reset OTP email via real Gmail SMTP.
    """
    subject = "[SSEC IT Portal] Password Reset Verification Code"
    body_text = EmailService.get_password_reset_text(recipient_name, otp, expiry_minutes)
    body_html = EmailService.get_password_reset_html(recipient_name, otp, expiry_minutes)
    return EmailService.dispatch_email(email, subject, body_text, body_html)

# Backward compatibility alias
EmailOTPService = EmailService

