from fastapi import APIRouter, Depends, Query, HTTPException
from .db import get_collection
from .models import Message, ListenerRegister, ListenerLogin, TokenResponse, ListenerOut, ListenerProfileUpdate
from .auth import hash_password, verify_password, create_access_token, get_current_listener
from typing import List
from datetime import datetime

router = APIRouter()


# Listener Authentication Endpoints
@router.post("/auth/register", response_model=TokenResponse)
async def register_listener(data: ListenerRegister):
    """Register a new listener"""
    listeners_col = get_collection("listeners")

    # Check if listener already exists
    existing = await listeners_col.find_one({"login_id": data.login_id})
    if existing:
        raise HTTPException(status_code=400, detail="Login ID already exists")

    # Create listener document
    listener_doc = {
        "login_id": data.login_id,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "phone": data.phone,
        "age": data.age,
        "created_at": datetime.utcnow()
    }

    # Insert into database
    result = await listeners_col.insert_one(listener_doc)

    # Create access token
    access_token = create_access_token(data.login_id)

    return TokenResponse(access_token=access_token)


@router.post("/auth/login", response_model=TokenResponse)
async def login_listener(data: ListenerLogin):
    """Login a listener"""
    listeners_col = get_collection("listeners")

    # Find listener
    listener = await listeners_col.find_one({"login_id": data.login_id})
    if not listener:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Verify password
    if not verify_password(data.password, listener["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create access token
    access_token = create_access_token(data.login_id)

    return TokenResponse(access_token=access_token)


@router.get("/auth/me", response_model=ListenerOut)
async def get_current_listener_info(current_listener: dict = Depends(get_current_listener)):
    """Get current listener information"""
    listeners_col = get_collection("listeners")

    listener = await listeners_col.find_one({"login_id": current_listener["sub"]})
    if not listener:
        raise HTTPException(status_code=404, detail="Listener not found")

    return ListenerOut(
        login_id=listener["login_id"],
        name=listener["name"],
        phone=listener.get("phone"),
        age=listener.get("age"),
        headline=listener.get("headline"),
        description=listener.get("description"),
        categories=listener.get("categories", []),
        years_of_experience=listener.get("years_of_experience"),
        date_of_birth=listener.get("date_of_birth"),
        profile_picture=listener.get("profile_picture"),
        created_at=listener["created_at"]
    )


@router.put("/auth/profile", response_model=ListenerOut)
async def update_listener_profile(
    profile_data: ListenerProfileUpdate,
    current_listener: dict = Depends(get_current_listener)
):
    """Update listener profile information"""
    listeners_col = get_collection("listeners")

    # Build update document with only provided fields
    update_doc = {}
    if profile_data.name is not None:
        update_doc["name"] = profile_data.name
    if profile_data.headline is not None:
        update_doc["headline"] = profile_data.headline
    if profile_data.description is not None:
        update_doc["description"] = profile_data.description
    if profile_data.categories is not None:
        update_doc["categories"] = profile_data.categories
    if profile_data.years_of_experience is not None:
        update_doc["years_of_experience"] = profile_data.years_of_experience
    if profile_data.date_of_birth is not None:
        update_doc["date_of_birth"] = profile_data.date_of_birth
    if profile_data.phone is not None:
        update_doc["phone"] = profile_data.phone
    if profile_data.profile_picture is not None:
        update_doc["profile_picture"] = profile_data.profile_picture

    if not update_doc:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Update the listener
    result = await listeners_col.update_one(
        {"login_id": current_listener["sub"]},
        {"$set": update_doc}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Listener not found")

    # Fetch updated listener
    listener = await listeners_col.find_one({"login_id": current_listener["sub"]})

    return ListenerOut(
        login_id=listener["login_id"],
        name=listener["name"],
        phone=listener.get("phone"),
        age=listener.get("age"),
        headline=listener.get("headline"),
        description=listener.get("description"),
        categories=listener.get("categories", []),
        years_of_experience=listener.get("years_of_experience"),
        date_of_birth=listener.get("date_of_birth"),
        profile_picture=listener.get("profile_picture"),
        created_at=listener["created_at"]
    )


# Message Endpoints
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