from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

class MessageIn(BaseModel):
    conversation_id: str
    sender_id: str
    content: str
    metadata: Optional[dict] = None

class Message(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    conversation_id: str
    sender_id: str
    content: str
    metadata: Optional[dict] = None
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "sent"

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True
