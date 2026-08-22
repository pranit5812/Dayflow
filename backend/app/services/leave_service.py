from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.db.mongodb import get_database
from app.models.leave import LeaveApply, LeaveReview, LeaveStatus, LeaveType, LeaveBalanceOut
from app.services.attendance_service import sync_leave_to_attendance
from app.services.activity_service import log_activity, create_notification

async def apply_leave(employee_id: str, leave_data: LeaveApply) -> dict:
    db = get_database()
    
    # Verify employee active status (Rule #4)
    emp = await db.employees.find_one({"employee_id": employee_id})
    if not emp or not emp.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Deactivated employees cannot submit leave requests."
        )
        
    start_d = datetime.strptime(leave_data.start_date, "%Y-%m-%d")
    end_d = datetime.strptime(leave_data.end_date, "%Y-%m-%d")
    
    if end_d < start_d:
        raise HTTPException(status_code=400, detail="End date cannot be prior to start date.")
        
    days_count = (end_d - start_d).days + 1
    
    leave_doc = {
        "employee_id": employee_id,
        "employee_name": emp.get("personal_details", {}).get("full_name", employee_id),
        "leave_type": leave_data.leave_type.value,
        "start_date": leave_data.start_date,
        "end_date": leave_data.end_date,
        "days_count": days_count,
        "remarks": leave_data.remarks or "",
        "status": LeaveStatus.PENDING.value,
        "reviewed_by": None,
        "admin_comments": "",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    res = await db.leave_requests.insert_one(leave_doc)
    leave_doc["id"] = str(res.inserted_id)
    leave_doc["_id"] = str(res.inserted_id)
    
    await log_activity(employee_id, "leave_applied", f"Applied for {days_count} day(s) of {leave_data.leave_type.value} leave ({leave_data.start_date} to {leave_data.end_date})")
    
    # Notify admins
    admins = await db.users.find({"role": "admin"}).to_list(100)
    for admin in admins:
        await create_notification(admin["employee_id"], "New Leave Request", f"{emp.get('personal_details', {}).get('full_name')} applied for leave.", "leave")
        
    return leave_doc

async def review_leave(leave_id: str, admin_employee_id: str, review: LeaveReview) -> dict:
    db = get_database()
    
    try:
        obj_id = ObjectId(leave_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid leave request ID format.")
        
    leave = await db.leave_requests.find_one({"_id": obj_id})
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found.")
        
    new_status = review.status.value
    now = datetime.now(timezone.utc)
    
    update_data = {
        "status": new_status,
        "reviewed_by": admin_employee_id,
        "admin_comments": review.admin_comments or "",
        "updated_at": now
    }
    
    await db.leave_requests.update_one({"_id": obj_id}, {"$set": update_data})
    
    # RULE #1: On Approval -> Trigger Leave to Attendance Sync
    if new_status == LeaveStatus.APPROVED.value:
        await sync_leave_to_attendance(leave["employee_id"], leave["start_date"], leave["end_date"])
        await log_activity(leave["employee_id"], "leave_approved", f"Leave request for {leave['start_date']} to {leave['end_date']} was APPROVED")
        await create_notification(leave["employee_id"], "Leave Approved", f"Your leave request ({leave['start_date']} to {leave['end_date']}) has been approved.", "leave_approved")
    else:
        await log_activity(leave["employee_id"], "leave_rejected", f"Leave request for {leave['start_date']} to {leave['end_date']} was REJECTED")
        await create_notification(leave["employee_id"], "Leave Rejected", f"Your leave request ({leave['start_date']} to {leave['end_date']}) was rejected. Reason: {review.admin_comments}", "leave_rejected")
        
    updated = await db.leave_requests.find_one({"_id": obj_id})
    updated["id"] = str(updated["_id"])
    updated["_id"] = str(updated["_id"])
    return updated

async def get_employee_leaves(employee_id: str) -> List[dict]:
    db = get_database()
    cursor = db.leave_requests.find({"employee_id": employee_id}).sort("created_at", -1)
    requests = await cursor.to_list(length=200)
    for r in requests:
        r["id"] = str(r["_id"])
        r["_id"] = str(r["_id"])
    return requests

async def get_all_leaves(status_filter: Optional[str] = None, employee_id: Optional[str] = None) -> List[dict]:
    db = get_database()
    query = {}
    if status_filter:
        query["status"] = status_filter
    if employee_id:
        query["employee_id"] = employee_id
        
    cursor = db.leave_requests.find(query).sort("created_at", -1)
    requests = await cursor.to_list(length=500)
    for r in requests:
        r["id"] = str(r["_id"])
        r["_id"] = str(r["_id"])
    return requests

async def get_leave_balance(employee_id: str) -> LeaveBalanceOut:
    db = get_database()
    
    # Sum approved leaves by type for current year
    current_year = datetime.now(timezone.utc).strftime("%Y")
    query = {
        "employee_id": employee_id,
        "status": LeaveStatus.APPROVED.value,
        "start_date": {"$regex": f"^{current_year}"}
    }
    
    approved_leaves = await db.leave_requests.find(query).to_list(500)
    
    paid_used = 0
    sick_used = 0
    unpaid_used = 0
    
    for l in approved_leaves:
        days = l.get("days_count", 1)
        l_type = l.get("leave_type")
        if l_type == LeaveType.PAID.value:
            paid_used += days
        elif l_type == LeaveType.SICK.value:
            sick_used += days
        elif l_type == LeaveType.UNPAID.value:
            unpaid_used += days
            
    paid_allotted = 15
    sick_allotted = 10
    
    return LeaveBalanceOut(
        employee_id=employee_id,
        paid_allotted=paid_allotted,
        paid_used=paid_used,
        paid_remaining=max(0, paid_allotted - paid_used),
        sick_allotted=sick_allotted,
        sick_used=sick_used,
        sick_remaining=max(0, sick_allotted - sick_used),
        unpaid_used=unpaid_used
    )
