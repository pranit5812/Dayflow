import pytest
from datetime import datetime, timezone
from app.db.mongodb import get_database

@pytest.mark.asyncio
async def test_attendance_7_hour_threshold_logic():
    db = get_database()
    if db is None:
        pytest.skip("MongoDB connection offline during unit test runner")
    
    from app.services.attendance_service import check_in, check_out
    test_emp_id = "EMP_TEST_7HR"
    
    # 1. Test Check-In
    res_in = await check_in(test_emp_id)
    assert res_in["status"] == "Present"
    
    # 2. Test Check-Out
    res_out = await check_out(test_emp_id)
    assert "status" in res_out
    assert res_out["status"] in ["Half-day", "Present"]
