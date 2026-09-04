import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'ssec_it_default_secret_key_2026')
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb+srv://admin:SSECIT2026@cluster0.lhna7yh.mongodb.net/ssec_timetable?retryWrites=true&w=majority&appName=Cluster0')
    MONGO_DBNAME = os.environ.get('MONGO_DB_NAME', 'ssec_timetable')
    
    # Admin Credentials
    ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'SSEC.IT.ADMIN')
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Admin@ssecit')
    
    # College Metadata
    COLLEGE_NAME = "Shantilal Shah Engineering College (SSEC)"
    DEPARTMENT_NAME = "Information Technology Department"

    # Flask-Mail & SMTP Configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() in ('true', '1', 't')
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'False').lower() in ('true', '1', 't')
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME', 'darshanparmar1100@gmail.com')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', '') # App Password
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', ('SSEC IT Timetable Portal', 'darshanparmar1100@gmail.com'))
    MAIL_MAX_EMAILS = None
    MAIL_ASCII_ATTACHMENTS = False

    # Third-Party OTP / Email API (Optional SendGrid / Mailgun)
    SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
    OTP_EXPIRY_MINUTES = int(os.environ.get('OTP_EXPIRY_MINUTES', 5))
