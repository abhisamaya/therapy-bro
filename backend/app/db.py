from __future__ import annotations
from contextlib import contextmanager
from typing import Iterator
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import QueuePool
import os

# Import all models so SQLModel knows about them
from app.models import User, ChatSession, Message, Wallet, WalletTransaction, SessionCharge, Payment, PasswordResetToken, PhoneVerification

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./chat.db")

# Configure connection pooling
# For SQLite, pool settings are largely no-ops but safe; for Postgres/MySQL they apply.
POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "5"))
MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "10"))
POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))  # seconds
POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "1800"))  # seconds

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    poolclass=QueuePool,
    pool_size=POOL_SIZE,
    max_overflow=MAX_OVERFLOW,
    pool_timeout=POOL_TIMEOUT,
    pool_recycle=POOL_RECYCLE,
)

def init_db() -> None:
    SQLModel.metadata.create_all(engine)

@contextmanager
def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session