import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.db.indexes import create_indexes
from app.routers import auth, employees, attendance, leave, payroll, dashboard, reports, recruitment

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dayflow.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Dayflow HRMS Backend...")
    await connect_to_mongo()
    await create_indexes()
    yield
    logger.info("Shutting down Dayflow HRMS Backend...")
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Dayflow Human Resource Management System API Engine",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(attendance.router)
app.include_router(leave.router)
app.include_router(payroll.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(recruitment.router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
