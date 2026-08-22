import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Dayflow HRMS"
    MONGO_URI: str = "mongodb+srv://pranit25006101_db_user:9PsuaY6fSEfxyToF@cluster0.2hbisjn.mongodb.net/?appName=Cluster0"
    DB_NAME: str = "dayflow_hrms"
    JWT_SECRET_KEY: str = "dayflow_hrms_super_secret_jwt_key_change_in_production_2026"
    JWT_REFRESH_SECRET_KEY: str = "dayflow_hrms_super_secret_refresh_jwt_key_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
    USE_MOCK_DB_IF_DISCONNECTED: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
