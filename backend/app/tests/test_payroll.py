import pytest

@pytest.mark.asyncio
async def test_payroll_deduction_calculation(async_client):
    # Setup Admin & Employee
    await async_client.post("/api/auth/signup", json={
        "employee_id": "ADM777",
        "email": "admin777@company.com",
        "password": "AdminPassword@123",
        "role": "admin",
        "full_name": "Payroll Admin"
    })
    adm_login = await async_client.post("/api/auth/login", json={"email": "admin777@company.com", "password": "AdminPassword@123"})
    admin_token = adm_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    await async_client.post("/api/auth/signup", json={
        "employee_id": "EMP808",
        "email": "emp808@company.com",
        "password": "EmpPassword@123",
        "role": "employee",
        "full_name": "Payroll Subject"
    })

    # Set salary structure for EMP808: Basic=44000, HRA=20000, Allowances=10000, Deductions=5000
    sal_payload = {
        "basic": 44000.0,
        "hra": 20000.0,
        "allowances": 10000.0,
        "deductions": 5000.0,
        "currency": "INR"
    }
    sal_res = await async_client.put("/api/payroll/EMP808/salary-structure", json=sal_payload, headers=admin_headers)
    assert sal_res.status_code == 200

    # Add unpaid leave request & approve it for 2 days in 2026-08
    emp_login = await async_client.post("/api/auth/login", json={"email": "emp808@company.com", "password": "EmpPassword@123"})
    emp_token = emp_login.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}

    leave_res = await async_client.post("/api/leave/apply", json={
        "leave_type": "unpaid",
        "start_date": "2026-08-03",
        "end_date": "2026-08-04",
        "remarks": "Unpaid emergency leave"
    }, headers=emp_headers)
    leave_id = leave_res.json()["id"]

    await async_client.post(f"/api/leave/{leave_id}/review", json={
        "status": "Approved",
        "admin_comments": "Approved unpaid leave"
    }, headers=admin_headers)

    # Generate payroll for 2026-08 with 22 working days
    # per_day_rate = 44000 / 22 = 2000.0
    # unpaid_leave_deduction = 2 * 2000.0 = 4000.0
    # Gross = 44000 + 20000 + 10000 = 74000.0
    # Total Deductions = 5000 (standard) + 4000 (unpaid) = 9000.0
    # Net = 74000 - 9000 = 65000.0
    pay_gen_res = await async_client.post("/api/payroll/generate", json={
        "employee_id": "EMP808",
        "month": "2026-08",
        "total_working_days": 22
    }, headers=admin_headers)

    assert pay_gen_res.status_code == 200
    slip = pay_gen_res.json()
    assert slip["attendance_summary"]["unpaid_leave"] == 2
    assert slip["salary_breakdown"]["per_day_rate"] == 2000.0
    assert slip["salary_breakdown"]["unpaid_leave_deduction"] == 4000.0
    assert slip["gross_salary"] == 74000.0
    assert slip["deductions"] == 9000.0
    assert slip["net_salary"] == 65000.0
