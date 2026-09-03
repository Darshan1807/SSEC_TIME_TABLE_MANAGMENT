from functools import wraps
from flask import session, redirect, url_for, flash
from werkzeug.security import generate_password_hash, check_password_hash

def hash_password(password: str) -> str:
    """Hashes password using Werkzeug security functions."""
    return generate_password_hash(password)

def verify_password(hashed_password: str, password: str) -> bool:
    """Verifies plain password against hashed password."""
    if not hashed_password or not password:
        return False
    return check_password_hash(hashed_password, password)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash("Please log in to access this page.", "warning")
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

def role_required(role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session or session.get('role') != role:
                flash(f"Unauthorized access. Requires {role} privileges.", "danger")
                return redirect(url_for('auth.login'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator
