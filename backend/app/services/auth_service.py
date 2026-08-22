from datetime import datetime, timezone
from fastapi import HTTPException, status
from app.db.mongodb import get_database
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.models.user import UserSignUp, UserLogin, TokenResponse
from app.services.activity_service import log_activity

import random

async def register_user(user_data: UserSignUp) -> dict:
    db = get_database()
    
    clean_email = user_data.email.strip().lower()
    
    # Auto-generate employee_id if blank or placeholder
    emp_id = user_data.employee_id.strip() if user_data.employee_id else ""
    if not emp_id:
        emp_id = f"EMP{random.randint(1000, 9999)}"
        
    # Check if employee_id or email already exists
    existing_user = await db.users.find_one({
        "$or": [
            {"email": {"$regex": f"^{clean_email}$", "$options": "i"}},
            {"employee_id": {"$regex": f"^{emp_id}$", "$options": "i"}}
        ]
    })
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account with this Email or Employee ID already registered."
        )
    
    role = user_data.role if user_data.role in ["admin", "employee"] else "employee"
    
    user_doc = {
        "employee_id": emp_id,
        "email": clean_email,
        "password_hash": hash_password(user_data.password),
        "role": role,
        "is_email_verified": True,
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    await db.users.insert_one(user_doc)
    
    # Create employee profile if missing
    existing_emp = await db.employees.find_one({"employee_id": emp_id})
    if not existing_emp:
        emp_doc = {
            "employee_id": emp_id,
            "personal_details": {
                "full_name": user_data.full_name or emp_id,
                "phone": "",
                "address": "",
                "dob": "",
                "profile_picture_url": "",
                "personal_email": clean_email,
                "gender": "Male",
                "nationality": "Indian",
                "marital_status": "Single"
            },
            "job_details": {
                "company": "Dayflow HRMS",
                "department": "Engineering",
                "designation": "Team Member",
                "date_of_joining": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "manager_id": ""
            },
            "private_details": {
                "bank_name": "HDFC Bank",
                "account_number": "••••••••4892",
                "ifsc_code": "HDFC0001234",
                "pan": "ABCDE1234F",
                "uan": "100987654321"
            },
            "skills_certifications": {
                "skills": ["React", "Python", "FastAPI", "MongoDB"],
                "certifications": ["Certified Professional"]
            },
            "salary_structure": {
                "basic": 50000.0,
                "hra": 20000.0,
                "allowances": 10000.0,
                "deductions": 5000.0,
                "currency": "INR"
            },
            "documents": [],
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        await db.employees.insert_one(emp_doc)

    await log_activity(emp_id, "user_signup", f"Account registered for {emp_id}")
    return {"message": "User registered successfully", "employee_id": emp_id}

async def authenticate_user(login_data: UserLogin) -> TokenResponse:
    db = get_database()
    login_id = login_data.email.strip()
    
    # Allow login by Email OR Employee ID (case-insensitive)
    user = await db.users.find_one({
        "$or": [
            {"email": {"$regex": f"^{login_id}$", "$options": "i"}},
            {"employee_id": {"$regex": f"^{login_id}$", "$options": "i"}}
        ]
    })
    
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Email / Employee ID or password."
        )
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact your HR administrator."
        )
    
    access_token = create_access_token(
        subject=str(user["_id"]),
        role=user["role"],
        employee_id=user["employee_id"]
    )
    refresh_token = create_refresh_token(subject=str(user["_id"]))
    
    emp = await db.employees.find_one({"employee_id": user["employee_id"]})
    full_name = emp.get("personal_details", {}).get("full_name") if emp else ""
    if not full_name:
        full_name = user.get("full_name") or user.get("email", "").split("@")[0].capitalize()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user["role"],
        employee_id=user["employee_id"],
        full_name=full_name,
        email=user.get("email", "")
    )

async def refresh_access_token(refresh_token: str) -> dict:
    payload = decode_token(refresh_token, secret_key=from_config())
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    
    user_id = payload.get("sub")
    db = get_database()
    user = await db.users.find_one({"_id": user_id})
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User unavailable")
    
    new_access_token = create_access_token(
        subject=str(user["_id"]),
        role=user["role"],
        employee_id=user["employee_id"]
    )
    return {"access_token": new_access_token, "token_type": "bearer"}

from app.services.email_service import send_otp_email

def from_config():
    from app.core.config import settings
    return settings.JWT_REFRESH_SECRET_KEY

async def request_forgot_password(login_id: str) -> dict:
    db = get_database()
    clean_id = login_id.strip()
    user = await db.users.find_one({
        "$or": [
            {"email": {"$regex": f"^{clean_id}$", "$options": "i"}},
            {"employee_id": {"$regex": f"^{clean_id}$", "$options": "i"}}
        ]
    })
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No account found registered under '{login_id}'."
        )

    # Generate 6-digit OTP code for password reset verification
    otp_code = str(random.randint(100000, 999999))
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"reset_otp": otp_code, "reset_otp_at": datetime.now(timezone.utc)}}
    )

    # Dispatch via Real SMTP Mail Engine (or log fallback)
    target_email = user.get("email", clean_id)
    email_sent = await send_otp_email(target_email, user["employee_id"], otp_code)

    await log_activity(user["employee_id"], "forgot_password_requested", f"Password reset requested for {user['employee_id']}")
    return {
        "message": f"OTP verification code sent to {target_email} via SMTP!" if email_sent else f"OTP verification code generated for {target_email}.",
        "otp_code": otp_code,
        "email": target_email,
        "email_sent": email_sent
    }

async def reset_user_password(login_id: str, otp_code: str, new_password: str) -> dict:
    db = get_database()
    clean_id = login_id.strip()
    user = await db.users.find_one({
        "$or": [
            {"email": {"$regex": f"^{clean_id}$", "$options": "i"}},
            {"employee_id": {"$regex": f"^{clean_id}$", "$options": "i"}}
        ]
    })
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")

    saved_otp = user.get("reset_otp")
    if not saved_otp or str(saved_otp).strip() != str(otp_code).strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP verification code.")

    new_hash = hash_password(new_password)
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc)}, "$unset": {"reset_otp": ""}}
    )

    await log_activity(user["employee_id"], "password_reset_completed", f"Password successfully updated for {user['employee_id']}")
    return {"message": "Password updated successfully! You can now sign in."}
