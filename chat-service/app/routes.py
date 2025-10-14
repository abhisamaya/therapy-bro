from fastapi import APIRouter, Depends, Query
from .db import get_collection
from .models import Message
from typing import List
from datetime import datetime

router = APIRouter()


@router.get("/conversations/{conv_id}/messages")
async def get_messages(conv_id: str, limit: int = Query(50), before: str | None = None):
    col = get_collection("messages")
    query = {"conversation_id": conv_id}
    if before:
        # expecting ISO timestamp or object id, simple version: by sent_at
        query["sent_at"] = {"$lt": datetime.fromisoformat(before)}
    cursor = col.find(query).sort("sent_at", 1).limit(limit)
    docs = await cursor.to_list(length=limit)

    # Convert ObjectId to string for JSON serialization
    for doc in docs:
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])

    return docs