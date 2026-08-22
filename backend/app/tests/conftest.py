import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from mongomock_motor import AsyncMongoMockClient
from app.main import app
from app.db.mongodb import db_manager

@pytest.fixture
async def setup_test_db():
    db_manager.client = AsyncMongoMockClient()
    db_manager.db = db_manager.client["dayflow_test_db"]
    yield
    await db_manager.client.drop_database("dayflow_test_db")

@pytest.fixture
async def async_client(setup_test_db):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
