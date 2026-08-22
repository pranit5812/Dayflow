import pytest

@pytest.mark.asyncio
async def test_leave_approval_triggers_attendance_sync(async_client):
    # Setup Admin & Employee
    await async_client.post("/api/auth/signup", json={
        "employee_id": "ADM999",
        "email": "admin_test@company.com",
        "password": "AdminPassword@123",
        "role": "admin",
        "full_name": "Admin Tester"
    })
    adm_login = await async_client.post("/api/auth/login", json={
        "email": "admin_test@company.com",
        "password": "AdminPassword@123"
    })
    admin_token = adm_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    await async_client.post("/api/auth/signup", json={
        "employee_id": "EMP505",
        "email": "emp505@company.com",
        "password": "EmpPassword@123",
        "role": "employee",
        "full_name": "Leave Tester"
    })
    emp_login = await async_client.post("/api/auth/login", json={
        "email": "emp505@company.com",
        "password": "EmpPassword@123"
    })
    emp_token = emp_login.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}

    # Employee applies for leave
    leave_payload = {
        "leave_type": "paid",
        "start_date": "2026-09-10",
        "end_date": "2026-09-12",
        "remarks": "Vacation trip"
    }
    apply_res = await async_client.post("/api/leave/apply", json=leave_payload, headers=emp_headers)
    assert apply_res.status_code == 201
    leave_id = apply_res.json()["id"]

    # Admin approves leave
    review_payload = {
        "status": "Approved",
        "admin_comments": "Approved by testing"
    }
    review_res = await async_client.post(f"/api/leave/{leave_id}/review", json=review_payload, headers=admin_headers)
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "Approved"

    # Verify Attendance collection has records for 2026-09-10, 2026-09-11, 2026-09-12 with status="Leave"
    att_res = await async_client.get("/api/attendance/me", headers=emp_headers)
    assert att_res.status_code == 200
    att_records = att_res.json()
    leave_dates = [r["date"] for r in att_records if r["status"] == "Leave"]
    assert "2026-09-10" in leave_dates
    assert "2026-09-11" in leave_dates
    assert "2026-09-12" in leave_dates
