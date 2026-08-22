import logging
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger("dayflow.db")

class DatabaseManager:
    client: AsyncIOMotorClient = None
    db = None

db_manager = DatabaseManager()

import certifi

async def connect_to_mongo():
    logger.info(f"Connecting to MongoDB at {settings.MONGO_URI}...")
    try:
        db_manager.client = AsyncIOMotorClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=5000,
            tlsAllowInvalidCertificates=True
        )
        # Test connection ping
        await asyncio.wait_for(db_manager.client.admin.command('ping'), timeout=5.0)
        db_manager.db = db_manager.client[settings.DB_NAME]
        logger.info(f"Successfully connected to MongoDB database '{settings.DB_NAME}'.")
    except Exception as e:
        logger.warning(f"MongoDB connection attempt note: {e}")
        if settings.USE_MOCK_DB_IF_DISCONNECTED:
            logger.info("Initializing in-memory MongoMock motor client fallback for seamless operation...")
            try:
                import mongomock_motor
                db_manager.client = mongomock_motor.AsyncMongoMockClient()
                db_manager.db = db_manager.client[settings.DB_NAME]
                logger.info("MongoMock database initialized successfully.")
            except ImportError:
                logger.error("mongomock_motor is not installed. Unable to fall back.")
                raise e
        else:
            raise e

async def close_mongo_connection():
    if db_manager.client:
        db_manager.client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    return db_manager.db
