from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from app.db.mongodb import get_database
from app.models.employee import EmployeeSelfUpdate, EmployeeAdminUpdate, DocumentItem
from app.services.activity_service import log_activity

async def get_employee_profile(employee_id: str) -> dict:
    db = get_database()
    employee = await db.employees.find_one({"employee_id": employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    user = await db.users.find_one({"employee_id": employee_id})
    if user:
        employee["email"] = user.get("email", "")
    
    employee["_id"] = str(employee["_id"])
    return employee

async def get_all_employees(department: Optional[str] = None, is_active: Optional[bool] = None) -> List[dict]:
    db = get_database()
    query = {}
    if department:
        query["job_details.department"] = department
    if is_active is not None:
        query["is_active"] = is_active
    
    cursor = db.employees.find(query).sort("created_at", -1)
    employees = await cursor.to_list(length=500)
    
    # Enrich with email
    users_cursor = db.users.find({})
    users_list = await users_cursor.to_list(length=500)
    email_map = {u["employee_id"]: u.get("email", "") for u in users_list}
    
    for emp in employees:
        emp["_id"] = str(emp["_id"])
        emp["email"] = email_map.get(emp["employee_id"], "")
        
    return employees

async def update_employee_self(employee_id: str, update_data: EmployeeSelfUpdate) -> dict:
    db = get_database()
    employee = await db.employees.find_one({"employee_id": employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    update_dict = {}
    if update_data.phone is not None:
        update_dict["personal_details.phone"] = update_data.phone
    if update_data.address is not None:
        update_dict["personal_details.address"] = update_data.address
    if update_data.profile_picture_url is not None:
        update_dict["personal_details.profile_picture_url"] = update_data.profile_picture_url
    
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc)
        await db.employees.update_one({"employee_id": employee_id}, {"$set": update_dict})
        await log_activity(employee_id, "profile_updated", "Updated profile contact details")
    
    return await get_employee_profile(employee_id)

async def update_employee_admin(employee_id: str, update_data: EmployeeAdminUpdate) -> dict:
    db = get_database()
    employee = await db.employees.find_one({"employee_id": employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    update_dict = {"updated_at": datetime.now(timezone.utc)}
    if update_data.personal_details is not None:
        update_dict["personal_details"] = update_data.personal_details.model_dump()
    if update_data.job_details is not None:
        update_dict["job_details"] = update_data.job_details.model_dump()
    if update_data.private_details is not None:
        update_dict["private_details"] = update_data.private_details.model_dump()
    if update_data.skills_certifications is not None:
        update_dict["skills_certifications"] = update_data.skills_certifications.model_dump()
    if update_data.salary_structure is not None:
        update_dict["salary_structure"] = update_data.salary_structure.model_dump()
    
    # Handle active status change (Rule #4: Cascading deactivation)
    if update_data.is_active is not None:
        update_dict["is_active"] = update_data.is_active
        await db.users.update_one(
            {"employee_id": employee_id},
            {"$set": {"is_active": update_data.is_active}}
        )
        action = "activated" if update_data.is_active else "deactivated"
        await log_activity(employee_id, "employee_status_changed", f"Employee account was {action} by Admin")
    
    await db.employees.update_one({"employee_id": employee_id}, {"$set": update_dict})
    await log_activity(employee_id, "profile_updated", "Employee profile modified by Admin")
    
    return await get_employee_profile(employee_id)

async def add_employee_document(employee_id: str, doc_name: str, doc_url: str) -> dict:
    db = get_database()
    doc_item = {
        "name": doc_name,
        "url": doc_url,
        "uploaded_at": datetime.now(timezone.utc)
    }
    await db.employees.update_one(
        {"employee_id": employee_id},
        {"$push": {"documents": doc_item}, "$set": {"updated_at": datetime.now(timezone.utc)}}
    )
    await log_activity(employee_id, "document_uploaded", f"Document '{doc_name}' uploaded")
    return await get_employee_profile(employee_id)
