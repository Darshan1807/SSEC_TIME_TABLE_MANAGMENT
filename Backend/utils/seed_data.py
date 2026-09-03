from werkzeug.security import generate_password_hash

def seed_database(db):
    """Populates MongoDB Atlas with initial sample data for SSEC IT Department."""
    print("Seeding SSEC IT Timetable MongoDB database...")
    
    # 1. Admin
    if db.admins.count_documents({}) == 0:
        db.admins.insert_one({
            "username": "SSEC.IT.ADMIN",
            "password": generate_password_hash("Admin@ssecit"),
            "role": "admin"
        })
    
    # 2. Students
    if db.students.count_documents({}) == 0:
        db.students.insert_many([
            {
                "full_name": "Rohan Sharma",
                "enrollment_no": "200010116001",
                "password": generate_password_hash("Student@123"),
                "semester": 6,
                "classroom": "IT-LH-101",
                "email": "rohan.sharma@ssec.ac.in",
                "phone": "+91 9876543210",
                "role": "student"
            },
            {
                "full_name": "Priya Patel",
                "enrollment_no": "200010116002",
                "password": generate_password_hash("Student@123"),
                "semester": 4,
                "classroom": "IT-LH-102",
                "email": "priya.patel@ssec.ac.in",
                "phone": "+91 9876543211",
                "role": "student"
            }
        ])

    # 3. Professors
    if db.professors.count_documents({}) == 0:
        db.professors.insert_many([
            {
                "full_name": "Dr. A. K. Patel",
                "professor_id": "PROF_IT_01",
                "password": generate_password_hash("Prof@123"),
                "department": "Information Technology",
                "designation": "Head of Department (HOD)",
                "email": "akpatel@ssec.ac.in",
                "phone": "+91 9825012345",
                "role": "professor"
            },
            {
                "full_name": "Prof. R. M. Shah",
                "professor_id": "PROF_IT_02",
                "password": generate_password_hash("Prof@123"),
                "department": "Information Technology",
                "designation": "Assistant Professor",
                "email": "rmshah@ssec.ac.in",
                "phone": "+91 9825054321",
                "role": "professor"
            }
        ])

    # 4. Subjects
    if db.subjects.count_documents({}) == 0:
        db.subjects.insert_many([
            {"code": "3160704", "name": "Data Mining & Business Intelligence", "semester": 6, "credits": 4, "type": "Theory"},
            {"code": "3160707", "name": "Advanced Java Programming", "semester": 6, "credits": 4, "type": "Practical"},
            {"code": "3160712", "name": "Cloud Computing", "semester": 6, "credits": 3, "type": "Theory"},
            {"code": "3140705", "name": "Object Oriented Programming (OOP)", "semester": 4, "credits": 4, "type": "Theory"},
            {"code": "3140708", "name": "Database Management Systems (DBMS)", "semester": 4, "credits": 4, "type": "Theory"}
        ])

    # 5. Classrooms
    if db.classrooms.count_documents({}) == 0:
        db.classrooms.insert_many([
            {"room_number": "IT-LH-101", "building": "IT Block", "capacity": 70, "type": "Lecture Hall", "status": "Available"},
            {"room_number": "IT-LH-102", "building": "IT Block", "capacity": 70, "type": "Lecture Hall", "status": "Available"},
            {"room_number": "IT-Lab-1", "building": "IT Block", "capacity": 35, "type": "Computer Lab", "status": "Available"},
            {"room_number": "IT-Lab-2", "building": "IT Block", "capacity": 35, "type": "Computer Lab", "status": "Available"}
        ])

    # 6. Timetables
    if db.timetables.count_documents({}) == 0:
        db.timetables.insert_many([
            {
                "semester": 6,
                "classroom": "IT-LH-101",
                "day": "Monday",
                "time_slot": "09:00 AM - 10:00 AM",
                "subject": "Data Mining & BI",
                "professor": "Dr. A. K. Patel",
                "room_number": "IT-LH-101",
                "academic_year": "2025-2026"
            },
            {
                "semester": 6,
                "classroom": "IT-LH-101",
                "day": "Monday",
                "time_slot": "10:00 AM - 11:00 AM",
                "subject": "Cloud Computing",
                "professor": "Prof. R. M. Shah",
                "room_number": "IT-LH-101",
                "academic_year": "2025-2026"
            },
            {
                "semester": 6,
                "classroom": "IT-LH-101",
                "day": "Monday",
                "time_slot": "11:15 AM - 01:15 PM",
                "subject": "Advanced Java Lab",
                "professor": "Prof. R. M. Shah",
                "room_number": "IT-Lab-1",
                "academic_year": "2025-2026"
            },
            {
                "semester": 4,
                "classroom": "IT-LH-102",
                "day": "Monday",
                "time_slot": "09:00 AM - 10:00 AM",
                "subject": "DBMS",
                "professor": "Prof. R. M. Shah",
                "room_number": "IT-LH-102",
                "academic_year": "2025-2026"
            }
        ])

    # 7. Notifications
    if db.notifications.count_documents({}) == 0:
        db.notifications.insert_many([
            {
                "title": "Mid-Semester Examination Schedule Announced",
                "description": "Mid-sem examinations for Semester 4 and 6 IT students start from March 15, 2026.",
                "priority": "High",
                "publish_date": "2026-03-01",
                "status": "Active",
                "target_role": "All"
            },
            {
                "title": "Faculty Meeting on Academic Timetable",
                "description": "All IT department professors are requested to attend the department meeting in HOD Room at 3:00 PM.",
                "priority": "Medium",
                "publish_date": "2026-03-02",
                "status": "Active",
                "target_role": "Professor"
            }
        ])

    print("Database seeding completed!")
