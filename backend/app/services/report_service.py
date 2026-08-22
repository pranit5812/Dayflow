import io
import csv
from datetime import datetime, timezone
from fastapi import HTTPException
from fpdf import FPDF
from app.db.mongodb import get_database

class PDFPaystub(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(30, 41, 59)
        self.cell(0, 10, "DAYFLOW HRMS - PAYROLL SLIP", border=False, align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 10)
        self.set_text_color(100, 116, 139)
        self.cell(0, 6, "Confidential Employee Earnings Statement", border=False, align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 10, f"Generated automatically by Dayflow HRMS System. Page {self.page_no()}", align="C")

async def generate_payroll_pdf(slip_id: str) -> bytes:
    db = get_database()
    from bson import ObjectId
    try:
        slip = await db.payroll_slips.find_one({"_id": ObjectId(slip_id)})
    except Exception:
        slip = await db.payroll_slips.find_one({"employee_id": slip_id})
        
    if not slip:
        raise HTTPException(status_code=404, detail="Payroll slip not found")
        
    pdf = PDFPaystub()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # Metadata Block
    pdf.set_fill_color(241, 245, 249)
    pdf.set_draw_color(226, 232, 240)
    pdf.rect(10, 30, 190, 35, style="FD")
    
    pdf.set_xy(15, 33)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(40, 7, "Employee Name:", 0, 0)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(50, 7, str(slip.get("employee_name", slip["employee_id"])), 0, 0)
    
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(40, 7, "Pay Period:", 0, 0)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(50, 7, str(slip.get("month", "")), 0, 1)
    
    pdf.set_x(15)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(40, 7, "Employee ID:", 0, 0)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(50, 7, str(slip.get("employee_id", "")), 0, 0)
    
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(40, 7, "Department:", 0, 0)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(50, 7, str(slip.get("department", "Engineering")), 0, 1)
    
    pdf.set_x(15)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(40, 7, "Status:", 0, 0)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(16, 185, 129) if slip.get("status") == "finalized" else pdf.set_text_color(245, 158, 11)
    pdf.cell(50, 7, str(slip.get("status", "draft")).upper(), 0, 1)
    pdf.set_text_color(30, 41, 59)
    
    pdf.ln(15)
    
    # Attendance Summary Table
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "1. Attendance Summary", 0, 1)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_fill_color(226, 232, 240)
    pdf.cell(38, 8, "Present", 1, 0, "C", True)
    pdf.cell(38, 8, "Half-Day", 1, 0, "C", True)
    pdf.cell(38, 8, "Absent", 1, 0, "C", True)
    pdf.cell(38, 8, "Paid Leave", 1, 0, "C", True)
    pdf.cell(38, 8, "Unpaid Leave", 1, 1, "C", True)
    
    att = slip.get("attendance_summary", {})
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(38, 8, str(att.get("present", 0)), 1, 0, "C")
    pdf.cell(38, 8, str(att.get("half_day", 0)), 1, 0, "C")
    pdf.cell(38, 8, str(att.get("absent", 0)), 1, 0, "C")
    pdf.cell(38, 8, str(att.get("paid_leave", 0)), 1, 0, "C")
    pdf.cell(38, 8, str(att.get("unpaid_leave", 0)), 1, 1, "C")
    
    pdf.ln(10)
    
    # Salary Breakdown Table
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "2. Earnings & Deductions Breakdown", 0, 1)
    
    breakdown = slip.get("salary_breakdown", {})
    
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_fill_color(226, 232, 240)
    pdf.cell(95, 8, "Component", 1, 0, "L", True)
    pdf.cell(95, 8, "Amount (INR)", 1, 1, "R", True)
    
    pdf.set_font("Helvetica", "", 10)
    items = [
        ("Basic Salary", f"₹ {breakdown.get('basic', 0.0):,.2f}"),
        ("House Rent Allowance (HRA)", f"₹ {breakdown.get('hra', 0.0):,.2f}"),
        ("Special Allowances", f"₹ {breakdown.get('allowances', 0.0):,.2f}"),
        ("Gross Salary", f"₹ {breakdown.get('gross_salary', 0.0):,.2f}"),
        ("Standard Deductions", f"₹ {breakdown.get('standard_deductions', 0.0):,.2f}"),
        (f"Unpaid Leave Deduction ({att.get('unpaid_leave', 0)} days @ ₹{breakdown.get('per_day_rate', 0.0):,.2f}/day)", f"- ₹ {breakdown.get('unpaid_leave_deduction', 0.0):,.2f}"),
        ("Total Deductions", f"- ₹ {breakdown.get('total_deductions', 0.0):,.2f}")
    ]
    
    for title, val in items:
        if "Gross" in title or "Total Deductions" in title:
            pdf.set_font("Helvetica", "B", 10)
        else:
            pdf.set_font("Helvetica", "", 10)
        pdf.cell(95, 8, title, 1, 0, "L")
        pdf.cell(95, 8, val, 1, 1, "R")
        
    pdf.ln(5)
    
    # Net Pay Callout
    pdf.set_fill_color(240, 253, 244)
    pdf.set_draw_color(74, 222, 128)
    pdf.rect(10, pdf.get_y(), 190, 18, style="FD")
    
    pdf.set_y(pdf.get_y() + 4)
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(22, 101, 52)
    pdf.cell(95, 10, "  NET SALARY PAYABLE:", 0, 0, "L")
    pdf.cell(90, 10, f"₹ {slip.get('net_salary', 0.0):,.2f}  ", 0, 1, "R")
    
    return bytes(pdf.output())

async def export_attendance_csv(month: str) -> str:
    db = get_database()
    records = await db.attendance.find({"date": {"$regex": f"^{month}"}}).to_list(1000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Employee ID", "Date", "Check In", "Check Out", "Status", "Source", "Work Hours"])
    
    for r in records:
        writer.writerow([
            r.get("employee_id", ""),
            r.get("date", ""),
            str(r.get("check_in", "") or ""),
            str(r.get("check_out", "") or ""),
            r.get("status", ""),
            r.get("source", ""),
            r.get("work_hours", 0.0)
        ])
    return output.getvalue()

async def export_payroll_csv(month: str) -> str:
    db = get_database()
    slips = await db.payroll_slips.find({"month": month}).to_list(1000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Employee ID", "Employee Name", "Month", "Present Days", "Unpaid Leave Days",
        "Gross Salary", "Total Deductions", "Net Salary", "Status"
    ])
    
    for s in slips:
        att = s.get("attendance_summary", {})
        writer.writerow([
            s.get("employee_id", ""),
            s.get("employee_name", ""),
            s.get("month", ""),
            att.get("present", 0),
            att.get("unpaid_leave", 0),
            s.get("gross_salary", 0.0),
            s.get("deductions", 0.0),
            s.get("net_salary", 0.0),
            s.get("status", "")
        ])
    return output.getvalue()
