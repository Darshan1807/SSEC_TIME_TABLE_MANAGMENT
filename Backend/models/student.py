from werkzeug.security import generate_password_hash, check_password_hash
from database.db import get_db

class StudentModel:
    @staticmethod
    def create_student(full_name, enrollment_no, password, semester=1, classroom="IT-LH-101", email="", phone=""):
        db = get_db()
        if db.students.find_one({"enrollment_no": enrollment_no}):
            return None, "Enrollment Number already registered!"
        
        from datetime import datetime
        hashed_password = generate_password_hash(password)
        student_data = {
            "full_name": full_name,
            "enrollment_no": enrollment_no,
            "password": hashed_password,
            "semester": int(semester),
            "classroom": classroom,
            "email": email or f"{enrollment_no.lower()}@ssec.ac.in",
            "phone": phone or "+91 9800000000",
            "role": "student",
            "status": "Active",
            "created_at": datetime.utcnow().isoformat(),
            "registered_at": datetime.utcnow().isoformat()
        }
        result = db.students.insert_one(student_data)
        student_data["_id"] = str(result.inserted_id)
        return student_data, "Student registered successfully!"

    @staticmethod
    def get_by_enrollment(enrollment_no):
        db = get_db()
        return db.students.find_one({"enrollment_no": enrollment_no})

    @staticmethod
    def verify_password(stored_hash, password):
        return check_password_hash(stored_hash, password)

    @staticmethod
    def update_student(enrollment_no, update_data):
        db = get_db()
        if "password" in update_data:
            update_data["password"] = generate_password_hash(update_data["password"])
        db.students.update_one({"enrollment_no": enrollment_no}, {"$set": update_data})
        return True
