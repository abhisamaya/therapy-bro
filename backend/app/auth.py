from __future__ import annotations
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .utils import decode_token
from .db import get_session
from .models import User

security = HTTPBearer()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> User:
    sub = decode_token(creds.credentials)
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token")
    with get_session() as db:
        user = db.query(User).filter(User.login_id == sub).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
