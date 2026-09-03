from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from database.db import get_db

class ProfessorModel:
    @staticmethod
    def create_professor(
        name: str, 
        professor_id: str, 
        password: str = None, 
        password_hash: str = None,
        email: str = "", 
        department: str = "Information Technology", 
        designation: str = "Assistant Professor", 
        phone: str = ""
    ):
        """
        Creates a verified professor document in MongoDB.
        """
        db = get_db()
        clean_id = professor_id.strip()
        clean_email = email.strip().lower() if email else f"{clean_id.lower()}@ssec.ac.in"

        if db.professors.find_one({"professor_id": clean_id}):
            return None, "This Professor ID is already registered."
        if db.professors.find_one({"email": clean_email}):
            return None, "This email is already registered. Please login or use Forgot Password."

        final_hash = password_hash if password_hash else generate_password_hash(password)
        now_iso = datetime.utcnow().isoformat()

        prof_data = {
            "name": name.strip(),
            "full_name": name.strip(),
            "professor_id": clean_id,
            "email": clean_email,
            "password": final_hash,
            "role": "professor",
            "email_verified": True,
            "department": department,
            "designation": designation,
            "phone": phone or "+91 9825000000",
            "status": "Active",
            "created_at": now_iso
        }

        result = db.professors.insert_one(prof_data)
        prof_data["_id"] = str(result.inserted_id)
        return prof_data, "Professor account created successfully."

    @staticmethod
    def get_by_prof_id(professor_id: str):
        db = get_db()
        return db.professors.find_one({"professor_id": professor_id.strip()})

    @staticmethod
    def get_by_email(email: str):
        db = get_db()
        return db.professors.find_one({"email": email.strip().lower()})

    @staticmethod
    def verify_password(stored_hash: str, password: str) -> bool:
        if not stored_hash or not password:
            return False
        return check_password_hash(stored_hash, password)

    @staticmethod
    def update_password(email_or_prof_id: str, new_password: str) -> bool:
        db = get_db()
        clean = email_or_prof_id.strip()
        hashed = generate_password_hash(new_password)
        res = db.professors.update_one(
            {"$or": [{"email": clean.lower()}, {"professor_id": clean}]},
            {"$set": {"password": hashed, "updated_at": datetime.utcnow().isoformat()}}
        )
        return res.modified_count > 0

    @staticmethod
    def update_professor(professor_id: str, update_data: dict):
        db = get_db()
        if "password" in update_data and update_data["password"]:
            update_data["password"] = generate_password_hash(update_data["password"])
        db.professors.update_one({"professor_id": professor_id.strip()}, {"$set": update_data})
        return True
