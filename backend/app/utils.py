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

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change")
JWT_ALG = os.getenv("JWT_ALG", "HS256")
JWT_EXPIRE_MIN = int(os.getenv("JWT_EXPIRE_MIN", "1440"))  # 24h

def now_ist() -> datetime:
    return datetime.now(ZoneInfo("Asia/Kolkata"))

def hash_password(p: str) -> str:
    utils_logger.debug("Hashing password")
    hashed = pwd_context.hash(p)
    utils_logger.debug("Password hashed successfully")
    return hashed

def verify_password(p: str, h: str) -> bool:
    utils_logger.debug("Verifying password")
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
