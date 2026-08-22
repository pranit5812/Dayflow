from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.payroll import PayrollSlipOut, PayrollGenerateRequest
from app.models.employee import SalaryStructure
from app.services.payroll_service import (
    generate_payroll_for_employee, generate_bulk_payroll, finalize_payroll_slip,
    get_employee_payroll_history, get_all_payroll_slips
)
from app.services.employee_service import update_employee_admin, get_employee_profile
from app.core.deps import require_employee, require_admin

router = APIRouter(prefix="/api/payroll", tags=["Payroll"])

@router.get("/me", response_model=List[PayrollSlipOut])
async def get_my_payroll_history(current_user: dict = Depends(require_employee)):
    return await get_employee_payroll_history(current_user["employee_id"])

@router.put("/{employee_id}/salary-structure")
async def update_salary_structure(
    employee_id: str,
    salary_data: SalaryStructure,
    current_user: dict = Depends(require_admin)
):
    from app.models.employee import EmployeeAdminUpdate
    update_obj = EmployeeAdminUpdate(salary_structure=salary_data)
    return await update_employee_admin(employee_id, update_obj)

@router.post("/generate")
async def generate_payroll(
    req: PayrollGenerateRequest,
    current_user: dict = Depends(require_admin)
):
    working_days = req.total_working_days or 22
    if req.employee_id:
        return await generate_payroll_for_employee(req.employee_id, req.month, current_user["employee_id"], working_days)
    else:
        return await generate_bulk_payroll(req.month, current_user["employee_id"], working_days)

@router.post("/{slip_id}/finalize", response_model=PayrollSlipOut)
async def finalize_slip(
    slip_id: str,
    current_user: dict = Depends(require_admin)
):
    return await finalize_payroll_slip(slip_id, current_user["employee_id"])

@router.get("", response_model=List[PayrollSlipOut])
async def list_payroll(
    month: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(require_admin)
):
    return await get_all_payroll_slips(month, status_filter)
