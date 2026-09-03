import React, { useState } from 'react';
import { Code, X, Copy, Check, Folder, ChevronDown, ChevronRight, Search, FileCode, Layers, ShieldCheck } from 'lucide-react';

interface FlaskCodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FileItem {
  name: string;
  path: string;
  type: string;
  category: 'Frontend' | 'Backend';
  iconColor: string;
  lang: string;
}

export const FlaskCodeViewerModal: React.FC<FlaskCodeViewerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const filesList: FileItem[] = [
    // Frontend Folder
    { name: 'frontend/templates/base.html', path: '/frontend/templates/base.html', type: 'HTML5 Jinja2 Base Layout', category: 'Frontend', iconColor: 'text-amber-500', lang: 'html' },
    { name: 'frontend/templates/login.html', path: '/frontend/templates/login.html', type: 'HTML Login Template (Bootstrap 5)', category: 'Frontend', iconColor: 'text-amber-500', lang: 'html' },
    { name: 'frontend/templates/student_dashboard.html', path: '/frontend/templates/student_dashboard.html', type: 'HTML Student View', category: 'Frontend', iconColor: 'text-amber-500', lang: 'html' },
    { name: 'frontend/templates/professor_dashboard.html', path: '/frontend/templates/professor_dashboard.html', type: 'HTML Professor View', category: 'Frontend', iconColor: 'text-amber-500', lang: 'html' },
    { name: 'frontend/templates/admin_dashboard.html', path: '/frontend/templates/admin_dashboard.html', type: 'HTML Admin CRUD View', category: 'Frontend', iconColor: 'text-amber-500', lang: 'html' },
    { name: 'frontend/static/css/style.css', path: '/frontend/static/css/style.css', type: 'Custom CSS Stylesheet', category: 'Frontend', iconColor: 'text-sky-400', lang: 'css' },
    { name: 'frontend/static/js/main.js', path: '/frontend/static/js/main.js', type: 'Frontend Client JS', category: 'Frontend', iconColor: 'text-yellow-400', lang: 'javascript' },

    // Backend Folder
    { name: 'backend/app.py', path: '/backend/app.py', type: 'Python Flask Entry Point', category: 'Backend', iconColor: 'text-emerald-400', lang: 'python' },
    { name: 'backend/config.py', path: '/backend/config.py', type: 'Flask Settings & Atlas ENV', category: 'Backend', iconColor: 'text-emerald-400', lang: 'python' },
    { name: 'backend/database/db.py', path: '/backend/database/db.py', type: 'MongoDB PyMongo Setup', category: 'Backend', iconColor: 'text-emerald-400', lang: 'python' },
    { name: 'backend/models/student.py', path: '/backend/models/student.py', type: 'Student Model (Mongo)', category: 'Backend', iconColor: 'text-purple-400', lang: 'python' },
    { name: 'backend/models/professor.py', path: '/backend/models/professor.py', type: 'Professor Model (Mongo)', category: 'Backend', iconColor: 'text-purple-400', lang: 'python' },
    { name: 'backend/models/otp.py', path: '/backend/models/otp.py', type: 'MongoDB OTP Verification Model', category: 'Backend', iconColor: 'text-amber-400', lang: 'python' },
    { name: 'backend/models/subject.py', path: '/backend/models/subject.py', type: 'Subject Model (CRUD & Code)', category: 'Backend', iconColor: 'text-purple-400', lang: 'python' },
    { name: 'backend/models/classroom.py', path: '/backend/models/classroom.py', type: 'Classroom Model (CRUD & Status)', category: 'Backend', iconColor: 'text-purple-400', lang: 'python' },
    { name: 'backend/models/timetable.py', path: '/backend/models/timetable.py', type: 'Timetable & Clash Model', category: 'Backend', iconColor: 'text-purple-400', lang: 'python' },
    { name: 'backend/models/notification.py', path: '/backend/models/notification.py', type: 'Notification Model', category: 'Backend', iconColor: 'text-purple-400', lang: 'python' },
    { name: 'backend/routes/auth.py', path: '/backend/routes/auth.py', type: 'Authentication & OTP Blueprint', category: 'Backend', iconColor: 'text-blue-400', lang: 'python' },
    { name: 'backend/routes/student.py', path: '/backend/routes/student.py', type: 'Student Dashboard Blueprint', category: 'Backend', iconColor: 'text-blue-400', lang: 'python' },
    { name: 'backend/routes/professor.py', path: '/backend/routes/professor.py', type: 'Professor Dashboard Blueprint', category: 'Backend', iconColor: 'text-blue-400', lang: 'python' },
    { name: 'backend/routes/admin.py', path: '/backend/routes/admin.py', type: 'Admin CRUD Blueprint', category: 'Backend', iconColor: 'text-blue-400', lang: 'python' },
    { name: 'backend/utils/email_service.py', path: '/backend/utils/email_service.py', type: 'Flask-Mail & SMTP OTP Dispatcher', category: 'Backend', iconColor: 'text-amber-400', lang: 'python' },
    { name: 'backend/utils/pdf_generator.py', path: '/backend/utils/pdf_generator.py', type: 'ReportLab PDF Generator', category: 'Backend', iconColor: 'text-rose-400', lang: 'python' },
    { name: 'backend/utils/seed_data.py', path: '/backend/utils/seed_data.py', type: 'MongoDB Seeder Script', category: 'Backend', iconColor: 'text-rose-400', lang: 'python' },
    { name: 'backend/requirements.txt', path: '/backend/requirements.txt', type: 'PIP Dependencies', category: 'Backend', iconColor: 'text-slate-400', lang: 'text' },
    { name: 'backend/.env', path: '/backend/.env', type: 'Secrets & Environment Variables', category: 'Backend', iconColor: 'text-slate-400', lang: 'text' },
    { name: 'backend/README.md', path: '/backend/README.md', type: 'Setup Documentation', category: 'Backend', iconColor: 'text-slate-400', lang: 'markdown' }
  ];

  const [selectedFile, setSelectedFile] = useState<FileItem>(filesList[0]);
  const [copied, setCopied] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [openFolders, setOpenFolders] = useState<{ Frontend: boolean; Backend: boolean }>({
    Frontend: true,
    Backend: true
  });

  const toggleFolder = (folder: 'Frontend' | 'Backend') => {
    setOpenFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  // File contents snippets
  const getFileContent = (filename: string) => {
    const cleanName = filename.replace(/^frontend\//, '').replace(/^backend\//, '');
    switch (cleanName) {
      case 'app.py':
        return `from flask import Flask, render_template, redirect, url_for, session\nfrom config import Config\nfrom database.db import init_db, get_db\nfrom routes.auth import auth_bp\nfrom routes.student import student_bp\nfrom routes.professor import professor_bp\nfrom routes.admin import admin_bp\n\napp = Flask(__name__)\napp.config.from_object(Config)\ninit_db(app)\n\n# Register Flask Blueprints\napp.register_blueprint(auth_bp)\napp.register_blueprint(student_bp)\napp.register_blueprint(professor_bp)\napp.register_blueprint(admin_bp)\n\n@app.route('/')\ndef index():\n    if 'user' in session:\n        role = session['user'].get('role')\n        if role == 'student':\n            return redirect(url_for('student.dashboard'))\n        elif role == 'professor':\n            return redirect(url_for('professor.dashboard'))\n        elif role == 'admin':\n            return redirect(url_for('admin.dashboard'))\n    return redirect(url_for('auth.login'))\n\nif __name__ == '__main__':\n    app.run(host='0.0.0.0', port=3000, debug=True)`;

      case 'config.py':
        return `import os\nfrom dotenv import load_dotenv\n\nload_dotenv()\n\nclass Config:\n    SECRET_KEY = os.getenv('SECRET_KEY', 'ssec_it_dept_secret_key_2026')\n    MONGO_URI = os.getenv('MONGO_URI', 'mongodb+srv://admin:SSECIT2026@cluster0.yh7oncz.mongodb.net/?appName=Cluster0')\n    MONGO_DBNAME = os.getenv('MONGO_DB_NAME', 'ssec_timetable_db')\n    DEBUG = True`;

      case 'templates/base.html':
        return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>{% block title %}SSEC IT Dept Timetable Portal{% endblock %}</title>\n  <!-- Bootstrap 5 CSS CDN -->\n  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">\n  <!-- Bootstrap Icons CDN -->\n  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">\n  <!-- Custom CSS -->\n  <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">\n</head>\n<body class="bg-light">\n  <!-- Global Navigation Bar -->\n  <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">\n    <div class="container">\n      <a class="navbar-brand font-weight-bold d-flex align-items-center gap-2" href="/">\n        <i class="bi bi-clock-history"></i> SSEC IT Timetable\n      </a>\n      {% if session.get('user') %}\n      <div class="d-flex align-items-center gap-3">\n        <span class="text-white small">Welcome, <strong>{{ session['user']['name'] }}</strong></span>\n        <a href="/logout" class="btn btn-outline-light btn-sm">Logout</a>\n      </div>\n      {% endif %}\n    </div>\n  </nav>\n\n  <main class="container py-4">\n    {% block content %}{% endblock %}\n  </main>\n\n  <!-- Bootstrap 5 JS Bundle -->\n  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>\n  <!-- Custom JavaScript -->\n  <script src="{{ url_for('static', filename='js/main.js') }}"></script>\n</body>\n</html>`;

      case 'templates/login.html':
        return `{% extends 'base.html' %}\n{% block title %}Login - SSEC IT Timetable Portal{% endblock %}\n\n{% block content %}\n<div class="row justify-content-center mt-5">\n  <div class="col-md-6 col-lg-5">\n    <div class="card shadow-sm border-0 rounded-4">\n      <div class="card-body p-4 p-sm-5">\n        <div class="text-center mb-4">\n          <div class="bg-primary text-white rounded-circle d-inline-flex p-3 mb-2">\n            <i class="bi bi-person-badge fs-2"></i>\n          </div>\n          <h4 class="fw-bold text-dark">SSEC IT Dept Portal</h4>\n          <p class="text-muted small">Select your role to view timetables & schedules</p>\n        </div>\n\n        <form action="/login" method="POST" id="loginForm">\n          <!-- Role Selector Tabs using Bootstrap -->\n          <div class="btn-group w-100 mb-4" role="group">\n            <input type="radio" class="btn-check" name="role" id="roleStudent" value="student" checked>\n            <label class="btn btn-outline-primary" for="roleStudent"><i class="bi bi-mortarboard me-1"></i> Student</label>\n\n            <input type="radio" class="btn-check" name="role" id="roleProfessor" value="professor">\n            <label class="btn btn-outline-primary" for="roleProfessor"><i class="bi bi-person-workspace me-1"></i> Professor</label>\n\n            <input type="radio" class="btn-check" name="role" id="roleAdmin" value="admin">\n            <label class="btn btn-outline-primary" for="roleAdmin"><i class="bi bi-shield-check me-1"></i> Admin</label>\n          </div>\n\n          <div class="mb-3">\n            <label class="form-label small fw-semibold" id="identifierLabel">Enrollment Number</label>\n            <input type="text" name="identifier" class="form-control" placeholder="Enter ID / Enrollment No" required>\n          </div>\n\n          <div class="mb-4">\n            <label class="form-label small fw-semibold">Password</label>\n            <input type="password" name="password" class="form-control" placeholder="••••••••" required>\n          </div>\n\n          <button type="submit" class="btn btn-primary w-100 py-2.5 fw-semibold shadow-sm">\n            Sign In to Portal\n          </button>\n        </form>\n      </div>\n    </div>\n  </div>\n</div>\n{% endblock %}`;

      case 'templates/student_dashboard.html':
        return `{% extends 'base.html' %}\n{% block title %}Student Dashboard - SSEC IT{% endblock %}\n\n{% block content %}\n<div class="row g-4">\n  <!-- Welcome Banner -->\n  <div class="col-12">\n    <div class="p-4 p-md-5 bg-primary text-white rounded-4 shadow-sm">\n      <div class="d-flex justify-content-between align-items-center">\n        <div>\n          <span class="badge bg-white text-primary px-3 py-2 rounded-pill fw-semibold mb-2">Semester {{ student.semester }} &bull; Class {{ student.classroom }}</span>\n          <h2 class="fw-bold mb-1">Welcome, {{ student.full_name }}</h2>\n          <p class="mb-0 text-white-50">Enrollment: {{ student.enrollment_no }} | Dept: Information Technology</p>\n        </div>\n        <a href="/export/pdf" class="btn btn-light text-primary font-weight-semibold shadow-sm">\n          <i class="bi bi-download me-1"></i> Export PDF\n        </a>\n      </div>\n    </div>\n  </div>\n\n  <!-- Weekly Timetable Cards -->\n  <div class="col-lg-8">\n    <div class="card border-0 shadow-sm rounded-4">\n      <div class="card-header bg-white py-3 border-0">\n        <h5 class="fw-bold mb-0 text-dark"><i class="bi bi-calendar3 me-2 text-primary"></i> Class Timetable</h5>\n      </div>\n      <div class="card-body p-0">\n        <div class="table-responsive">\n          <table class="table table-hover align-middle mb-0">\n            <thead class="table-light">\n              <tr>\n                <th>Day & Time</th>\n                <th>Subject</th>\n                <th>Professor</th>\n                <th>Room</th>\n              </tr>\n            </thead>\n            <tbody>\n              {% for slot in timetables %}\n              <tr>\n                <td>\n                  <span class="badge bg-primary-subtle text-primary">{{ slot.day }}</span>\n                  <div class="small fw-semibold text-muted">{{ slot.time_slot }}</div>\n                </td>\n                <td class="fw-bold text-dark">{{ slot.subject }}</td>\n                <td class="small">{{ slot.professor }}</td>\n                <td><span class="badge bg-secondary font-monospace">Room {{ slot.room_number }}</span></td>\n              </tr>\n              {% endfor %}\n            </tbody>\n          </table>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n{% endblock %}`;

      case 'templates/professor_dashboard.html':
        return `{% extends 'base.html' %}\n{% block title %}Professor Workload - SSEC IT{% endblock %}\n\n{% block content %}\n<div class="row g-4">\n  <div class="col-12">\n    <div class="p-4 bg-primary text-white rounded-4 shadow-sm">\n      <h2 class="fw-bold mb-1">Welcome, {{ professor.full_name }}</h2>\n      <p class="text-white-50 mb-0">Faculty ID: {{ professor.professor_id }} | Designation: {{ professor.designation }}</p>\n    </div>\n  </div>\n\n  <div class="col-md-8">\n    <div class="card border-0 shadow-sm rounded-4">\n      <div class="card-header bg-white py-3 border-0">\n        <h5 class="fw-bold mb-0">Teaching Schedule</h5>\n      </div>\n      <div class="card-body p-0">\n        <ul class="list-group list-group-flush">\n          {% for slot in professor_slots %}\n          <li class="list-group-item d-flex justify-content-between align-items-center py-3">\n            <div>\n              <span class="badge bg-primary mb-1">{{ slot.day }} - {{ slot.time_slot }}</span>\n              <h6 class="fw-bold mb-0">{{ slot.subject }}</h6>\n              <small class="text-muted">Target: Semester {{ slot.semester }} ({{ slot.classroom }})</small>\n            </div>\n            <span class="badge bg-secondary font-monospace">Room {{ slot.room_number }}</span>\n          </li>\n          {% endfor %}\n        </ul>\n      </div>\n    </div>\n  </div>\n</div>\n{% endblock %}`;

      case 'templates/admin_dashboard.html':
        return `{% extends 'base.html' %}\n{% block title %}Admin Control Panel - SSEC IT{% endblock %}\n\n{% block content %}\n<div class="container-fluid">\n  <div class="d-flex justify-content-between align-items-center mb-4">\n    <h3 class="fw-bold text-dark"><i class="bi bi-shield-lock me-2 text-primary"></i> Department Management Panel</h3>\n  </div>\n  <!-- Admin Tabs: Timetable, Subjects (With Code), Classrooms (CRUD), Students, Professors -->\n</div>\n{% endblock %}`;

      case 'static/css/style.css':
        return `/* Custom Styling for SSEC IT Department Timetable Portal */\n:root {\n  --primary-color: #0284c7;\n  --bg-light: #f8fafc;\n}\n\nbody {\n  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;\n  background-color: var(--bg-light);\n  color: #1e293b;\n}\n\n.card {\n  transition: transform 0.2s ease, box-shadow 0.2s ease;\n}\n\n.table th {\n  font-weight: 600;\n  font-size: 0.85rem;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n}`;

      case 'static/js/main.js':
        return `// SSEC IT Timetable Portal Frontend JavaScript\ndocument.addEventListener('DOMContentLoaded', () => {\n  console.log('SSEC IT Timetable Frontend Initialized.');\n});`;

      case 'database/db.py':
        return `import os\nfrom flask_pymongo import PyMongo\nfrom pymongo import MongoClient\nfrom pymongo.server_api import ServerApi\n\nMONGO_URI = os.getenv('MONGO_URI', 'mongodb+srv://admin:SSECIT2026@cluster0.yh7oncz.mongodb.net/?appName=Cluster0')\nMONGO_DBNAME = os.getenv('MONGO_DB_NAME', 'ssec_timetable_db')\n\nmongo = PyMongo()\n_client = None\n\ndef init_db(app):\n    global _client\n    app.config['MONGO_URI'] = MONGO_URI\n    try:\n        mongo.init_app(app)\n        _client = MongoClient(MONGO_URI, server_api=ServerApi('1'))\n        _client.admin.command('ping')\n        print("Connected to MongoDB Atlas platform successfully.")\n    except Exception as e:\n        print(f"MongoDB Atlas Notice: {e}")\n\ndef get_db():\n    if mongo.db is not None:\n        return mongo.db\n    if _client is not None:\n        return _client[MONGO_DBNAME]\n    fallback_client = MongoClient(MONGO_URI)\n    return fallback_client[MONGO_DBNAME]`;

      case 'models/subject.py':
        return `from database.db import get_db\nfrom bson.objectid import ObjectId\n\nclass SubjectModel:\n    @staticmethod\n    def get_all():\n        db = get_db()\n        return list(db.subjects.find())\n\n    @staticmethod\n    def create(code, name, semester, credits, type_):\n        db = get_db()\n        if db.subjects.find_one({"code": code}):\n            return None, f"Subject Code '{code}' already exists!"\n        new_sub = {\n            "code": code,\n            "name": name,\n            "semester": int(semester),\n            "credits": int(credits),\n            "type": type_\n        }\n        res = db.subjects.insert_one(new_sub)\n        return str(res.inserted_id), None\n\n    @staticmethod\n    def update(subject_id, update_data):\n        db = get_db()\n        if "code" in update_data:\n          existing = db.subjects.find_one({"code": update_data["code"], "_id": {"$ne": ObjectId(subject_id)}})\n          if existing:\n            return False, f"Subject Code '{update_data['code']}' is already in use!"\n        db.subjects.update_one({"_id": ObjectId(subject_id)}, {"$set": update_data})\n        return True, None\n\n    @staticmethod\n    def delete(subject_id):\n        db = get_db()\n        db.subjects.delete_one({"_id": ObjectId(subject_id)})\n        return True`;

      case 'models/classroom.py':
        return `from database.db import get_db\nfrom bson.objectid import ObjectId\n\nclass ClassroomModel:\n    @staticmethod\n    def get_all():\n        db = get_db()\n        return list(db.classrooms.find())\n\n    @staticmethod\n    def create(room_number, building, capacity, type_, status="Available"):\n        db = get_db()\n        if db.classrooms.find_one({"room_number": room_number}):\n            return None, f"Room Number '{room_number}' already exists!"\n        new_room = {\n            "room_number": room_number,\n            "building": building,\n            "capacity": int(capacity),\n            "type": type_,\n            "status": status\n        }\n        res = db.classrooms.insert_one(new_room)\n        return str(res.inserted_id), None\n\n    @staticmethod\n    def update(room_id, update_data):\n        db = get_db()\n        if "room_number" in update_data:\n          existing = db.classrooms.find_one({"room_number": update_data["room_number"], "_id": {"$ne": ObjectId(room_id)}})\n          if existing:\n            return False, f"Room Number '{update_data['room_number']}' is already taken!"\n        db.classrooms.update_one({"_id": ObjectId(room_id)}, {"$set": update_data})\n        return True, None\n\n    @staticmethod\n    def delete(room_id):\n        db = get_db()\n        db.classrooms.delete_one({"_id": ObjectId(room_id)})\n        return True`;

      case 'models/timetable.py':
        return `from database.db import get_db\nfrom bson.objectid import ObjectId\n\nclass TimetableModel:\n    @staticmethod\n    def create(semester, classroom, day, time_slot, subject, professor, room_number):\n        db = get_db()\n        # Collision detection logic...\n        collision = db.timetables.find_one({"day": day, "time_slot": time_slot, "room_number": room_number})\n        if collision:\n            return None, "Room clash detected!"\n        # Insert into mongodb...`;

      case 'models/student.py':
        return `from database.db import get_db\n\nclass StudentModel:\n    @staticmethod\n    def get_by_enrollment(enrollment_no):\n        db = get_db()\n        return db.students.find_one({"enrollment_no": enrollment_no})\n\n    @staticmethod\n    def get_all():\n        db = get_db()\n        return list(db.students.find())`;

      case 'models/professor.py':
        return `from database.db import get_db\n\nclass ProfessorModel:\n    @staticmethod\n    def get_by_id(professor_id):\n        db = get_db()\n        return db.professors.find_one({"professor_id": professor_id})\n\n    @staticmethod\n    def get_all():\n        db = get_db()\n        return list(db.professors.find())`;

      case 'routes/admin.py':
        return `from flask import Blueprint, render_template, request, jsonify, redirect, url_for\nfrom models.subject import SubjectModel\nfrom models.classroom import ClassroomModel\nfrom models.timetable import TimetableModel\n\nadmin_bp = Blueprint('admin', __name__, url_prefix='/admin')\n\n@admin_bp.route('/dashboard')\ndef dashboard():\n    subjects = SubjectModel.get_all()\n    classrooms = ClassroomModel.get_all()\n    return render_template('admin_dashboard.html', subjects=subjects, classrooms=classrooms)\n\n@admin_bp.route('/subjects/add', methods=['POST'])\ndef add_subject():\n    code = request.form.get('code')\n    name = request.form.get('name')\n    semester = request.form.get('semester')\n    credits = request.form.get('credits')\n    type_ = request.form.get('type')\n    res, err = SubjectModel.create(code, name, semester, credits, type_)\n    if err:\n        return jsonify({"success": False, "error": err})\n    return jsonify({"success": True, "subject_id": res})`;

      case 'models/otp.py':
        return `import datetime\nimport secrets\nfrom database.db import get_db\nfrom utils.email_service import send_registration_otp, send_password_reset_otp\nfrom utils.otp_service import OTPService\n\nclass OTPModel:\n    COLLECTION_NAME = "otp_verifications"\n\n    @staticmethod\n    def create_and_send_registration_otp(email: str, full_name: str, role: str, identifier: str, password_hash: str, extra_data: dict = None, expiry_minutes: int = 5):\n        db = get_db()\n        email_clean = email.strip().lower()\n        now = datetime.datetime.utcnow()\n\n        # Rate limit: 60 seconds between OTP requests\n        recent = db[OTPModel.COLLECTION_NAME].find_one({"email": email_clean, "purpose": "registration"})\n        if recent and (now - recent["created_at"]).total_seconds() < 60:\n            return {"success": False, "error": "Please wait before requesting another OTP."}\n\n        otp_plain = f"{secrets.randbelow(1000000):06d}"\n        otp_hashed = OTPService.hash_otp(otp_plain)\n        expires_at = now + datetime.timedelta(minutes=expiry_minutes)\n\n        db[OTPModel.COLLECTION_NAME].delete_many({"email": email_clean, "purpose": "registration"})\n        db[OTPModel.COLLECTION_NAME].insert_one({\n            "email": email_clean,\n            "otp_hash": otp_hashed,\n            "purpose": "registration",\n            "expires_at": expires_at,\n            "attempts": 0,\n            "created_at": now,\n            "temp_data": {"full_name": full_name, "role": role, "identifier": identifier, "password_hash": password_hash}\n        })\n\n        dispatch = send_registration_otp(email_clean, otp_plain, full_name, expiry_minutes)\n        if not dispatch.get("success"):\n            db[OTPModel.COLLECTION_NAME].delete_many({"email": email_clean, "purpose": "registration"})\n            return {"success": False, "error": "Unable to send verification email. Please try again later."}\n\n        return {"success": True, "masked_email": OTPService.mask_email(email_clean), "expires_in_minutes": expiry_minutes}`;

      case 'utils/email_service.py':
        return `import smtplib\nfrom email.mime.multipart import MIMEMultipart\nfrom email.mime.text import MIMEText\nfrom flask import current_app\n\ndef send_smtp_email(to_email: str, subject: str, html_body: str) -> dict:\n    """\n    Sends real email via Gmail SMTP (smtp.gmail.com:587) with STARTTLS.\n    Direct delivery to recipient inbox - no simulated mail server.\n    """\n    smtp_server = current_app.config.get('MAIL_SERVER', 'smtp.gmail.com')\n    smtp_port = current_app.config.get('MAIL_PORT', 587)\n    username = current_app.config.get('MAIL_USERNAME', 'darshanparmar1100@gmail.com')\n    password = current_app.config.get('MAIL_PASSWORD')\n    sender = current_app.config.get('MAIL_DEFAULT_SENDER', username)\n\n    msg = MIMEMultipart('alternative')\n    msg['Subject'] = subject\n    msg['From'] = f"SSEC IT Portal <{sender}>"\n    msg['To'] = to_email\n    msg.attach(MIMEText(html_body, 'html'))\n\n    try:\n        with smtplib.SMTP(smtp_server, smtp_port, timeout=20) as server:\n            server.ehlo()\n            server.starttls()\n            server.login(username, password)\n            server.sendmail(sender, [to_email], msg.as_string())\n        return {"success": True, "provider": "Gmail SMTP (Port 587 TLS)"}\n    except Exception as e:\n        return {"success": False, "error": str(e)}`;

      case 'routes/auth.py':
        return `from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify\nfrom models.student import StudentModel\nfrom models.professor import ProfessorModel\nfrom models.otp import OTPModel\nfrom utils.otp_service import OTPService\n\nauth_bp = Blueprint('auth', __name__)\n\n@auth_bp.route('/api/auth/send-otp', methods=['POST'])\ndef send_otp_api():\n    data = request.get_json() or {}\n    email = data.get('email', '').strip()\n    role = data.get('role', 'student')\n    purpose = data.get('purpose', 'registration')\n    res = OTPModel.create_and_send_registration_otp(email=email, full_name=data.get('name', 'User'), role=role, identifier=data.get('identifier', ''), password_hash='')\n    return jsonify(res), (200 if res.get('success') else 400)\n\n@auth_bp.route('/api/auth/verify-otp', methods=['POST'])\ndef verify_otp_api():\n    data = request.get_json() or {}\n    valid, msg, temp_data = OTPModel.verify_otp(email=data.get('email'), purpose=data.get('purpose'), user_otp=data.get('otp', ''))\n    return jsonify({"success": valid, "message": msg}), (200 if valid else 400)`;

      case 'requirements.txt':
        return `Flask==3.0.2\nFlask-PyMongo==2.3.0\nFlask-Mail==0.9.1\npymongo[srv]==4.6.2\nrequests==2.31.0\npython-dotenv==1.0.1\nreportlab==4.1.0\ngunicorn==21.2.0`;

      case '.env':
        return `SECRET_KEY=ssec_it_department_secure_key_2026\nMONGO_URI=mongodb+srv://admin:SSECIT2026@cluster0.yh7oncz.mongodb.net/?appName=Cluster0\nMONGO_DB_NAME=ssec_timetable_db\nMAIL_SERVER=smtp.gmail.com\nMAIL_PORT=587\nMAIL_USE_TLS=True\nMAIL_USERNAME=darshanparmar1100@gmail.com\nMAIL_PASSWORD=your_16_digit_gmail_app_password\nMAIL_DEFAULT_SENDER=darshanparmar1100@gmail.com\nPORT=3000`;

      case 'README.md':
        return `# SSEC IT Department Timetable Portal\n\nFlask + MongoDB Atlas Backend Application for Shantilal Shah Engineering College.\n\n## Quick Setup\n1. Install dependencies: \`pip install -r requirements.txt\`\n2. Configure \`.env\` with your MongoDB Atlas URI.\n3. Run development server: \`python app.py\`\n4. Access at: \`http://localhost:3000\``;

      default:
        return `# Source file available in workspace at ${selectedFile.path}\n# Run: python3 app.py to start Flask backend server!`;
    }
  };

  const copyContent = () => {
    navigator.clipboard.writeText(getFileContent(selectedFile.name));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredFiles = filesList.filter(f =>
    f.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    f.type.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const frontendFiles = filteredFiles.filter(f => f.category === 'Frontend');
  const backendFiles = filteredFiles.filter(f => f.category === 'Backend');

  const fileContent = getFileContent(selectedFile.name);
  const codeLines = fileContent.split('\n');

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* IDE Top Navigation Bar */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-slate-200">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>
            <div className="h-4 w-px bg-slate-800"></div>
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-sm text-slate-100 tracking-wide">Flask & MongoDB Atlas IDE Project</span>
              <span className="text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full">
                SSEC IT Dept Backend
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* IDE Split Container */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-900">
          
          {/* File Explorer Sidebar */}
          <div className="w-full md:w-72 bg-slate-950/90 border-r border-slate-800 flex flex-col shrink-0">
            {/* Explorer Header & Search */}
            <div className="p-3 border-b border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" /> Project Explorer
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                  {filesList.length} files
                </span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter files..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-slate-200 text-xs focus:border-sky-500 focus:outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Tree Navigation */}
            <div className="flex-1 overflow-y-auto p-2 space-y-3 font-mono text-xs">
              
              {/* FOLDER 1: FRONTEND */}
              <div>
                <button
                  onClick={() => toggleFolder('Frontend')}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors group"
                >
                  <div className="flex items-center space-x-2">
                    {openFolders.Frontend ? <ChevronDown className="w-3.5 h-3.5 text-amber-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                    <Folder className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                    <span className="font-bold text-slate-200">Frontend</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans group-hover:text-slate-400">
                    {frontendFiles.length} items
                  </span>
                </button>

                {openFolders.Frontend && (
                  <div className="ml-4 pl-2 border-l border-slate-800 space-y-0.5 mt-1">
                    {frontendFiles.length === 0 ? (
                      <span className="text-[11px] text-slate-600 px-2 py-1 block italic font-sans">No matching files</span>
                    ) : (
                      frontendFiles.map(f => (
                        <button
                          key={f.name}
                          onClick={() => setSelectedFile(f)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between ${
                            selectedFile.name === f.name
                              ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <FileCode className={`w-3.5 h-3.5 shrink-0 ${f.iconColor}`} />
                            <span className="truncate">{f.name.replace('frontend/', '')}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* FOLDER 2: BACKEND */}
              <div>
                <button
                  onClick={() => toggleFolder('Backend')}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors group"
                >
                  <div className="flex items-center space-x-2">
                    {openFolders.Backend ? <ChevronDown className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                    <Folder className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                    <span className="font-bold text-slate-200">Backend</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans group-hover:text-slate-400">
                    {backendFiles.length} items
                  </span>
                </button>

                {openFolders.Backend && (
                  <div className="ml-4 pl-2 border-l border-slate-800 space-y-0.5 mt-1">
                    {backendFiles.length === 0 ? (
                      <span className="text-[11px] text-slate-600 px-2 py-1 block italic font-sans">No matching files</span>
                    ) : (
                      backendFiles.map(f => (
                        <button
                          key={f.name}
                          onClick={() => setSelectedFile(f)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between ${
                            selectedFile.name === f.name
                              ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <FileCode className={`w-3.5 h-3.5 shrink-0 ${f.iconColor}`} />
                            <span className="truncate">{f.name.replace('backend/', '')}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Sidebar Footer info */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 space-y-1 font-sans">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Atlas Connected
              </div>
              <p className="text-[10px] text-slate-500">PyMongo MongoDB Driver & Jinja2 Templates</p>
            </div>

          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 bg-slate-900 flex flex-col overflow-hidden">
            
            {/* Editor File Tab Header */}
            <div className="bg-slate-950/80 border-b border-slate-800 flex justify-between items-center px-4 py-2.5">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 text-sky-300 px-3 py-1 rounded-lg text-xs font-mono">
                  <FileCode className={`w-3.5 h-3.5 ${selectedFile.iconColor}`} />
                  <span className="font-semibold">{selectedFile.path}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
                  {selectedFile.type}
                </span>
              </div>

              <button
                onClick={copyContent}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-xs transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Editor Content Area with Line Numbers */}
            <div className="flex-1 overflow-auto bg-slate-950 font-mono text-xs flex">
              {/* Line Numbers Column */}
              <div className="py-4 px-3 text-right bg-slate-950 text-slate-600 border-r border-slate-800/80 select-none font-mono min-w-[3rem]">
                {codeLines.map((_, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {idx + 1}
                  </div>
                ))}
              </div>

              {/* Code Lines */}
              <div className="p-4 flex-1 text-slate-200 leading-relaxed overflow-x-auto whitespace-pre font-medium">
                {fileContent}
              </div>
            </div>

            {/* Status Bar */}
            <div className="bg-slate-950 border-t border-slate-800 px-4 py-1.5 flex justify-between items-center text-[11px] text-slate-500 font-sans">
              <div className="flex items-center space-x-3 font-mono">
                <span>{selectedFile.lang.toUpperCase()}</span>
                <span>•</span>
                <span>{codeLines.length} lines</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-slate-400">SSEC IT Dept Backend Architecture</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

