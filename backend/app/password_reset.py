"""
Password reset endpoints with OTP verification.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlmodel import select
from datetime import datetime, timezone
from typing import Optional

from .models import User, PasswordResetToken
from .db import get_session
from .email_service import generate_otp, send_otp_email
from .utils import hash_password


router = APIRouter(prefix="/api/password-reset", tags=["password-reset"])


class RequestOTPRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


class OTPResponse(BaseModel):
    message: str
    email: str


class VerifyOTPResponse(BaseModel):
    message: str
    verified: bool


class ResetPasswordResponse(BaseModel):
    message: str
    success: bool


@router.post("/request-otp", response_model=OTPResponse)
def request_otp(req: RequestOTPRequest):
    """
    Step 1: Request OTP for password reset.
    Sends OTP to user's email if the email exists in the system.
    """
    print("=" * 80)
    print("🔵 PASSWORD RESET: Request OTP endpoint called")
    print(f"📧 Email received: {req.email}")
    print("=" * 80)

    with get_session() as session:
        # Find user by email
        statement = select(User).where(User.email == req.email)
        user = session.exec(statement).first()

        print(f"🔍 Database query executed for email: {req.email}")
        print(f"👤 User found: {user is not None}")
        if user:
            print(f"   - User ID: {user.id}")
            print(f"   - Login ID: {user.login_id}")
            print(f"   - Auth Provider: {user.auth_provider}")

        if not user:
            # Don't reveal if email exists or not for security
            print("❌ User not found in database")
            raise HTTPException(
                status_code=404,
                detail="If this email exists in our system, an OTP has been sent."
            )

        # Check if user is using local auth (not Google OAuth)
        if user.auth_provider != "local":
            print(f"⚠️  User uses {user.auth_provider} auth, not local")
            raise HTTPException(
                status_code=400,
                detail="This account uses Google authentication. Please login with Google."
            )

        # Generate OTP
        otp = generate_otp()
        print(f"🔑 Generated OTP: {otp}")

        # Delete any existing unused OTP for this user
        statement = select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.verified == False
        )
        existing_tokens = session.exec(statement).all()
        print(f"🗑️  Deleting {len(existing_tokens)} existing unused tokens")
        for token in existing_tokens:
            session.delete(token)

        # Create new OTP token
        reset_token = PasswordResetToken(
            user_id=user.id,
            otp=otp,
            verified=False
        )
        session.add(reset_token)
        session.commit()
        print("✅ New OTP token saved to database")

        # Send OTP email
        print(f"📨 Attempting to send OTP email to {req.email}")
        email_sent = send_otp_email(req.email, otp)

        if not email_sent:
            print("❌ Failed to send OTP email")
            raise HTTPException(
                status_code=500,
                detail="Failed to send OTP email. Please try again later."
            )

        print("✅ OTP email sent successfully")
        print("=" * 80)
        return OTPResponse(
            message="OTP sent successfully to your email",
            email=req.email
        )


@router.post("/verify-otp", response_model=VerifyOTPResponse)
def verify_otp(req: VerifyOTPRequest):
    """
    Step 2: Verify OTP provided by user.
    This doesn't reset the password yet, just validates the OTP.
    """
    with get_session() as session:
        # Find user by email
        statement = select(User).where(User.email == req.email)
        user = session.exec(statement).first()

        if not user:
            raise HTTPException(status_code=400, detail="Invalid email or OTP")

        # Find valid OTP token
        statement = select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.otp == req.otp,
            PasswordResetToken.verified == False,
            PasswordResetToken.expires_at > datetime.now(timezone.utc)
        )
        token = session.exec(statement).first()

        if not token:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired OTP"
            )

        # Mark token as verified (but don't delete it yet)
        token.verified = True
        session.add(token)
        session.commit()

        return VerifyOTPResponse(
            message="OTP verified successfully",
            verified=True
        )


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(req: ResetPasswordRequest):
    """
    Step 3: Reset password using verified OTP.
    User must provide email, OTP, and new password.
    """
    with get_session() as session:
        # Find user by email
        statement = select(User).where(User.email == req.email)
        user = session.exec(statement).first()

        if not user:
            raise HTTPException(status_code=400, detail="Invalid email or OTP")

        # Find verified OTP token
        statement = select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.otp == req.otp,
            PasswordResetToken.verified == True,
            PasswordResetToken.expires_at > datetime.now(timezone.utc)
        )
        token = session.exec(statement).first()

        if not token:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired OTP. Please request a new one."
            )

        # Validate password strength
        if len(req.new_password) < 6:
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 6 characters long"
            )

        # Update user password
        user.password_hash = hash_password(req.new_password)
        session.add(user)

        # Delete all reset tokens for this user
        statement = select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id
        )
        tokens = session.exec(statement).all()
        for t in tokens:
            session.delete(t)

        session.commit()

        return ResetPasswordResponse(
            message="Password reset successfully. You can now login with your new password.",
            success=True
        )
