from __future__ import annotations
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from .utils import decode_token
from .db import get_session
from .models import User

security = HTTPBearer(auto_error=False)  # Don't auto-error for OPTIONS requests

def get_current_user(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> User:
    # Allow OPTIONS requests without authentication (for CORS preflight)
    if request.method == "OPTIONS":
        return None

    if not creds:
        raise HTTPException(status_code=401, detail="Missing authentication")

    sub = decode_token(creds.credentials)
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token")

    with get_session() as db:
        user = db.query(User).filter(User.login_id == sub).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
