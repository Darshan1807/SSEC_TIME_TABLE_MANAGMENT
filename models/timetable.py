from database.db import get_db
from bson.objectid import ObjectId

class TimetableModel:
    @staticmethod
    def get_all():
        db = get_db()
        return list(db.timetables.find())

    @staticmethod
    def get_by_semester_and_classroom(semester, classroom):
        db = get_db()
        return list(db.timetables.find({"semester": int(semester), "classroom": classroom}))

    @staticmethod
    def get_by_professor(professor_name_or_id):
        db = get_db()
        return list(db.timetables.find({
            "$or": [
                {"professor": professor_name_or_id},
                {"professor_id": professor_name_or_id}
            ]
        }))

    @staticmethod
    def create(semester, classroom, day, time_slot, subject, professor, room_number, academic_year="2025-2026"):
        db = get_db()
        
        # Check collision for room & time
        collision = db.timetables.find_one({
            "day": day,
            "time_slot": time_slot,
            "room_number": room_number
        })
        if collision:
            return None, f"Clash detected! Room {room_number} is occupied on {day} at {time_slot}"

        tt_data = {
            "semester": int(semester),
            "classroom": classroom,
            "day": day,
            "time_slot": time_slot,
            "subject": subject,
            "professor": professor,
            "room_number": room_number,
            "academic_year": academic_year
        }
        db.timetables.insert_one(tt_data)
        return tt_data, "Timetable slot added successfully!"

    @staticmethod
    def update(tt_id, update_data):
        db = get_db()
        db.timetables.update_one({"_id": ObjectId(tt_id)}, {"$set": update_data})
        return True

    @staticmethod
    def delete(tt_id):
        db = get_db()
        db.timetables.delete_one({"_id": ObjectId(tt_id)})
        return True
