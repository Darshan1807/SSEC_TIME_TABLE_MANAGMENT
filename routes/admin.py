from flask import Blueprint, render_template, session, redirect, url_for, flash, request
from models.student import StudentModel
from models.professor import ProfessorModel
from models.subject import SubjectModel
from models.classroom import ClassroomModel
from models.timetable import TimetableModel
from models.notification import NotificationModel
from database.db import get_db

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

def admin_required(f):
    def decorated_function(*args, **kwargs):
        if 'role' not in session or session['role'] != 'admin':
            flash("Admin privilege required.", "warning")
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@admin_bp.route('/dashboard')
@admin_required
def dashboard():
    db = get_db()
    total_students = db.students.count_documents({}) if db is not None else 0
    total_professors = db.professors.count_documents({}) if db is not None else 0
    total_subjects = db.subjects.count_documents({}) if db is not None else 0
    total_classrooms = db.classrooms.count_documents({}) if db is not None else 0
    total_timetables = db.timetables.count_documents({}) if db is not None else 0
    
    stats = {
        "total_students": total_students,
        "total_professors": total_professors,
        "total_subjects": total_subjects,
        "total_classrooms": total_classrooms,
        "total_timetables": total_timetables,
        "today_lectures": total_timetables,
        "total_users": total_students + total_professors + 1
    }
    return render_template('admin/dashboard.html', stats=stats)

@admin_bp.route('/users', methods=['GET'])
@admin_required
def users_list():
    db = get_db()
    users = []
    
    # Add System Admin
    users.append({
        "id": "admin_root",
        "full_name": "SSEC IT Administrator",
        "email": "admin.it@ssec.ac.in",
        "role": "admin",
        "identifier": "SSEC.IT.ADMIN",
        "department": "Information Technology",
        "designation": "Department Administrator",
        "phone": "+91 278 2567890",
        "status": "Active",
        "registered_at": "2025-01-01T00:00:00"
    })

    if db is not None:
        # Fetch students
        for s in db.students.find():
            users.append({
                "id": str(s.get("_id")),
                "full_name": s.get("full_name", ""),
                "email": s.get("email") or f"{s.get('enrollment_no', '').lower()}@ssec.ac.in",
                "role": "student",
                "identifier": s.get("enrollment_no", ""),
                "semester": s.get("semester", 1),
                "classroom": s.get("classroom", "IT-LH-101"),
                "phone": s.get("phone", "+91 9800000000"),
                "status": s.get("status", "Active"),
                "registered_at": s.get("registered_at") or s.get("created_at") or "2026-01-01T00:00:00"
            })
        
        # Fetch professors
        for p in db.professors.find():
            users.append({
                "id": str(p.get("_id")),
                "full_name": p.get("full_name", ""),
                "email": p.get("email") or f"{p.get('professor_id', '').lower()}@ssec.ac.in",
                "role": "professor",
                "identifier": p.get("professor_id", ""),
                "department": p.get("department", "Information Technology"),
                "designation": p.get("designation", "Assistant Professor"),
                "phone": p.get("phone", "+91 9825000000"),
                "status": p.get("status", "Active"),
                "registered_at": p.get("registered_at") or p.get("created_at") or "2025-12-01T00:00:00"
            })

    # Sort descending by registration date
    users.sort(key=lambda u: u.get("registered_at", ""), reverse=True)
    return render_template('admin/crud_users.html', users=users)

@admin_bp.route('/api/users', methods=['GET'])
@admin_required
def api_users_list():
    from flask import jsonify
    db = get_db()
    users = []
    
    # Add System Admin
    users.append({
        "id": "admin_root",
        "full_name": "SSEC IT Administrator",
        "email": "admin.it@ssec.ac.in",
        "role": "admin",
        "identifier": "SSEC.IT.ADMIN",
        "department": "Information Technology",
        "designation": "Department Administrator",
        "phone": "+91 278 2567890",
        "status": "Active",
        "registered_at": "2025-01-01T00:00:00"
    })

    if db is not None:
        for s in db.students.find():
            users.append({
                "id": str(s.get("_id")),
                "full_name": s.get("full_name", ""),
                "email": s.get("email") or f"{s.get('enrollment_no', '').lower()}@ssec.ac.in",
                "role": "student",
                "identifier": s.get("enrollment_no", ""),
                "semester": s.get("semester", 1),
                "classroom": s.get("classroom", "IT-LH-101"),
                "phone": s.get("phone", "+91 9800000000"),
                "status": s.get("status", "Active"),
                "registered_at": s.get("registered_at") or s.get("created_at") or "2026-01-01T00:00:00"
            })
        
        for p in db.professors.find():
            users.append({
                "id": str(p.get("_id")),
                "full_name": p.get("full_name", ""),
                "email": p.get("email") or f"{p.get('professor_id', '').lower()}@ssec.ac.in",
                "role": "professor",
                "identifier": p.get("professor_id", ""),
                "department": p.get("department", "Information Technology"),
                "designation": p.get("designation", "Assistant Professor"),
                "phone": p.get("phone", "+91 9825000000"),
                "status": p.get("status", "Active"),
                "registered_at": p.get("registered_at") or p.get("created_at") or "2025-12-01T00:00:00"
            })

    users.sort(key=lambda u: u.get("registered_at", ""), reverse=True)
    return jsonify({"status": "success", "count": len(users), "users": users})

# CRUD Routes for Admin
@admin_bp.route('/students', methods=['GET', 'POST'])
@admin_required
def students_crud():
    db = get_db()
    if request.method == 'POST':
        action = request.form.get('action')
        if action == 'create':
            full_name = request.form.get('full_name')
            enrollment_no = request.form.get('enrollment_no')
            password = request.form.get('password')
            semester = request.form.get('semester')
            classroom = request.form.get('classroom')
            StudentModel.create_student(full_name, enrollment_no, password, semester, classroom)
            flash("Student added successfully!", "success")
        elif action == 'delete':
            enrollment_no = request.form.get('enrollment_no')
            db.students.delete_one({"enrollment_no": enrollment_no})
            flash("Student removed.", "info")

    students = list(db.students.find()) if db is not None else []
    return render_template('admin/crud_students.html', students=students)

@admin_bp.route('/professors', methods=['GET', 'POST'])
@admin_required
def professors_crud():
    db = get_db()
    if request.method == 'POST':
        action = request.form.get('action')
        if action == 'create':
            full_name = request.form.get('full_name')
            professor_id = request.form.get('professor_id')
            password = request.form.get('password')
            department = request.form.get('department', 'Information Technology')
            designation = request.form.get('designation', 'Assistant Professor')
            ProfessorModel.create_professor(full_name, professor_id, password, department, designation)
            flash("Professor added successfully!", "success")
        elif action == 'delete':
            professor_id = request.form.get('professor_id')
            db.professors.delete_one({"professor_id": professor_id})
            flash("Professor removed.", "info")

    professors = list(db.professors.find()) if db is not None else []
    return render_template('admin/crud_professors.html', professors=professors)

@admin_bp.route('/subjects', methods=['GET', 'POST'])
@admin_required
def subjects_crud():
    if request.method == 'POST':
        action = request.form.get('action')
        if action == 'create':
            code = request.form.get('code')
            name = request.form.get('name')
            semester = request.form.get('semester')
            credits = request.form.get('credits')
            sub_type = request.form.get('type')
            SubjectModel.create(code, name, semester, credits, sub_type)
            flash("Subject added!", "success")
        elif action == 'delete':
            sub_id = request.form.get('subject_id')
            SubjectModel.delete(sub_id)
            flash("Subject deleted.", "info")

    subjects = SubjectModel.get_all()
    return render_template('admin/crud_subjects.html', subjects=subjects)

@admin_bp.route('/classrooms', methods=['GET', 'POST'])
@admin_required
def classrooms_crud():
    if request.method == 'POST':
        action = request.form.get('action')
        if action == 'create':
            room_number = request.form.get('room_number')
            building = request.form.get('building')
            capacity = request.form.get('capacity')
            room_type = request.form.get('type')
            ClassroomModel.create(room_number, building, capacity, room_type)
            flash("Classroom added!", "success")
        elif action == 'delete':
            room_id = request.form.get('room_id')
            ClassroomModel.delete(room_id)
            flash("Classroom deleted.", "info")

    classrooms = ClassroomModel.get_all()
    return render_template('admin/crud_classrooms.html', classrooms=classrooms)
