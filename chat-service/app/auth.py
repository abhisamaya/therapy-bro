from jose import jwt, JWTError
from fastapi import HTTPException
from .config import settings


ALGO = "HS256"


def verify_jwt(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGO])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")