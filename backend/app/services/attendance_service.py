from datetime import datetime, date, timezone, timedelta
from typing import List, Optional
from fastapi import HTTPException, status
from app.db.mongodb import get_database
from app.models.attendance import AttendanceStatus, AttendanceSource, AttendanceManualUpdate
from app.services.activity_service import log_activity

async def check_in(employee_id: str) -> dict:
    db = get_database()
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    now = datetime.now(timezone.utc)
    
    existing = await db.attendance.find_one({"employee_id": employee_id, "date": today_str})
    if existing and existing.get("check_in"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already checked in for today."
        )
    
    attendance_doc = {
        "employee_id": employee_id,
        "date": today_str,
        "check_in": now,
        "check_out": None,
        "status": AttendanceStatus.PRESENT.value,
        "source": AttendanceSource.CHECK_IN.value,
        "work_hours": 0.0,
        "updated_at": now
    }
    
    if existing:
        await db.attendance.update_one(
            {"_id": existing["_id"]},
            {"$set": attendance_doc}
        )
    else:
        await db.attendance.insert_one(attendance_doc)
        
    await log_activity(employee_id, "attendance_marked", f"Checked in for {today_str}")
    return await get_today_attendance(employee_id)

async def check_out(employee_id: str) -> dict:
    db = get_database()
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    now = datetime.now(timezone.utc)
    
    existing = await db.attendance.find_one({"employee_id": employee_id, "date": today_str})
    if not existing or not existing.get("check_in"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must check in before checking out."
        )
    
    check_in_time = existing["check_in"]
    if isinstance(check_in_time, str):
        check_in_time = datetime.fromisoformat(check_in_time.replace("Z", "+00:00"))
        
    duration_seconds = (now - check_in_time).total_seconds()
    work_hours = round(duration_seconds / 3600.0, 2)
    
    # Calculate status based on work hours policy
    if work_hours >= 8.0:
        att_status = AttendanceStatus.PRESENT.value
    elif work_hours >= 4.0:
        att_status = AttendanceStatus.HALF_DAY.value
    else:
        att_status = AttendanceStatus.ABSENT.value
        
    await db.attendance.update_one(
        {"_id": existing["_id"]},
        {"$set": {
            "check_out": now,
            "work_hours": work_hours,
            "status": att_status,
            "updated_at": now
        }}
    )
    
    await log_activity(employee_id, "attendance_marked", f"Checked out for {today_str} ({work_hours} hrs)")
    return await get_today_attendance(employee_id)

async def get_today_attendance(employee_id: str) -> Optional[dict]:
    db = get_database()
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    record = await db.attendance.find_one({"employee_id": employee_id, "date": today_str})
    if record:
        record["_id"] = str(record["_id"])
    return record

async def get_employee_attendance_history(employee_id: str, month: Optional[str] = None) -> List[dict]:
    db = get_database()
    query = {"employee_id": employee_id}
    if month:
        # month is YYYY-MM
        query["date"] = {"$regex": f"^{month}"}
        
    cursor = db.attendance.find(query).sort("date", -1)
    records = await cursor.to_list(length=365)
    for r in records:
        r["_id"] = str(r["_id"])
    return records

async def get_org_attendance(date_str: Optional[str] = None, month: Optional[str] = None) -> List[dict]:
    db = get_database()
    query = {}
    if date_str:
        query["date"] = date_str
    elif month:
        query["date"] = {"$regex": f"^{month}"}
        
    cursor = db.attendance.find(query).sort("date", -1)
    records = await cursor.to_list(length=1000)
    for r in records:
        r["_id"] = str(r["_id"])
    return records

async def manual_attendance_update(update_data: AttendanceManualUpdate) -> dict:
    db = get_database()
    now = datetime.now(timezone.utc)
    
    existing = await db.attendance.find_one({
        "employee_id": update_data.employee_id,
        "date": update_data.date
    })
    
    att_doc = {
        "employee_id": update_data.employee_id,
        "date": update_data.date,
        "check_in": update_data.check_in,
        "check_out": update_data.check_out,
        "status": update_data.status.value,
        "source": AttendanceSource.ADMIN_MANUAL.value,
        "updated_at": now
    }
    
    if update_data.check_in and update_data.check_out:
        dur = (update_data.check_out - update_data.check_in).total_seconds()
        att_doc["work_hours"] = round(dur / 3600.0, 2)
    else:
        att_doc["work_hours"] = 8.0 if update_data.status == AttendanceStatus.PRESENT else (4.0 if update_data.status == AttendanceStatus.HALF_DAY else 0.0)

    if existing:
        await db.attendance.update_one({"_id": existing["_id"]}, {"$set": att_doc})
    else:
        await db.attendance.insert_one(att_doc)
        
    await log_activity(
        update_data.employee_id,
        "attendance_marked",
        f"Attendance for {update_data.date} manually set to {update_data.status.value} by Admin"
    )
    
    record = await db.attendance.find_one({"employee_id": update_data.employee_id, "date": update_data.date})
    record["_id"] = str(record["_id"])
    return record

# RULE #1: Leave -> Attendance Auto-Sync Engine
async def sync_leave_to_attendance(employee_id: str, start_date_str: str, end_date_str: str):
    """
    When Admin approves a LeaveRequest, auto-generate/update Attendance records
    for each date in the leave date range with status = "Leave" and source = "auto-leave-sync".
    """
    db = get_database()
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
    
    curr = start_date
    now = datetime.now(timezone.utc)
    
    while curr <= end_date:
        d_str = curr.strftime("%Y-%m-%d")
        
        # Upsert attendance record for date
        existing = await db.attendance.find_one({"employee_id": employee_id, "date": d_str})
        att_doc = {
            "employee_id": employee_id,
            "date": d_str,
            "status": AttendanceStatus.LEAVE.value,
            "source": AttendanceSource.AUTO_LEAVE_SYNC.value,
            "work_hours": 0.0,
            "updated_at": now
        }
        
        if existing:
            await db.attendance.update_one({"_id": existing["_id"]}, {"$set": att_doc})
        else:
            await db.attendance.insert_one(att_doc)
            
        curr += timedelta(days=1)
        
    await log_activity(employee_id, "attendance_synced", f"Attendance records auto-updated to Leave for range {start_date_str} to {end_date_str}")
