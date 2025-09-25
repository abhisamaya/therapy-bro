from __future__ import annotations
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    login_id: str = Field(index=True, unique=True)
    password_hash: Optional[str] = Field(default=None) 
    name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    created_at: datetime

    #  Google OAuth fields
    google_id: Optional[str] = Field(default=None, index=True)
    email: Optional[str] = Field(default=None, index=True)
    avatar_url: Optional[str] = None
    auth_provider: str = Field(default="local")  # "local" or "google"

class ChatSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(index=True, unique=True)
    user_id: int = Field(index=True)
    category: str
    notes: Optional[str] = None
    complete_chat: str  # JSON string of messages
    created_at: datetime
    updated_at: datetime

class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(index=True)
    role: str  # system | user | assistant
    content: str
    created_at: datetime
