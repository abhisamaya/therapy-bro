from __future__ import annotations
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from passlib.context import CryptContext
from jose import jwt, JWTError
from typing import Optional
import os
import logging

# Create logger for utilities
utils_logger = logging.getLogger('utils')

class PasswordContextFactory:
    """Factory for creating password context instances with lazy initialization."""
    
    _instance: Optional[CryptContext] = None
    
    @classmethod
    def create_context(cls) -> CryptContext:
        """Create or return existing password context instance."""
        if cls._instance is None:
            cls._instance = CryptContext(schemes=["argon2"], deprecated="auto")
        return cls._instance
    
    @classmethod
    def reset_instance(cls) -> None:
        """Reset the singleton instance (useful for testing)."""
        cls._instance = None


# Factory function for backward compatibility
def get_password_context() -> CryptContext:
    """Get the global password context instance."""
    return PasswordContextFactory.create_context()

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change")
JWT_ALG = os.getenv("JWT_ALG", "HS256")
JWT_EXPIRE_MIN = int(os.getenv("JWT_EXPIRE_MIN", "1440"))  # 24h

def now_ist() -> datetime:
    return datetime.now(ZoneInfo("Asia/Kolkata"))

def now_utc() -> datetime:
    """Get current UTC time (timezone-aware)"""
    return datetime.now(timezone.utc)

def hash_password(p: str) -> str:
    utils_logger.debug("Hashing password")
    pwd_context = get_password_context()
    hashed = pwd_context.hash(p)
    utils_logger.debug("Password hashed successfully")
    return hashed

def verify_password(p: str, h: str) -> bool:
    utils_logger.debug("Verifying password")
    pwd_context = get_password_context()
    is_valid = pwd_context.verify(p, h)
    utils_logger.debug(f"Password verification result: {is_valid}")
    return is_valid

def create_access_token(sub: str) -> str:
    utils_logger.info(f"Creating access token for user: {sub}")
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MIN)
    payload = {"sub": sub, "exp": expire}
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)
    utils_logger.info(f"Access token created successfully for user: {sub}")
    return token

def decode_token(token: str) -> Optional[str]:
    utils_logger.debug("Attempting to decode token")
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        sub = data.get("sub")
        utils_logger.debug(f"Token decoded successfully for user: {sub}")
        return sub
    except JWTError as e:
        utils_logger.warning(f"Token decode failed: {str(e)}")
        return None
