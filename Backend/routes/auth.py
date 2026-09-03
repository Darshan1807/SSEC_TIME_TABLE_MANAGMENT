from flask import Blueprint, render_template, request, redirect, url_for, flash, session, current_app
from models.student import StudentModel
from models.professor import ProfessorModel

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        role = request.form.get('role')
        full_name = request.form.get('full_name')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

        if password != confirm_password:
            flash("Passwords do not match!", "danger")
            return redirect(url_for('auth.register'))

        if role == 'student':
            enrollment_no = request.form.get('enrollment_no')
            student, msg = StudentModel.create_student(full_name, enrollment_no, password)
            if student:
                flash("Student Registration Successful! Please Login.", "success")
                return redirect(url_for('auth.login'))
            else:
                flash(msg, "danger")
        elif role == 'professor':
            professor_id = request.form.get('professor_id')
            prof, msg = ProfessorModel.create_professor(full_name, professor_id, password)
            if prof:
                flash("Professor Registration Successful! Please Login.", "success")
                return redirect(url_for('auth.login'))
            else:
                flash(msg, "danger")

    return render_template('auth/register.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        role = request.form.get('role')
        password = request.form.get('password')

        if role == 'admin':
            username = request.form.get('username')
            admin_user = current_app.config['ADMIN_USERNAME']
            admin_pass = current_app.config['ADMIN_PASSWORD']
            
            if username == admin_user and password == admin_pass:
                session['user_id'] = 'ADMIN'
                session['user_name'] = 'SSEC IT Administrator'
                session['role'] = 'admin'
                flash("Welcome Admin!", "success")
                return redirect(url_for('admin.dashboard'))
            else:
                flash("Invalid Admin Credentials!", "danger")

        elif role == 'student':
            enrollment_no = request.form.get('enrollment_no')
            student = StudentModel.get_by_enrollment(enrollment_no)
            if student and StudentModel.verify_password(student['password'], password):
                session['user_id'] = student['enrollment_no']
                session['user_name'] = student['full_name']
                session['role'] = 'student'
                session['semester'] = student.get('semester', 1)
                session['classroom'] = student.get('classroom', 'IT-LH-101')
                flash(f"Welcome back, {student['full_name']}!", "success")
                return redirect(url_for('student.dashboard'))
            else:
                flash("Invalid Enrollment Number or Password!", "danger")

        elif role == 'professor':
            professor_id = request.form.get('professor_id')
            prof = ProfessorModel.get_by_prof_id(professor_id)
            if prof and ProfessorModel.verify_password(prof['password'], password):
                session['user_id'] = prof['professor_id']
                session['user_name'] = prof['full_name']
                session['role'] = 'professor'
                flash(f"Welcome Professor {prof['full_name']}!", "success")
                return redirect(url_for('professor.dashboard'))
            else:
                flash("Invalid Professor ID or Password!", "danger")

    return render_template('auth/login.html')

@auth_bp.route('/logout')
def logout():
    session.clear()
    flash("You have logged out successfully.", "info")
    return redirect(url_for('auth.login'))
