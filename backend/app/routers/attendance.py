from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.attendance import AttendanceOut, AttendanceManualUpdate
from app.services.attendance_service import (
    check_in, check_out, get_today_attendance, get_employee_attendance_history,
    get_org_attendance, manual_attendance_update
)
from app.core.deps import require_employee, require_admin

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

@router.post("/checkin")
async def user_check_in(current_user: dict = Depends(require_employee)):
    return await check_in(current_user["employee_id"])

@router.post("/checkout")
async def user_check_out(current_user: dict = Depends(require_employee)):
    return await check_out(current_user["employee_id"])

@router.get("/today")
async def today_status(current_user: dict = Depends(require_employee)):
    return await get_today_attendance(current_user["employee_id"])

@router.get("/me", response_model=List[AttendanceOut])
async def get_my_attendance(
    month: Optional[str] = None,
    current_user: dict = Depends(require_employee)
):
    return await get_employee_attendance_history(current_user["employee_id"], month)

@router.get("", response_model=List[AttendanceOut])
async def list_all_attendance(
    date: Optional[str] = None,
    month: Optional[str] = None,
    current_user: dict = Depends(require_admin)
):
    return await get_org_attendance(date, month)

@router.put("/manual", response_model=AttendanceOut)
async def admin_manual_update(
    update_data: AttendanceManualUpdate,
    current_user: dict = Depends(require_admin)
):
    return await manual_attendance_update(update_data)
