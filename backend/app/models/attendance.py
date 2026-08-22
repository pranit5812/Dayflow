from datetime import datetime, date
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class AttendanceStatus(str, Enum):
    PRESENT = "Present"
    ABSENT = "Absent"
    HALF_DAY = "Half-day"
    LEAVE = "Leave"

class AttendanceSource(str, Enum):
    CHECK_IN = "check-in"
    AUTO_LEAVE_SYNC = "auto-leave-sync"
    ADMIN_MANUAL = "admin-manual"

class AttendanceCheckIn(BaseModel):
    notes: Optional[str] = ""

class AttendanceCheckOut(BaseModel):
    notes: Optional[str] = ""

class AttendanceManualUpdate(BaseModel):
    employee_id: str
    date: str  # YYYY-MM-DD
    status: AttendanceStatus
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    reason: Optional[str] = "Admin correction"

class AttendanceOut(BaseModel):
    id: Optional[str] = None
    employee_id: str
    date: str
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: AttendanceStatus
    source: AttendanceSource
    work_hours: float = 0.0
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AttendanceSummary(BaseModel):
    employee_id: str
    total_days: int
    present: int
    half_day: int
    absent: int
    leave: int
    attendance_rate: float
