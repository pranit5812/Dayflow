from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.employee import EmployeeOut, EmployeeSelfUpdate, EmployeeAdminUpdate, SalaryStructure
from app.services.employee_service import (
    get_employee_profile, get_all_employees, update_employee_self, update_employee_admin, add_employee_document
)
from app.core.deps import get_current_user, require_admin, require_employee

router = APIRouter(prefix="/api/employees", tags=["Employees"])

@router.get("/me", response_model=EmployeeOut)
async def get_my_profile(current_user: dict = Depends(require_employee)):
    return await get_employee_profile(current_user["employee_id"])

@router.put("/me", response_model=EmployeeOut)
async def update_my_profile(
    update_data: EmployeeSelfUpdate,
    current_user: dict = Depends(require_employee)
):
    return await update_employee_self(current_user["employee_id"], update_data)

@router.get("", response_model=List[EmployeeOut])
async def list_employees(
    department: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: dict = Depends(require_admin)
):
    return await get_all_employees(department, is_active)

@router.get("/{id}", response_model=EmployeeOut)
async def get_employee_by_id(
    id: str,
    current_user: dict = Depends(require_admin)
):
    return await get_employee_profile(id)

@router.put("/{id}", response_model=EmployeeOut)
async def update_employee_by_admin(
    id: str,
    update_data: EmployeeAdminUpdate,
    current_user: dict = Depends(require_admin)
):
    return await update_employee_admin(id, update_data)

@router.post("/{id}/documents", response_model=EmployeeOut)
async def upload_document(
    id: str,
    doc_name: str,
    doc_url: str,
    current_user: dict = Depends(require_employee)
):
    # Employees can upload to own profile, Admin to any
    if current_user["role"] != "admin" and current_user["employee_id"] != id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this profile.")
    return await add_employee_document(id, doc_name, doc_url)
