from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from bson import ObjectId
from app.db.mongodb import get_database
from app.models.recruitment import JobPostingCreate, CandidateCreate, CandidateStageUpdate
from app.services.activity_service import log_activity

async def create_job_posting(data: JobPostingCreate, creator_emp_id: str) -> dict:
    db = get_database()
    now = datetime.now(timezone.utc)
    
    doc = {
        "title": data.title.strip(),
        "department": data.department.strip(),
        "location": data.location.strip(),
        "job_type": data.job_type.strip(),
        "description": data.description or "",
        "status": "Open",
        "applicants_count": 0,
        "created_by": creator_emp_id,
        "created_at": now,
        "updated_at": now
    }
    
    res = await db.job_postings.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    
    await log_activity(creator_emp_id, "job_posting_created", f"Created job opening '{data.title}' in {data.department}")
    return doc

async def list_job_postings() -> List[dict]:
    db = get_database()
    jobs = await db.job_postings.find().sort("created_at", -1).to_list(100)
    
    # Auto-seed mock jobs if collection empty
    if len(jobs) == 0:
        seed_jobs = [
            {"title": "Senior Full-Stack Engineer", "department": "Engineering", "location": "Remote", "job_type": "Full-Time", "status": "Open", "applicants_count": 5, "created_at": datetime.now(timezone.utc)},
            {"title": "HR Talent Acquisition Partner", "department": "HR", "location": "Hybrid", "job_type": "Full-Time", "status": "Open", "applicants_count": 3, "created_at": datetime.now(timezone.utc)},
            {"title": "Product Marketing Lead", "department": "Marketing", "location": "On-site", "job_type": "Full-Time", "status": "Open", "applicants_count": 2, "created_at": datetime.now(timezone.utc)},
        ]
        await db.job_postings.insert_many(seed_jobs)
        jobs = await db.job_postings.find().sort("created_at", -1).to_list(100)

    for j in jobs:
        j["_id"] = str(j["_id"])
    return jobs

async def toggle_job_status(job_id: str, new_status: str, admin_emp_id: str) -> dict:
    db = get_database()
    try:
        query = {"_id": ObjectId(job_id)}
    except Exception:
        query = {"_id": job_id}
        
    res = await db.job_postings.find_one_and_update(
        query,
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}},
        return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Job posting not found")
        
    res["_id"] = str(res["_id"])
    await log_activity(admin_emp_id, "job_status_updated", f"Job posting '{res['title']}' status set to {new_status}")
    return res

async def add_candidate(data: CandidateCreate, admin_emp_id: str) -> dict:
    db = get_database()
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    
    doc = {
        "job_id": data.job_id or "",
        "job_title": data.job_title.strip(),
        "name": data.name.strip(),
        "email": data.email.strip().lower(),
        "phone": data.phone or "",
        "stage": data.stage or "Applied",
        "interviewer_notes": data.interviewer_notes or "",
        "applied_date": today_str,
        "created_at": now,
        "updated_at": now
    }
    
    res = await db.candidates.insert_one(doc)
    doc["_id"] = str(res.inserted_id)

    # Increment job applicant count
    if data.job_id:
        try:
            await db.job_postings.update_one({"_id": ObjectId(data.job_id)}, {"$inc": {"applicants_count": 1}})
        except Exception:
            pass

    await log_activity(admin_emp_id, "candidate_added", f"Added candidate {data.name} for {data.job_title}")
    return doc

async def list_candidates() -> List[dict]:
    db = get_database()
    candidates = await db.candidates.find().sort("created_at", -1).to_list(500)
    
    # Auto-seed mock candidates if empty
    if len(candidates) == 0:
        seed_cands = [
            {"job_title": "Senior Full-Stack Engineer", "name": "Rohan Sharma", "email": "rohan.s@example.com", "phone": "+91 9876543210", "stage": "Screening", "interviewer_notes": "Strong React & FastAPI background. Good communication.", "applied_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "created_at": datetime.now(timezone.utc)},
            {"job_title": "Senior Full-Stack Engineer", "name": "Ananya Patel", "email": "ananya.p@example.com", "phone": "+91 9812345678", "stage": "Interview", "interviewer_notes": "Scheduled technical architecture round for Thursday.", "applied_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "created_at": datetime.now(timezone.utc)},
            {"job_title": "HR Talent Acquisition Partner", "name": "Priya Verma", "email": "priya.v@example.com", "phone": "+91 9988776655", "stage": "Offer", "interviewer_notes": "Offer letter generated. Awaiting confirmation.", "applied_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "created_at": datetime.now(timezone.utc)},
            {"job_title": "Product Marketing Lead", "name": "Vikram Malhotra", "email": "vikram.m@example.com", "phone": "+91 9711223344", "stage": "Applied", "interviewer_notes": "New applicant profile received.", "applied_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "created_at": datetime.now(timezone.utc)},
        ]
        await db.candidates.insert_many(seed_cands)
        candidates = await db.candidates.find().sort("created_at", -1).to_list(500)

    for c in candidates:
        c["_id"] = str(c["_id"])
    return candidates

async def update_candidate_stage(candidate_id: str, stage_data: CandidateStageUpdate, admin_emp_id: str) -> dict:
    db = get_database()
    try:
        query = {"_id": ObjectId(candidate_id)}
    except Exception:
        query = {"_id": candidate_id}
        
    update_fields = {"stage": stage_data.stage, "updated_at": datetime.now(timezone.utc)}
    if stage_data.interviewer_notes is not None:
        update_fields["interviewer_notes"] = stage_data.interviewer_notes
        
    res = await db.candidates.find_one_and_update(
        query,
        {"$set": update_fields},
        return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
        
    res["_id"] = str(res["_id"])
    await log_activity(admin_emp_id, "candidate_stage_updated", f"Moved candidate {res['name']} to stage '{stage_data.stage}'")
    return res
