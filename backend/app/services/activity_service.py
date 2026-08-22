from datetime import datetime, timezone
from app.db.mongodb import get_database

async def log_activity(employee_id: str, activity_type: str, message: str):
    db = get_database()
    if db is None:
        return
    
    employee = await db.employees.find_one({"employee_id": employee_id})
    emp_name = employee.get("personal_details", {}).get("full_name", employee_id) if employee else employee_id
    
    activity_doc = {
        "employee_id": employee_id,
        "employee_name": emp_name,
        "type": activity_type,
        "message": message,
        "created_at": datetime.now(timezone.utc)
    }
    await db.activity_feed.insert_one(activity_doc)

async def create_notification(employee_id: str, title: str, message: str, notif_type: str = "info"):
    db = get_database()
    if db is None:
        return
    
    notif_doc = {
        "employee_id": employee_id,
        "title": title,
        "message": message,
        "read": False,
        "type": notif_type,
        "created_at": datetime.now(timezone.utc)
    }
    await db.notifications.insert_one(notif_doc)
