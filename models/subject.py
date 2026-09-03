from database.db import get_db
from bson.objectid import ObjectId

class SubjectModel:
    @staticmethod
    def get_all():
        db = get_db()
        return list(db.subjects.find())

    @staticmethod
    def create(code, name, semester, credits=3, subject_type="Theory"):
        db = get_db()
        if db.subjects.find_one({"code": code}):
            return None, "Subject Code already exists!"
        sub_data = {
            "code": code,
            "name": name,
            "semester": int(semester),
            "credits": int(credits),
            "type": subject_type
        }
        db.subjects.insert_one(sub_data)
        return sub_data, "Subject created successfully!"

    @staticmethod
    def update(subject_id, update_data):
        db = get_db()
        db.subjects.update_one({"_id": ObjectId(subject_id)}, {"$set": update_data})
        return True

    @staticmethod
    def delete(subject_id):
        db = get_db()
        db.subjects.delete_one({"_id": ObjectId(subject_id)})
        return True
