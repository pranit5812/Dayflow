from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from app.db.mongodb import get_database
from app.core.deps import require_employee, require_admin
from app.services.leave_service import get_leave_balance

router = APIRouter(prefix="/api/dashboard", tags=["Dashboards"])

@router.get("/employee")
async def get_employee_dashboard(current_user: dict = Depends(require_employee)):
    db = get_database()
    emp_id = current_user["employee_id"]
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # 1. Profile Summary
    profile = await db.employees.find_one({"employee_id": emp_id})
    if profile:
        profile["_id"] = str(profile["_id"])
        
    # 2. Today's Attendance
    today_att = await db.attendance.find_one({"employee_id": emp_id, "date": today_str})
    if today_att:
        today_att["_id"] = str(today_att["_id"])
        
    # 3. Leave Balance
    leave_balance = await get_leave_balance(emp_id)
    
    # 4. Recent Pending Leaves
    pending_leaves = await db.leave_requests.find({"employee_id": emp_id, "status": "Pending"}).to_list(10)
    for p in pending_leaves:
        p["_id"] = str(p["_id"])
        
    # 5. Recent Activity Feed
    activity = await db.activity_feed.find({"employee_id": emp_id}).sort("created_at", -1).to_list(15)
    for a in activity:
        a["_id"] = str(a["_id"])
        
    # 6. Notifications
    notifs = await db.notifications.find({"employee_id": emp_id, "read": False}).sort("created_at", -1).to_list(10)
    for n in notifs:
        n["_id"] = str(n["_id"])

    return {
        "profile": profile,
        "today_attendance": today_att,
        "leave_balance": leave_balance,
        "pending_leaves": pending_leaves,
        "activity_feed": activity,
        "notifications": notifs
    }

@router.get("/admin")
async def get_admin_dashboard(current_user: dict = Depends(require_admin)):
    db = get_database()
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    
    # 1. Employee Count Metrics
    total_employees = await db.employees.count_documents({})
    active_employees = await db.employees.count_documents({"is_active": True})
    
    # 2. Today's Attendance Metrics
    today_records = await db.attendance.find({"date": today_str}).to_list(1000)
    present_today = sum(1 for r in today_records if r.get("status") in ["Present", "Half-day"])
    attendance_percentage = round((present_today / max(1, active_employees)) * 100, 1)
    
    # 3. Pending Leave Approvals
    pending_leave_count = await db.leave_requests.count_documents({"status": "Pending"})
    
    # 4. Recent Org-wide Activity Feed
    activity = await db.activity_feed.find({}).sort("created_at", -1).to_list(20)
    for a in activity:
        a["_id"] = str(a["_id"])
        
    # 5. Recent Pending Leave Requests
    pending_requests = await db.leave_requests.find({"status": "Pending"}).sort("created_at", -1).to_list(10)
    for pr in pending_requests:
        pr["_id"] = str(pr["_id"])
        
    # 6. Department Distribution Aggregation
    dept_pipeline = [
        {"$group": {"_id": "$job_details.department", "count": {"$sum": 1}}}
    ]
    dept_cursor = db.employees.aggregate(dept_pipeline)
    dept_counts = await dept_cursor.to_list(50)

    return {
        "metrics": {
            "total_employees": total_employees,
            "active_employees": active_employees,
            "present_today": present_today,
            "attendance_percentage": attendance_percentage,
            "pending_leave_count": pending_leave_count
        },
        "department_distribution": dept_counts,
        "pending_requests": pending_requests,
        "recent_activity": activity
    }
