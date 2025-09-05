from __future__ import annotations
from pydantic import BaseModel
from typing import List, Optional

# Auth
class RegisterIn(BaseModel):
    login_id: str
    password: str
    name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None

class LoginIn(BaseModel):
    login_id: str
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class MeOut(BaseModel):
    login_id: str
    name: Optional[str]

# Chat
class StartSessionIn(BaseModel):
    category: str

class StartSessionOut(BaseModel):
    session_id: str

class MessageIn(BaseModel):
    content: str

class MessageOut(BaseModel):
    role: str
    content: str

class HistoryOut(BaseModel):
    session_id: str
    category: str
    messages: List[MessageOut]

class ConversationItem(BaseModel):
    session_id: str
    category: str
    updated_at: str
    notes: Optional[str] = None

class NotesIn(BaseModel):
    notes: str
