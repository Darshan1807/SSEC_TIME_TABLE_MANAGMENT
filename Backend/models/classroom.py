from database.db import get_db
from bson.objectid import ObjectId

class ClassroomModel:
    @staticmethod
    def get_all():
        db = get_db()
        return list(db.classrooms.find())

    @staticmethod
    def create(room_number, building="IT Building", capacity=60, room_type="Lecture Hall", status="Available"):
        db = get_db()
        if db.classrooms.find_one({"room_number": room_number}):
            return None, "Room Number already exists!"
        room_data = {
            "room_number": room_number,
            "building": building,
            "capacity": int(capacity),
            "type": room_type,
            "status": status
        }
        db.classrooms.insert_one(room_data)
        return room_data, "Classroom created successfully!"

    @staticmethod
    def update(room_id, update_data):
        db = get_db()
        db.classrooms.update_one({"_id": ObjectId(room_id)}, {"$set": update_data})
        return True

    @staticmethod
    def delete(room_id):
        db = get_db()
        db.classrooms.delete_one({"_id": ObjectId(room_id)})
        return True
