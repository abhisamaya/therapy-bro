from jose import jwt, JWTError
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from datetime import datetime, timedelta
from .config import settings


ALGO = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def verify_jwt(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGO])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(login_id: str, expires_delta: timedelta = None) -> str:
    """Create a JWT access token"""
    if expires_delta is None:
        expires_delta = timedelta(days=7)  # 7 days default

    expire = datetime.utcnow() + expires_delta
    to_encode = {
        "sub": login_id,
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=ALGO)
    return encoded_jwt


async def get_current_listener(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Dependency to get current authenticated listener from JWT token"""
    token = credentials.credentials
    payload = verify_jwt(token)
    return payload