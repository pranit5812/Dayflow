from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.leave import LeaveApply, LeaveReview, LeaveOut, LeaveBalanceOut
from app.services.leave_service import (
    apply_leave, review_leave, get_employee_leaves, get_all_leaves, get_leave_balance
)
from app.core.deps import require_employee, require_admin

router = APIRouter(prefix="/api/leave", tags=["Leave & Time-Off"])

@router.post("/apply", response_model=LeaveOut, status_code=status.HTTP_201_CREATED)
async def submit_leave(
    leave_data: LeaveApply,
    current_user: dict = Depends(require_employee)
):
    return await apply_leave(current_user["employee_id"], leave_data)

@router.get("/me", response_model=List[LeaveOut])
async def get_my_leaves(current_user: dict = Depends(require_employee)):
    return await get_employee_leaves(current_user["employee_id"])

@router.get("/balance/me", response_model=LeaveBalanceOut)
async def get_my_balance(current_user: dict = Depends(require_employee)):
    return await get_leave_balance(current_user["employee_id"])

@router.get("/balance/{employee_id}", response_model=LeaveBalanceOut)
async def get_employee_balance(
    employee_id: str,
    current_user: dict = Depends(require_admin)
):
    return await get_leave_balance(employee_id)

@router.get("", response_model=List[LeaveOut])
async def list_all_leaves(
    status_filter: Optional[str] = None,
    employee_id: Optional[str] = None,
    current_user: dict = Depends(require_admin)
):
    return await get_all_leaves(status_filter, employee_id)

@router.post("/{id}/review", response_model=LeaveOut)
async def review_leave_request(
    id: str,
    review: LeaveReview,
    current_user: dict = Depends(require_admin)
):
    return await review_leave(id, current_user["employee_id"], review)
