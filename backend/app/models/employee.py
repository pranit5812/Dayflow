from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr, ConfigDict

class PersonalDetails(BaseModel):
    full_name: str = ""
    phone: str = ""
    address: str = ""
    dob: Optional[str] = ""
    profile_picture_url: str = ""
    personal_email: Optional[str] = ""
    gender: Optional[str] = ""
    nationality: Optional[str] = "Indian"
    marital_status: Optional[str] = "Single"

class JobDetails(BaseModel):
    company: str = "Dayflow Technologies"
    department: str = "Engineering"
    designation: str = "Software Engineer"
    date_of_joining: Optional[str] = ""
    manager_id: Optional[str] = ""
    location: Optional[str] = "San Francisco, CA"

class PrivateDetails(BaseModel):
    bank_name: str = "HDFC Bank"
    account_number: str = "••••••••4892"
    ifsc_code: str = "HDFC0001234"
    pan: str = "ABCDE1234F"
    uan: str = "100987654321"

class SkillsAndCertifications(BaseModel):
    skills: List[str] = Field(default_factory=lambda: ["React", "FastAPI", "Python", "MongoDB", "TailwindCSS"])
    certifications: List[str] = Field(default_factory=lambda: ["AWS Certified Developer", "Certified HR Specialist"])

class SalaryStructure(BaseModel):
    basic: float = 50000.0
    hra: float = 20000.0
    allowances: float = 10000.0
    deductions: float = 5000.0
    currency: str = "INR"

class DocumentItem(BaseModel):
    name: str
    url: str
    uploaded_at: Optional[datetime] = None

class EmployeeCreate(BaseModel):
    employee_id: str
    personal_details: PersonalDetails = Field(default_factory=PersonalDetails)
    job_details: JobDetails = Field(default_factory=JobDetails)
    private_details: PrivateDetails = Field(default_factory=PrivateDetails)
    skills_certifications: SkillsAndCertifications = Field(default_factory=SkillsAndCertifications)
    salary_structure: SalaryStructure = Field(default_factory=SalaryStructure)

class EmployeeSelfUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    profile_picture_url: Optional[str] = None
    personal_email: Optional[str] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    marital_status: Optional[str] = None

class EmployeeAdminUpdate(BaseModel):
    personal_details: Optional[PersonalDetails] = None
    job_details: Optional[JobDetails] = None
    private_details: Optional[PrivateDetails] = None
    skills_certifications: Optional[SkillsAndCertifications] = None
    salary_structure: Optional[SalaryStructure] = None
    is_active: Optional[bool] = None

class EmployeeOut(BaseModel):
    employee_id: str
    email: Optional[str] = None
    personal_details: PersonalDetails = Field(default_factory=PersonalDetails)
    job_details: JobDetails = Field(default_factory=JobDetails)
    private_details: PrivateDetails = Field(default_factory=PrivateDetails)
    skills_certifications: SkillsAndCertifications = Field(default_factory=SkillsAndCertifications)
    salary_structure: SalaryStructure = Field(default_factory=SalaryStructure)
    documents: List[DocumentItem] = []
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
