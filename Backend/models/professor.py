from werkzeug.security import generate_password_hash, check_password_hash
from database.db import get_db

class ProfessorModel:
    @staticmethod
    def create_professor(full_name, professor_id, password, department="Information Technology", designation="Assistant Professor", email="", phone=""):
        db = get_db()
        if db.professors.find_one({"professor_id": professor_id}):
            return None, "Professor ID already registered!"
        
        from datetime import datetime
        hashed_password = generate_password_hash(password)
        prof_data = {
            "full_name": full_name,
            "professor_id": professor_id,
            "password": hashed_password,
            "department": department,
            "designation": designation,
            "email": email or f"{professor_id.lower()}@ssec.ac.in",
            "phone": phone or "+91 9825000000",
            "role": "professor",
            "status": "Active",
            "created_at": datetime.utcnow().isoformat(),
            "registered_at": datetime.utcnow().isoformat()
        }
        result = db.professors.insert_one(prof_data)
        prof_data["_id"] = str(result.inserted_id)
        return prof_data, "Professor registered successfully!"

    @staticmethod
    def get_by_prof_id(professor_id):
        db = get_db()
        return db.professors.find_one({"professor_id": professor_id})

    @staticmethod
    def verify_password(stored_hash, password):
        return check_password_hash(stored_hash, password)

    @staticmethod
    def update_professor(professor_id, update_data):
        db = get_db()
        if "password" in update_data:
            update_data["password"] = generate_password_hash(update_data["password"])
        db.professors.update_one({"professor_id": professor_id}, {"$set": update_data})
        return True
