# SSEC IT Department - Smart Personalized Timetable Management System

A production-ready, fully responsive web application built with **Python Flask** and **MongoDB Atlas** for managing academic timetables of Students, Professors, and Admins at the Shantilal Shah Engineering College (SSEC) Information Technology Department.

---

## 🌟 Key Features

- **Role-Based Authentication**:
  - **Student**: Register with Enrollment Number, login, view personalized weekly/today schedule, next lecture highlight, search timetables, and export PDFs.
  - **Professor**: Register with Professor ID, login, view assigned lectures, teaching workload stats, search timetables, and download schedule PDFs.
  - **Admin**: Login with secure credentials (`SSEC.IT.ADMIN` / `Admin@ssecit`), access statistics dashboard, perform full CRUD operations on Students, Professors, Subjects, Classrooms, Timetables, and Notifications.
- **Timetable Management & Conflict Warning**:
  - Semester, Classroom, Day, Time Slot, Subject, Professor, Room Number allocation.
  - Automatic schedule resolution for students by semester & classroom, and for professors by assigned lectures.
- **Instant Filtering & Search**:
  - Real-time client & server filtering by Subject, Professor, Day, Time, Semester, and Classroom.
- **ReportLab PDF Export**:
  - Professional PDF export for Student Weekly/Semester Timetables, Professor Teaching Schedules, and Master Department Timetables.
- **Notification System**:
  - High/Medium/Low priority announcements with target audience filters (All, Student, Professor) and unread counters.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.10+, Flask, Werkzeug (Password Hashing), Flask-PyMongo / PyMongo
- **Database**: MongoDB Atlas (`ssec_timetable_db` collection)
- **PDF Generation**: ReportLab
- **Frontend**: HTML5, CSS3, Bootstrap 5, Bootstrap Icons, JavaScript
- **Deployment**: Gunicorn / Flask CLI

---

## 📁 Project Folder Structure

```
SSEC-Timetable-System/
│── app.py                 # Main Flask Application Entry Point
│── config.py              # Application Configuration & Env variables
│── requirements.txt       # Python Dependencies
│── .env                   # Environment Variables
│── database/
│   └── db.py              # MongoDB Atlas Connection
│── models/
│   ├── student.py         # Student Model & Werkzeug Hashing
│   ├── professor.py       # Professor Model & Hashing
│   ├── subject.py         # Subject Model
│   ├── classroom.py       # Classroom Model
│   ├── timetable.py       # Timetable Model & Clash Detection
│   └── notification.py    # Notification Model
│── routes/
│   ├── auth.py            # Login, Registration & Logout
│   ├── student.py         # Student Dashboard & Profile
│   ├── professor.py       # Professor Dashboard & Profile
│   ├── admin.py           # Admin Dashboard & CRUD Operations
│   ├── timetable.py       # Timetable CRUD & PDF Export
│   └── notification.py    # Notification Management
│── utils/
│   ├── pdf_generator.py   # ReportLab PDF Generator Engine
│   └── seed_data.py       # MongoDB Initial Sample Seeder
│── templates/             # Jinja2 HTML Templates (Bootstrap 5)
└── static/                # Custom CSS and JavaScript
```

---

## 🚀 Step-by-Step Local Setup & Execution

### 1. Clone & Navigate to Project
```bash
git clone https://github.com/your-username/SSEC-Timetable-System.git
cd SSEC-Timetable-System
```

### 2. Create Virtual Environment & Install Dependencies
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure MongoDB Atlas Connection (`.env`)
Create or edit your `.env` file:
```env
SECRET_KEY=ssec_it_secret_key_2026_super_secure
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/ssec_timetable_db?retryWrites=true&w=majority
MONGO_DB_NAME=ssec_timetable_db
ADMIN_USERNAME=SSEC.IT.ADMIN
ADMIN_PASSWORD=Admin@ssecit
```

### 4. Run the Flask Server
```bash
python3 app.py
```
Open your browser at `http://localhost:3000`.

---

## 🔑 Default Credentials for Quick Testing

- **Admin Login**:
  - Username: `SSEC.IT.ADMIN`
  - Password: `Admin@ssecit`

- **Student Login**:
  - Enrollment Number: `200010116001`
  - Password: `Student@123`

- **Professor Login**:
  - Professor ID: `PROF_IT_01`
  - Password: `Prof@123`
