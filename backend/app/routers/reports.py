from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Response
from app.services.report_service import generate_payroll_pdf, export_attendance_csv, export_payroll_csv
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
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=attendance_report_{month}.csv"}
    )

@router.get("/payroll/csv")
async def download_payroll_csv(
    month: str,
    current_user: dict = Depends(require_admin)
):
    csv_data = await export_payroll_csv(month)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=payroll_report_{month}.csv"}
    )
