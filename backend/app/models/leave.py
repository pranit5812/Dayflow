from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class LeaveType(str, Enum):
    PAID = "paid"
    SICK = "sick"
    UNPAID = "unpaid"

class LeaveStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"

class LeaveApply(BaseModel):
    leave_type: LeaveType
    start_date: str  # YYYY-MM-DD
    end_date: str    # YYYY-MM-DD
    remarks: Optional[str] = ""

class LeaveReview(BaseModel):
    status: LeaveStatus # Approved or Rejected
    admin_comments: Optional[str] = ""

class LeaveOut(BaseModel):
    id: str
    employee_id: str
    employee_name: Optional[str] = ""
    leave_type: LeaveType
    start_date: str
    end_date: str
    days_count: int
    remarks: str
    status: LeaveStatus
    reviewed_by: Optional[str] = None
    admin_comments: Optional[str] = ""
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LeaveBalanceOut(BaseModel):
    employee_id: str
    paid_allotted: int = 15
    paid_used: int = 0
    paid_remaining: int = 15
    sick_allotted: int = 10
    sick_used: int = 0
    sick_remaining: int = 10
    unpaid_used: int = 0
