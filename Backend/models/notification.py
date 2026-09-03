from database.db import get_db
from bson.objectid import ObjectId
from datetime import datetime

class NotificationModel:
    @staticmethod
    def get_all():
        db = get_db()
        return list(db.notifications.find().sort("publish_date", -1))

    @staticmethod
    def get_active(target_role="All"):
        db = get_db()
        return list(db.notifications.find({
            "status": "Active",
            "target_role": {"$in": ["All", target_role]}
        }).sort("publish_date", -1))

    @staticmethod
    def create(title, description, priority="Medium", publish_date=None, status="Active", target_role="All"):
        db = get_db()
        if not publish_date:
            publish_date = datetime.now().strftime("%Y-%m-%d")
        
        notif_data = {
            "title": title,
            "description": description,
            "priority": priority, # High, Medium, Low
            "publish_date": publish_date,
            "status": status,
            "target_role": target_role
        }
        db.notifications.insert_one(notif_data)
        return notif_data, "Notification published successfully!"

    @staticmethod
    def delete(notif_id):
        db = get_db()
        db.notifications.delete_one({"_id": ObjectId(notif_id)})
        return True
