from __future__ import annotations
from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from decimal import Decimal

from sqlmodel import SQLModel, Field, Column, Relationship
from sqlalchemy import Numeric, String, JSON

import secrets

# ---------- existing models (small updates) ----------

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    login_id: str = Field(index=True, unique=True)
    password_hash: Optional[str] = Field(default=None)
    name: Optional[str] = None
    phone: Optional[str] = Field(default=None, unique=True)     
    date_of_birth: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Google OAuth
    google_id: Optional[str] = Field(default=None, index=True, unique=True)
    email: Optional[str] = Field(default=None, index=True, unique=True)  # Unique email
    avatar_url: Optional[str] = None
    auth_provider: str = Field(default="local")

# backend/app/models.py
class ChatSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(index=True, unique=True)
    user_id: int = Field(index=True)
    peer_id: Optional[int] = Field(default=None)  # who they chat with
    category: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    minutes_used: Decimal = Field(
        sa_column=Column(Numeric(10, 4), default=0), default=Decimal("0")
    )
    # Server-enforced timer fields (Phase 2)
    session_start_time: Optional[datetime] = Field(default=None)
    session_end_time: Optional[datetime] = Field(default=None)
    duration_seconds: Optional[int] = Field(default=None)
    status: str = Field(default="ended")  # active | ended


class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(index=True)
    role: str  # system | user | assistant
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------- new wallet/payment models ----------

class Wallet(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, unique=True)
    # Use high precision numeric
    balance: Decimal = Field(
        sa_column=Column(Numeric(18, 4), nullable=False, default=0),
        default=Decimal("0.0000"),
    )
    reserved: Decimal = Field(
        sa_column=Column(Numeric(18, 4), nullable=False, default=0),
        default=Decimal("0.0000"),
    )
    currency: str = Field(
        default="INR", sa_column=Column(String(length=3), nullable=False)
    )
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WalletTransaction(SQLModel, table=True):
    """
    Immutable ledger of every change. amount: positive for credits, negative for debits.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    wallet_id: int = Field(index=True)
    user_id: int = Field(index=True)
    type: str = Field(
        default="unknown"
    )  # 'topup', 'reserved', 'release', 'charge', 'refund', 'fee', 'adjustment'
    amount: Decimal = Field(sa_column=Column(Numeric(18, 4), nullable=False))
    balance_after: Decimal = Field(sa_column=Column(Numeric(18, 4), nullable=False))
    reference_id: Optional[str] = None  # session_id / payment_id / provider id
    meta: Optional[Dict[str, Any]] = Field(
        sa_column=Column(JSON), default=None
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SessionCharge(SQLModel, table=True):
    """
    Track reserved/charged blocks for a chat session.
    reserved_amount = amount reserved at continue_request time
    minutes_requested = minutes the user requested to continue for (could be fractional)
    minutes_consumed = minutes actually used so far
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(index=True)
    wallet_id: int = Field(index=True)
    reserved_amount: Decimal = Field(sa_column=Column(Numeric(18, 4), nullable=False))
    charged_amount: Decimal = Field(sa_column=Column(Numeric(18, 4), nullable=False), default=Decimal("0.0000"))
    unit_price: Decimal = Field(sa_column=Column(Numeric(18, 8), nullable=False))  # price per minute
    minutes_requested: Decimal = Field(sa_column=Column(Numeric(10, 4), nullable=False))
    minutes_consumed: Decimal = Field(sa_column=Column(Numeric(10, 4), nullable=False), default=Decimal("0.0000"))
    request_id: Optional[str] = Field(default=None)  # idempotency key from client
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Payment(SQLModel, table=True):
    """
    External provider payment intent/record. Updated by webhook handlers.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    wallet_id: Optional[int] = Field(default=None, index=True)
    provider: Optional[str] = None  # e.g., 'razorpay', 'stripe'
    provider_payment_id: Optional[str] = Field(default=None, index=True)
    amount: Decimal = Field(sa_column=Column(Numeric(18, 4), nullable=False))
    currency: str = Field(sa_column=Column(String(length=3), nullable=False), default="INR")
    status: str = Field(default="created")  # created | pending | succeeded | failed | refunded
    idempotency_key: Optional[str] = None
    meta: Optional[Dict[str, Any]] = Field(sa_column=Column(JSON), default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------- memory models ----------

class MemoryChunk(SQLModel, table=True):
    """
    Stores metadata about vectorized memory chunks.
    The actual vector embeddings are stored in ChromaDB.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    chunk_id: str = Field(index=True, unique=True)  # UUID for ChromaDB reference
    user_id: int = Field(index=True)
    session_id: str = Field(index=True)
    chunk_text: str  # The actual text stored in vector DB
    message_ids: str  # JSON array of message IDs in this chunk
    chunk_type: str  # "conversation" | "session_summary"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    meta: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))


class PasswordResetToken(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    otp: str
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(minutes=10))
    verified: bool = Field(default=False)


class PhoneVerification(SQLModel, table=True):
    """
    Phone verification table - stores verified phone numbers linked to email addresses.
    One phone number per email address.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)  # Primary key - one entry per email
    phone_number: str = Field(index=True, unique=True)  # One phone per email, unique across table
    verified: bool = Field(default=False)
    verified_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))




class PasswordResetToken(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    otp: str
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(minutes=10))
    verified: bool = Field(default=False)


class PhoneVerification(SQLModel, table=True):
    """
    Phone verification table - stores verified phone numbers linked to email addresses.
    One phone number per email address.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)  # Primary key - one entry per email
    phone_number: str = Field(index=True, unique=True)  # One phone per email, unique across table
    verified: bool = Field(default=False)
    verified_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))