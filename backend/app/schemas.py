from __future__ import annotations
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

# --- small helpful types ---
MoneyStr = str  # alias: replace with Decimal if/when you change transport

class Role(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"

class SessionStatus(str, Enum):
    active = "active"
    ended = "ended"

# --- user/profile ---
class ProfileInfo(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None

class UserBase(ProfileInfo):
    login_id: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    auth_provider: str

class UserOut(UserBase):
    pass

# Auth
class RegisterIn(ProfileInfo):
    login_id: str
    password: str

class LoginIn(BaseModel):
    login_id: str
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

# AUTH - Google OAuth
class GoogleAuthIn(BaseModel):
    id_token: str

# Profile Update
class UpdateProfileIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None

# --- wallet/money ---
class WalletSummary(BaseModel):
    balance: MoneyStr
    reserved: MoneyStr
    currency: str
    
class WalletOut(WalletSummary):
    pass

class CreateWalletOut(BaseModel):
    wallet_id: int
    balance: MoneyStr
    currency: str

# --- session time / common session mixins ---
class SessionTimes(BaseModel):
    session_id: str
    session_start_time: Optional[datetime] = None  # Match DB field name
    session_end_time: Optional[datetime] = None   # Match DB field name
    duration_seconds: Optional[int] = None

class SessionFinancials(BaseModel):
    cost_charged: Optional[MoneyStr] = None
    wallet_balance: Optional[MoneyStr] = None
    wallet_reserved: Optional[MoneyStr] = None
    
# --- Chat / conversation ---
class MessageIn(BaseModel):
    content: str

class MessageOut(BaseModel):
    role: str
    content: str

class HistoryOut(SessionTimes, BaseModel):
    category: str
    messages: List[MessageOut]
    status: SessionStatus
    remaining_seconds: int

class ConversationItem(BaseModel):
    session_id: str
    category: str
    updated_at: datetime
    notes: Optional[str] = None
    status: SessionStatus
    remaining_seconds: int

class NotesIn(BaseModel):
    notes: str

# --- session endpoints outputs (compose instead of repeat) ---
class StartSessionIn(BaseModel):
    category: str

class StartSessionOut(SessionTimes, SessionFinancials):
    # If start/end/duration set, they come from SessionTimes
    status: SessionStatus
    remaining_seconds: int

# Session Extension and Status
class ExtendSessionIn(BaseModel):
    duration_seconds: int = 300  # Default 5 minutes
    request_id: Optional[str] = None  # For idempotency

class ExtendSessionOut(SessionTimes, SessionFinancials):
    remaining_seconds: int

class SessionStatusOut(SessionTimes, SessionFinancials):
    status: SessionStatus
    remaining_seconds: int

class FinalizeSessionOut(BaseModel):
    session_id: str
    minutes_used: float           # numeric
    cost_charged: MoneyStr
    refund_amount: MoneyStr
    wallet_balance: MoneyStr     # String representation of Decimal