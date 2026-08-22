from datetime import datetime
from enum import Enum
from typing import Optional, Dict
from pydantic import BaseModel, Field, ConfigDict
from app.models.employee import SalaryStructure

class PayrollStatus(str, Enum):
    DRAFT = "draft"
    FINALIZED = "finalized"

class AttendanceSummaryBreakdown(BaseModel):
    present: int = 0
    half_day: int = 0
    absent: int = 0
    paid_leave: int = 0
    unpaid_leave: int = 0
    total_working_days: int = 22

class DetailedSalaryBreakdown(BaseModel):
    basic: float
    hra: float
    allowances: float
    standard_deductions: float
    per_day_rate: float
    unpaid_leave_deduction: float
    gross_salary: float
    total_deductions: float
    net_salary: float

class PayrollGenerateRequest(BaseModel):
    employee_id: Optional[str] = None  # If null, run bulk generation for all active employees
    month: str  # YYYY-MM format, e.g. "2026-08"
    total_working_days: Optional[int] = 22

class PaydayUpdateRequest(BaseModel):
    scheduled_disbursement_date: str

class PayrollSlipOut(BaseModel):
    id: str
    employee_id: str
    employee_name: Optional[str] = ""
    department: Optional[str] = ""
    month: str
    attendance_summary: AttendanceSummaryBreakdown
    salary_breakdown: DetailedSalaryBreakdown
    gross_salary: float
    deductions: float
    net_salary: float
    scheduled_payday: Optional[str] = "10th of month"
    scheduled_disbursement_date: Optional[str] = ""
    generated_by: str
    generated_at: datetime
    status: PayrollStatus

    model_config = ConfigDict(from_attributes=True)
