import logging
from app.db.mongodb import get_database

logger = logging.getLogger("dayflow.indexes")

async def create_indexes():
    db = get_database()
    if db is None:
        return
    
    try:
        # Users collection
        await db.users.create_index("employee_id", unique=True)
        await db.users.create_index("email", unique=True)
        
        # Employees collection
        await db.employees.create_index("employee_id", unique=True)
        
        # Attendance collection: compound index on (employee_id, date)
        await db.attendance.create_index([("employee_id", 1), ("date", 1)], unique=True)
        await db.attendance.create_index("date")
        
        # Leave Requests collection
        await db.leave_requests.create_index("employee_id")
        await db.leave_requests.create_index("status")
        
        # Payroll Slips collection: compound index on (employee_id, month)
        await db.payroll_slips.create_index([("employee_id", 1), ("month", 1)], unique=True)
        
        # Activity Feed collection
        await db.activity_feed.create_index("employee_id")
        await db.activity_feed.create_index([("created_at", -1)])
        
        logger.info("MongoDB indexes verified and created successfully.")
    except Exception as e:
        logger.warning(f"Could not create indexes (might be mock DB or existing indexes): {e}")
