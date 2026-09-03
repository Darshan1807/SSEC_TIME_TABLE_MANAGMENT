from flask import Blueprint, render_template, session, redirect, url_for, flash, request
from models.timetable import TimetableModel
from models.notification import NotificationModel
from models.professor import ProfessorModel
from datetime import datetime

professor_bp = Blueprint('professor', __name__, url_prefix='/professor')

def professor_required(f):
    def decorated_function(*args, **kwargs):
        if 'role' not in session or session['role'] != 'professor':
            flash("Professor access required.", "warning")
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@professor_bp.route('/dashboard')
@professor_required
def dashboard():
    prof_id = session.get('user_id')
    prof_name = session.get('user_name')
    professor = ProfessorModel.get_by_prof_id(prof_id)
    
    assigned_lectures = TimetableModel.get_by_professor(prof_name) or TimetableModel.get_by_professor(prof_id)
    notifications = NotificationModel.get_active('Professor')
    
    today_name = datetime.now().strftime('%A')
    today_lectures = [l for l in assigned_lectures if l.get('day') == today_name]
    next_lecture = today_lectures[0] if today_lectures else None
    
    total_hours = len(assigned_lectures)
    
    return render_template('professor/dashboard.html',
                           professor=professor,
                           assigned_lectures=assigned_lectures,
                           today_lectures=today_lectures,
                           next_lecture=next_lecture,
                           total_hours=total_hours,
                           notifications=notifications,
                           today_date=datetime.now().strftime('%d %B %Y'))

@professor_bp.route('/profile', methods=['GET', 'POST'])
@professor_required
def profile():
    prof_id = session.get('user_id')
    professor = ProfessorModel.get_by_prof_id(prof_id)
    
    if request.method == 'POST':
        full_name = request.form.get('full_name')
        email = request.form.get('email')
        phone = request.form.get('phone')
        new_password = request.form.get('new_password')
        
        update_data = {
            "full_name": full_name,
            "email": email,
            "phone": phone
        }
        if new_password:
            update_data["password"] = new_password
            
        ProfessorModel.update_professor(prof_id, update_data)
        session['user_name'] = full_name
        flash("Profile updated successfully!", "success")
        return redirect(url_for('professor.profile'))

    return render_template('professor/profile.html', professor=professor)
