"""Dependency injection for TherapyBro backend."""
from typing import Generator
from sqlalchemy.orm import Session
from fastapi import Depends

from app.db import get_session
from app.services.user_service import UserService
from app.services.session_service import SessionService
from app.services.wallet_service import WalletService
from app.services.message_service import MessageService
from app.repositories.user_repository import UserRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.message_repository import MessageRepository
from app.repositories.wallet_repository import WalletRepository, TransactionRepository


def get_db_session() -> Generator[Session, None, None]:
    """Get database session dependency."""
    with get_session() as db:
        yield db


def get_user_repository(db: Session = Depends(get_db_session)) -> UserRepository:
    """Get UserRepository dependency."""
    return UserRepository(db)


def get_session_repository(db: Session = Depends(get_db_session)) -> SessionRepository:
    """Get SessionRepository dependency."""
    return SessionRepository(db)


def get_message_repository(db: Session = Depends(get_db_session)) -> MessageRepository:
    """Get MessageRepository dependency."""
    return MessageRepository(db)


def get_wallet_repository(db: Session = Depends(get_db_session)) -> WalletRepository:
    """Get WalletRepository dependency."""
    return WalletRepository(db)


def get_transaction_repository(db: Session = Depends(get_db_session)) -> TransactionRepository:
    """Get TransactionRepository dependency."""
    return TransactionRepository(db)


def get_user_service(db: Session = Depends(get_db_session)) -> UserService:
    """Get UserService dependency."""
    return UserService(db)


def get_session_service(db: Session = Depends(get_db_session)) -> SessionService:
    """Get SessionService dependency."""
    return SessionService(db)


def get_wallet_service(db: Session = Depends(get_db_session)) -> WalletService:
    """Get WalletService dependency."""
    return WalletService(db)


def get_message_service(db: Session = Depends(get_db_session)) -> MessageService:
    """Get MessageService dependency."""
    return MessageService(db)
