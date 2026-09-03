import os
from flask import Flask, render_template, redirect, url_for
from config import Config
from database.db import init_db, get_db
from utils.email_service import init_mail
from utils.seed_data import seed_database

# Import Blueprints
from routes.auth import auth_bp
from routes.otp import otp_bp
from routes.student import student_bp
from routes.professor import professor_bp
from routes.admin import admin_bp
from routes.timetable import timetable_bp
from routes.notification import notification_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize Mongo Atlas Database
    init_db(app)

    # Initialize Flask-Mail OTP Email Service
    init_mail(app)

    # Seed Sample Data on initial run
    with app.app_context():
        try:
            db = get_db()
            if db is not None:
                seed_database(db)
        except Exception as e:
            print(f"Data seed skipped or fallback active: {e}")

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(otp_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(professor_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(timetable_bp)
    app.register_blueprint(notification_bp)

    @app.route('/')
    def index():
        return redirect(url_for('auth.login'))

    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('404.html'), 404

    @app.errorhandler(500)
    def internal_server_error(e):
        return render_template('500.html'), 500

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port, debug=True)
