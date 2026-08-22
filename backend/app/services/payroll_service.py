from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.db.mongodb import get_database
from app.models.payroll import PayrollStatus, PayrollGenerateRequest
from app.models.attendance import AttendanceStatus
from app.models.leave import LeaveType
from app.services.activity_service import log_activity, create_notification

async def generate_payroll_for_employee(employee_id: str, month: str, generated_by_admin: str, total_working_days: int = 22) -> dict:
    """
    Core Rule #2 & #3 Implementation:
    Reads month's Attendance records for employee and calculates salary deductions for unpaid leave.
    Generates or updates a draft PayrollSlip snapshot.
    """
    db = get_database()
    
    # 1. Fetch Employee and salary structure (Rule #6: Master record)
    employee = await db.employees.find_one({"employee_id": employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found.")
        
    if not employee.get("is_active", True):
        # Exclude deactivated employee from active payroll run (Rule #4)
        raise HTTPException(status_code=400, detail=f"Employee {employee_id} is deactivated and excluded from payroll.")
        
    sal_struct = employee.get("salary_structure", {})
    basic = float(sal_struct.get("basic", 50000.0))
    hra = float(sal_struct.get("hra", 20000.0))
    allowances = float(sal_struct.get("allowances", 10000.0))
    standard_deductions = float(sal_struct.get("deductions", 5000.0))
    
    # Check if finalized slip already exists for this (employee_id, month)
    existing_slip = await db.payroll_slips.find_one({"employee_id": employee_id, "month": month})
    if existing_slip and existing_slip.get("status") == PayrollStatus.FINALIZED.value:
        raise HTTPException(
            status_code=400,
            detail=f"Payroll slip for {employee_id} for month {month} is FINALIZED and cannot be regenerated."
        )
        
    # 2. Query Attendance records for month
    att_cursor = db.attendance.find({
        "employee_id": employee_id,
        "date": {"$regex": f"^{month}"}
    })
    att_records = await att_cursor.to_list(length=31)
    
    present_cnt = 0
    half_day_cnt = 0
    absent_cnt = 0
    paid_leave_cnt = 0
    unpaid_leave_cnt = 0
    
    # Query approved leave requests to distinguish leave types
    leaves_cursor = db.leave_requests.find({
        "employee_id": employee_id,
        "status": "Approved",
        "start_date": {"$regex": f"^{month}"}
    })
    approved_leaves = await leaves_cursor.to_list(length=50)
    leave_type_by_date = {}
    
    for l in approved_leaves:
        s_date = datetime.strptime(l["start_date"], "%Y-%m-%d").date()
        e_date = datetime.strptime(l["end_date"], "%Y-%m-%d").date()
        curr = s_date
        from datetime import timedelta
        while curr <= e_date:
            leave_type_by_date[curr.strftime("%Y-%m-%d")] = l["leave_type"]
            curr += timedelta(days=1)
            
    for rec in att_records:
        st = rec.get("status")
        d_str = rec.get("date")
        if st == AttendanceStatus.PRESENT.value:
            present_cnt += 1
        elif st == AttendanceStatus.HALF_DAY.value:
            half_day_cnt += 1
        elif st == AttendanceStatus.ABSENT.value:
            absent_cnt += 1
        elif st == AttendanceStatus.LEAVE.value:
            l_type = leave_type_by_date.get(d_str, LeaveType.PAID.value)
            if l_type == LeaveType.UNPAID.value:
                unpaid_leave_cnt += 1
            else:
                paid_leave_cnt += 1
                
    # 3. Deduction Math Engine
    per_day_rate = round(basic / float(total_working_days), 2)
    unpaid_leave_deduction = round(unpaid_leave_cnt * per_day_rate, 2)
    
    gross_salary = round(basic + hra + allowances, 2)
    total_deductions = round(standard_deductions + unpaid_leave_deduction, 2)
    net_salary = max(0.0, round(gross_salary - total_deductions, 2))
    
    emp_name = employee.get("personal_details", {}).get("full_name", employee_id)
    dept = employee.get("job_details", {}).get("department", "Engineering")
    desig = employee.get("job_details", {}).get("designation", "")
    emp_role = employee.get("role", "employee")

    # Role & Designation Constant Payday Schedule Matrix
    role_l = emp_role.lower()
    desig_l = desig.lower()
    if any(k in desig_l or k in role_l for k in ["hod", "admin", "director", "head", "executive"]):
        payday_label = "1st of month"
        day_num = 1
    elif any(k in desig_l or k in role_l for k in ["manager", "lead", "supervisor"]):
        payday_label = "5th of month"
        day_num = 5
    elif any(k in desig_l for k in ["intern", "trainee", "apprentice"]):
        payday_label = "15th of month"
        day_num = 15
    else:
        payday_label = "10th of month"
        day_num = 10

    try:
        y_str, m_str = month.split("-")
        from datetime import date
        disb_date = date(int(y_str), int(m_str), day_num).strftime("%d/%m/%Y")
    except Exception:
        disb_date = f"{String(day_num).zfill(2)}/{m_str}/2026"
    
    slip_doc = {
        "employee_id": employee_id,
        "employee_name": emp_name,
        "department": dept,
        "month": month,
        "scheduled_payday": payday_label,
        "scheduled_disbursement_date": disb_date,
        "attendance_summary": {
            "present": present_cnt,
            "half_day": half_day_cnt,
            "absent": absent_cnt,
            "paid_leave": paid_leave_cnt,
            "unpaid_leave": unpaid_leave_cnt,
            "total_working_days": total_working_days
        },
        "salary_breakdown": {
            "basic": basic,
            "hra": hra,
            "allowances": allowances,
            "standard_deductions": standard_deductions,
            "per_day_rate": per_day_rate,
            "unpaid_leave_deduction": unpaid_leave_deduction,
            "gross_salary": gross_salary,
            "total_deductions": total_deductions,
            "net_salary": net_salary
        },
        "gross_salary": gross_salary,
        "deductions": total_deductions,
        "net_salary": net_salary,
        "generated_by": generated_by_admin,
        "generated_at": datetime.now(timezone.utc),
        "status": PayrollStatus.DRAFT.value
    }
    
    if existing_slip:
        await db.payroll_slips.update_one({"_id": existing_slip["_id"]}, {"$set": slip_doc})
        res_id = str(existing_slip["_id"])
    else:
        ins = await db.payroll_slips.insert_one(slip_doc)
        res_id = str(ins.inserted_id)
        
    await log_activity(employee_id, "payroll_generated", f"Generated draft payroll slip for {month} (Net: ₹{net_salary})")
    
    slip_doc["id"] = res_id
    slip_doc["_id"] = res_id
    return slip_doc

async def generate_bulk_payroll(month: str, generated_by_admin: str, total_working_days: int = 22) -> List[dict]:
    db = get_database()
    active_employees = await db.employees.find({"is_active": True}).to_list(500)
    slips = []
    for emp in active_employees:
        try:
            slip = await generate_payroll_for_employee(emp["employee_id"], month, generated_by_admin, total_working_days)
            slips.append(slip)
        except Exception as e:
            continue
    return slips

async def finalize_payroll_slip(slip_id: str, admin_employee_id: str) -> dict:
    db = get_database()
    try:
        obj_id = ObjectId(slip_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payroll slip ID.")
        
    slip = await db.payroll_slips.find_one({"_id": obj_id})
    if not slip:
        raise HTTPException(status_code=404, detail="Payroll slip not found.")
        
    await db.payroll_slips.update_one(
        {"_id": obj_id},
        {"$set": {"status": PayrollStatus.FINALIZED.value, "updated_at": datetime.now(timezone.utc)}}
    )
    
    await log_activity(slip["employee_id"], "payroll_finalized", f"Payroll slip for {slip['month']} was FINALIZED")
    await create_notification(slip["employee_id"], "Salary Slip Available", f"Your payslip for {slip['month']} has been published.", "payroll")
    
    updated = await db.payroll_slips.find_one({"_id": obj_id})
    updated["id"] = str(updated["_id"])
    updated["_id"] = str(updated["_id"])
    return updated

async def get_employee_payroll_history(employee_id: str) -> List[dict]:
    db = get_database()
    cursor = db.payroll_slips.find({"employee_id": employee_id}).sort("month", -1)
    slips = await cursor.to_list(length=120)
    for s in slips:
        s["id"] = str(s["_id"])
        s["_id"] = str(s["_id"])
    return slips

async def get_all_payroll_slips(month: Optional[str] = None, status_filter: Optional[str] = None) -> List[dict]:
    db = get_database()
    query = {}
    if month:
        query["month"] = month
    if status_filter:
        query["status"] = status_filter
        
    cursor = db.payroll_slips.find(query).sort("month", -1)
    slips = await cursor.to_list(length=500)
    for s in slips:
        s["id"] = str(s["_id"])
        s["_id"] = str(s["_id"])
    return slips

async def update_payroll_payday(slip_id: str, scheduled_disbursement_date: str, admin_employee_id: str) -> dict:
    db = get_database()
    try:
        obj_id = ObjectId(slip_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payroll slip ID.")
        
    slip = await db.payroll_slips.find_one({"_id": obj_id})
    if not slip:
        raise HTTPException(status_code=404, detail="Payroll slip not found.")
        
    await db.payroll_slips.update_one(
        {"_id": obj_id},
        {"$set": {
            "scheduled_disbursement_date": scheduled_disbursement_date,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    await log_activity(slip["employee_id"], "payroll_payday_updated", f"HR updated payday date for {slip['month']} to {scheduled_disbursement_date}")
    
    updated = await db.payroll_slips.find_one({"_id": obj_id})
    updated["id"] = str(updated["_id"])
    updated["_id"] = str(updated["_id"])
    return updated
