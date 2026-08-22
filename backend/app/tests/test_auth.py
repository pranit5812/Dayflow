import pytest

@pytest.mark.asyncio
async def test_user_signup_and_login(async_client):
    # 1. Signup employee
    signup_payload = {
        "employee_id": "TEST101",
        "email": "testuser@company.com",
        "password": "Password@123",
        "role": "employee",
        "full_name": "Test User"
    }
    response = await async_client.post("/api/auth/signup", json=signup_payload)
    assert response.status_code == 201
    assert response.json()["employee_id"] == "TEST101"

    # 2. Login employee
    login_payload = {
        "email": "testuser@company.com",
        "password": "Password@123"
    }
    login_res = await async_client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["role"] == "employee"

    # 3. Access /api/auth/me with Bearer token
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    me_res = await async_client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "testuser@company.com"
