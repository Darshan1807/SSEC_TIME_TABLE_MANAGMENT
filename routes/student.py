from flask import Blueprint, render_template, session, redirect, url_for, flash, request
from models.timetable import TimetableModel
from models.notification import NotificationModel
from models.student import StudentModel
from datetime import datetime

student_bp = Blueprint('student', __name__, url_prefix='/student')

def student_required(f):
    def decorated_function(*args, **kwargs):
        if 'role' not in session or session['role'] != 'student':
            flash("Student access required.", "warning")
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@student_bp.route('/dashboard')
@student_required
def dashboard():
    enrollment_no = session.get('user_id')
    student = StudentModel.get_by_enrollment(enrollment_no)
    
    semester = student.get('semester', 1) if student else 1
    classroom = student.get('classroom', 'IT-LH-101') if student else 'IT-LH-101'
    
    timetables = TimetableModel.get_by_semester_and_classroom(semester, classroom)
    notifications = NotificationModel.get_active('Student')
    
    today_name = datetime.now().strftime('%A')
    today_classes = [t for t in timetables if t.get('day') == today_name]
    
    next_lecture = today_classes[0] if today_classes else None
    
    return render_template('student/dashboard.html',
                           student=student,
                           timetables=timetables,
                           today_classes=today_classes,
                           next_lecture=next_lecture,
                           notifications=notifications,
                           today_date=datetime.now().strftime('%d %B %Y'))

@student_bp.route('/profile', methods=['GET', 'POST'])
@student_required
def profile():
    enrollment_no = session.get('user_id')
    student = StudentModel.get_by_enrollment(enrollment_no)
    
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
            
        StudentModel.update_student(enrollment_no, update_data)
        session['user_name'] = full_name
        flash("Profile updated successfully!", "success")
        return redirect(url_for('student.profile'))

    return render_template('student/profile.html', student=student)
