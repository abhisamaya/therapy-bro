from __future__ import annotations
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import logging
from .utils import decode_token
from .db import get_session
from .models import User
from sqlalchemy import select

# Create logger for authentication
auth_logger = logging.getLogger('auth')

security = HTTPBearer(auto_error=False)  # Don't auto-error for OPTIONS requests

def get_current_user(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> User:
    # Allow OPTIONS requests without authentication (for CORS preflight)
    if request.method == "OPTIONS":
        auth_logger.debug(f"OPTIONS request allowed without authentication: {request.url}")
        return None

    if not creds:
        auth_logger.warning(f"Missing authentication for request: {request.method} {request.url}")
        raise HTTPException(status_code=401, detail="Missing authentication")

    auth_logger.debug(f"Attempting authentication for request: {request.method} {request.url}")
    
    sub = decode_token(creds.credentials)
    if not sub:
        auth_logger.warning(f"Invalid token provided for request: {request.method} {request.url}")
        raise HTTPException(status_code=401, detail="Invalid token")

    with get_session() as db:
        user = db.exec(select(User).where(User.login_id == sub)).scalar_one_or_none()
        if not user:
            auth_logger.warning(f"User not found for login_id: {sub}")
            raise HTTPException(status_code=401, detail="User not found")
        
        auth_logger.info(f"User authenticated successfully: {user.login_id} (ID: {user.id})")
        return user
