from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

class JobPostingCreate(BaseModel):
    title: str = Field(..., description="Job Title (e.g. Senior Software Engineer)")
    department: str = Field("Engineering", description="Department")
    location: str = Field("Remote", description="Location (Remote, Hybrid, On-site)")
    job_type: str = Field("Full-Time", description="Full-Time, Part-Time, Contract, Internship")
    description: Optional[str] = ""

class JobPostingOut(BaseModel):
    id: str = Field(..., alias="_id")
    title: str
    department: str
    location: str
    job_type: str
    status: str = "Open"  # Open, Closed, Draft
    description: Optional[str] = ""
    applicants_count: int = 0
    created_at: datetime

class CandidateCreate(BaseModel):
    job_id: Optional[str] = ""
    job_title: str
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    stage: str = Field("Applied", description="Applied, Screening, Interview, Offer, Hired, Rejected")
    interviewer_notes: Optional[str] = ""

class CandidateStageUpdate(BaseModel):
    stage: str
    interviewer_notes: Optional[str] = None

class CandidateOut(BaseModel):
    id: str = Field(..., alias="_id")
    job_id: Optional[str] = ""
    job_title: str
    name: str
    email: str
    phone: Optional[str] = ""
    stage: str
    interviewer_notes: Optional[str] = ""
    applied_date: str
    created_at: datetime
