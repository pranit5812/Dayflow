from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserBase(BaseModel):
    email: EmailStr
    employee_id: str

class UserSignUp(BaseModel):
    employee_id: str = Field(..., description="Unique Employee ID (e.g. EMP1001)")
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: Optional[str] = Field("employee", description="Role: 'employee' or 'admin'")
    full_name: Optional[str] = Field("", description="Full name of the employee")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    employee_id: str

class UserOut(BaseModel):
    employee_id: str
    email: EmailStr
    role: str
    is_email_verified: bool
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
