from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Response
from app.services.report_service import (
    generate_payroll_pdf, export_attendance_csv, export_payroll_csv,
    export_leave_csv, export_employees_csv
)
from app.core.deps import require_admin, require_employee

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])

@router.get("/paystub/{slip_id}/pdf")
async def download_paystub_pdf(
    slip_id: str,
    current_user: dict = Depends(require_employee)
):
    pdf_bytes = await generate_payroll_pdf(slip_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=paystub_{slip_id}.pdf"}
    )

@router.get("/attendance/csv")
async def download_attendance_csv(
    month: str,
    current_user: dict = Depends(require_admin)
):
    csv_data = await export_attendance_csv(month)
    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename=Dayflow_Attendance_Report_{month}.csv"}
    )

@router.get("/payroll/csv")
async def download_payroll_csv(
    month: str,
    current_user: dict = Depends(require_admin)
):
    csv_data = await export_payroll_csv(month)
    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename=Dayflow_Payroll_Report_{month}.csv"}
    )

@router.get("/leave/csv")
async def download_leave_csv(
    month: Optional[str] = None,
    current_user: dict = Depends(require_admin)
):
    csv_data = await export_leave_csv(month)
    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename=Dayflow_Leave_Report_{month or 'all'}.csv"}
    )

@router.get("/employees/csv")
async def download_employees_csv(
    current_user: dict = Depends(require_admin)
):
    csv_data = await export_employees_csv()
    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=Dayflow_Employee_Master_Report.csv"}
    )
