from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from src.config import get_settings


settings = get_settings()

client = AsyncIOMotorClient(settings.MONGODB_URI)
db = client.mydatabase
chatbot_collection = db.chatbot_collection


class QueryRequest(BaseModel):
    query: str
    collection_name: str
    conversation_history: list = []