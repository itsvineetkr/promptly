from motor.motor_asyncio import AsyncIOMotorClient
from src.config import get_settings


settings = get_settings()

try:
    client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
except Exception as e:
    raise Exception(f"Failed to connect to MongoDB: {e}")

db = client[settings.MONGODB_DB_NAME]

allowed_origins_collection = db.allowed_origins_collection