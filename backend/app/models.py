from __future__ import annotations
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    login_id: str = Field(index=True, unique=True)
    password_hash: str
    name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    created_at: datetime

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
