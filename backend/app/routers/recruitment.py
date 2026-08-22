from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.recruitment import (
    JobPostingCreate, JobPostingOut, CandidateCreate,
    CandidateStageUpdate, CandidateOut
)
from app.services.recruitment_service import (
    create_job_posting, list_job_postings, toggle_job_status,
    add_candidate, list_candidates, update_candidate_stage
)
from app.core.deps import require_admin, require_employee

router = APIRouter(prefix="/api/recruitment", tags=["Recruitment & ATS"])

@router.get("/jobs", response_model=List[dict])
async def get_jobs(current_user: dict = Depends(require_employee)):
    return await list_job_postings()

@router.post("/jobs", response_model=dict, status_code=status.HTTP_201_CREATED)
async def post_job(
    data: JobPostingCreate,
    current_user: dict = Depends(require_admin)
):
    return await create_job_posting(data, current_user["employee_id"])

@router.put("/jobs/{job_id}/status", response_model=dict)
async def change_job_status(
    job_id: str,
    new_status: str,
    current_user: dict = Depends(require_admin)
):
    return await toggle_job_status(job_id, new_status, current_user["employee_id"])

@router.get("/candidates", response_model=List[dict])
async def get_candidates(current_user: dict = Depends(require_admin)):
    return await list_candidates()

@router.post("/candidates", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_candidate(
    data: CandidateCreate,
    current_user: dict = Depends(require_admin)
):
    return await add_candidate(data, current_user["employee_id"])

@router.put("/candidates/{candidate_id}/stage", response_model=dict)
async def advance_candidate_stage(
    candidate_id: str,
    data: CandidateStageUpdate,
    current_user: dict = Depends(require_admin)
):
    return await update_candidate_stage(candidate_id, data, current_user["employee_id"])
