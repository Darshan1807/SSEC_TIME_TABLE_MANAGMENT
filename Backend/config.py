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
    
    # App Config
    DEBUG = os.environ.get('FLASK_DEBUG', 'True') == 'True'
