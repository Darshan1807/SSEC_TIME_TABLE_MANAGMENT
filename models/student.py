from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from database.db import get_db

class StudentModel:
    @staticmethod
    def create_student(
        name: str, 
        enrollment_no: str, 
        password: str = None, 
        password_hash: str = None,
        email: str = "", 
        semester: int = 6, 
        classroom: str = "IT-LH-101", 
        phone: str = ""
    ):
        """
        Creates a verified student document in MongoDB.
        """
        db = get_db()
        clean_enroll = enrollment_no.strip()
        clean_email = email.strip().lower() if email else f"{clean_enroll.lower()}@ssec.ac.in"

        if db.students.find_one({"enrollment_no": clean_enroll}):
            return None, "This Enrollment Number is already registered."
        if db.students.find_one({"email": clean_email}):
            return None, "This email is already registered. Please login or use Forgot Password."

        final_hash = password_hash if password_hash else generate_password_hash(password)
        now_iso = datetime.utcnow().isoformat()

        student_data = {
            "name": name.strip(),
            "full_name": name.strip(),
            "enrollment_no": clean_enroll,
            "email": clean_email,
            "password": final_hash,
            "role": "student",
            "email_verified": True,
            "semester": int(semester),
            "classroom": classroom,
            "phone": phone or "+91 9800000000",
            "status": "Active",
            "created_at": now_iso
        }

        result = db.students.insert_one(student_data)
        student_data["_id"] = str(result.inserted_id)
        return student_data, "Student account created successfully."

    @staticmethod
    def get_by_enrollment(enrollment_no: str):
        db = get_db()
        return db.students.find_one({"enrollment_no": enrollment_no.strip()})

    @staticmethod
    def get_by_email(email: str):
        db = get_db()
        return db.students.find_one({"email": email.strip().lower()})

    @staticmethod
    def verify_password(stored_hash: str, password: str) -> bool:
        if not stored_hash or not password:
            return False
        return check_password_hash(stored_hash, password)

    @staticmethod
    def update_password(email_or_enrollment: str, new_password: str) -> bool:
        db = get_db()
        clean = email_or_enrollment.strip()
        hashed = generate_password_hash(new_password)
        res = db.students.update_one(
            {"$or": [{"email": clean.lower()}, {"enrollment_no": clean}]},
            {"$set": {"password": hashed, "updated_at": datetime.utcnow().isoformat()}}
        )
        return res.modified_count > 0

    @staticmethod
    def update_student(enrollment_no: str, update_data: dict):
        db = get_db()
        if "password" in update_data and update_data["password"]:
            update_data["password"] = generate_password_hash(update_data["password"])
        db.students.update_one({"enrollment_no": enrollment_no.strip()}, {"$set": update_data})
        return True
