from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ActivityFeedOut(BaseModel):
    id: str
    employee_id: str
    employee_name: Optional[str] = ""
    type: str  # leave_applied | leave_approved | leave_rejected | attendance_marked | payroll_generated | profile_updated
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationOut(BaseModel):
    id: str
    employee_id: str
    title: str
    message: str
    read: bool = False
    type: str
    created_at: datetime
