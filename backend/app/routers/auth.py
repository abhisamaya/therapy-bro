"""Authentication router for TherapyBro backend."""
import os
import logging
from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from app.db import get_session
from app.models import User
from app.schemas import (
    RegisterIn, LoginIn, TokenOut, UpdateProfileIn, GoogleAuthIn, UserOut
)
from app.utils import now_ist, create_access_token, JWT_EXPIRE_MIN
from app.auth import get_current_user
from app.google_auth import GoogleAuthServiceFactory
from app.dependencies import get_user_service
from app.services.user_service import UserService
from app.logging_config import get_logger
from app.exceptions import ValidationError

# Create logger for auth router
auth_router_logger = get_logger('auth_router')

# Create router
router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=TokenOut)
def register(payload: RegisterIn, user_service: UserService = Depends(get_user_service)):
    """Register a new user."""
    auth_router_logger.info(f"Registration attempt for login_id: {payload.login_id}")
    
    user = user_service.create_user(payload)
    token = create_access_token(payload.login_id)
    auth_router_logger.info(f"Registration completed successfully for: {payload.login_id}")
    return TokenOut(access_token=token)


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, user_service: UserService = Depends(get_user_service)):
    """Login with email/password."""
    auth_router_logger.info(f"Login attempt for login_id: {payload.login_id}")
    
    user = user_service.authenticate_user(payload.login_id, payload.password)
    token = create_access_token(payload.login_id)
    auth_router_logger.info(f"Login successful for: {payload.login_id}")
    return TokenOut(access_token=token)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user), user_service: UserService = Depends(get_user_service)):
    """Get current user profile."""
    return user_service.get_user_profile(user)


@router.put("/profile")
def update_profile(payload: UpdateProfileIn, user: User = Depends(get_current_user), user_service: UserService = Depends(get_user_service)):
    """Update user profile."""
    auth_router_logger.info(f"Profile update request for user: {user.login_id}")
    auth_router_logger.debug(f"Payload: name={payload.name}, phone={payload.phone}, age={payload.age}")

    try:
        updated_user = user_service.update_user_profile(user.id, payload)

        return {
            "ok": True,
            "user": {
                "login_id": updated_user.login_id,
                "name": updated_user.name,
                "email": updated_user.email,
                "avatar_url": updated_user.avatar_url,
                "auth_provider": updated_user.auth_provider,
                "phone": updated_user.phone,
                "age": updated_user.age
            }
        }
    except ValidationError as e:
        auth_router_logger.warning(f"Validation error updating profile: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        auth_router_logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        auth_router_logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")


@router.post("/google", response_model=TokenOut)
def google_auth(payload: GoogleAuthIn, response: Response, user_service: UserService = Depends(get_user_service)):
    """Authenticate with Google OAuth."""
    login_logger = logging.getLogger('login_debug')
    login_logger.info("="*60)
    login_logger.info("=== FASTAPI BACKEND: /auth/google ===")
    login_logger.info("="*60)
    login_logger.info(f"🔵 Timestamp: {now_ist()}")
    login_logger.info(f"📦 Received id_token length: {len(payload.id_token)}")
    login_logger.debug(f"📦 ID Token preview: {payload.id_token[:50]}...")

    # Verify Google token
    login_logger.info("🔍 Verifying Google token with Google API...")
    google_auth_service = GoogleAuthServiceFactory.create_service()
    google_user_info = google_auth_service.verify_google_token(payload.id_token)

    if not google_user_info:
        login_logger.error("❌ Google token verification FAILED")
        raise HTTPException(status_code=400, detail="Invalid Google token")

    login_logger.info("✅ Google token verified successfully!")
    login_logger.info(f"📋 Google user info received: {google_user_info}")

    if not google_user_info['email_verified']:
        login_logger.error("❌ Email not verified by Google")
        raise HTTPException(status_code=400, detail="Google email not verified")

    login_logger.info("✅ Email is verified")

    login_logger.info("--- DATABASE OPERATIONS ---")
    
    # Check if user exists by Google ID
    login_logger.info(f"🔍 Checking if user exists by Google ID: {google_user_info['google_id']}")
    user = user_service.find_by_google_id(google_user_info['google_id'])

    if user:
        login_logger.info(f"✅ Found existing user by Google ID: {user.login_id}")
    else:
        login_logger.info("⚠️ No user found with this Google ID")

        # Check if user exists by email (for account linking)
        login_logger.info(f"🔍 Checking if user exists by email: {google_user_info['email']}")
        user = user_service.find_by_email(google_user_info['email'])

        if user:
            login_logger.info(f"✅ Found existing user by email: {user.login_id}")
            login_logger.info("🔗 Linking Google account to existing user...")

            # Link Google account to existing user
            user = user_service.link_google_account(user, google_user_info)
            login_logger.info(f"✅ Updated user: login_id={user.login_id}, google_id={user.google_id}, name={user.name}")
        else:
            login_logger.info("⚠️ No existing user found, creating new user...")

            # Create new user
            user = user_service.create_google_user(google_user_info)
            login_logger.info(f"✅ Created new user: login_id={user.login_id}, google_id={user.google_id}, name={user.name}")

        login_logger.info(f"✅ User ID: {user.id}")

    login_logger.info("--- TOKEN GENERATION ---")
    # Create token using login_id (which is email for Google users)
    login_logger.info(f"🔑 Creating access token for login_id: {user.login_id}")
    token = create_access_token(user.login_id)
    login_logger.info(f"✅ Token created (length: {len(token)})")
    login_logger.debug(f"🔑 Token preview: {token[:30]}...")

    login_logger.info("--- COOKIE SETUP ---")
    login_logger.info(f"🍪 Setting HTTP-only cookie with max_age={JWT_EXPIRE_MIN * 60} seconds")

    # Determine if we're in production (HTTPS) or development (HTTP)
    is_production = os.getenv("FRONTEND_ORIGIN", "").startswith("https://")

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=is_production,  # True for HTTPS (production), False for HTTP (development)
        samesite="lax",
        max_age=JWT_EXPIRE_MIN * 60  # Convert minutes to seconds
    )
    login_logger.info(f"✅ Cookie set successfully (secure={is_production})")

    login_logger.info("--- FINAL USER STATE IN DB ---")
    login_logger.info(f"User ID: {user.id}")
    login_logger.info(f"Login ID: {user.login_id}")
    login_logger.info(f"Name: {user.name}")
    login_logger.info(f"Email: {user.email}")
    login_logger.info(f"Google ID: {user.google_id}")
    login_logger.info(f"Avatar URL: {user.avatar_url}")
    login_logger.info(f"Auth Provider: {user.auth_provider}")
    login_logger.info(f"Created At: {user.created_at}")

    login_logger.info("✅ GOOGLE AUTH COMPLETED SUCCESSFULLY")
    login_logger.info("="*60)

    return TokenOut(access_token=token)


@router.post("/logout")
def logout(response: Response):
    """Logout user by clearing the access token cookie."""
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}
