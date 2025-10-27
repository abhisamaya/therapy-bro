"""Phone verification router for TherapyBro backend."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

from app.auth import get_current_user
from app.models import User
from app.services.phone_verification_service import (
    start_phone_verification,
    verify_phone_otp,
    get_verification_status,
    resend_otp,
    PhoneVerificationError
)
from app.logging_config import get_logger

# Create logger for phone verification router
phone_verification_logger = get_logger('phone_verification_router')

# Create router
router = APIRouter(prefix="/api/phone-verification", tags=["phone-verification"])


# Request/Response Models
class SendOTPRequest(BaseModel):
    """Request model for sending OTP"""
    phone_number: str = Field(..., min_length=10, max_length=15,
                              description="Phone number with country code (e.g., +919876543210)")


class SendOTPResponse(BaseModel):
    """Response model for send OTP"""
    message: str
    expires_at: datetime
    session_active: bool = True


class VerifyOTPRequest(BaseModel):
    """Request model for verifying OTP"""
    otp_code: str = Field(..., min_length=4, max_length=6, description="OTP code received via SMS")


class VerifyOTPResponse(BaseModel):
    """Response model for OTP verification"""
    success: bool
    message: str
    phone_number: Optional[str] = None


class VerificationStatusResponse(BaseModel):
    """Response model for verification status"""
    has_active_session: bool
    phone_number: Optional[str]
    expires_at: Optional[str]
    attempts_remaining: int
    is_verified: bool
    verified_at: Optional[str]


@router.post("/send-otp", response_model=SendOTPResponse)
def send_otp(
    payload: SendOTPRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send OTP to phone number for verification.

    - Checks if email already has a verified phone number
    - Checks if phone number is already verified by another user
    - Sends OTP via SMS using 2Factor.in API
    """
    phone_verification_logger.info(f"OTP send request from user: {current_user.email} for phone: {payload.phone_number}")

    if not current_user.email:
        phone_verification_logger.warning(f"User {current_user.login_id} attempted phone verification without email")
        raise HTTPException(
            status_code=400,
            detail="Email address is required for phone verification. Please update your profile."
        )

    try:
        # Validate phone number has at least 10 digits
        import re
        digits_only = re.sub(r'[^\d]', '', payload.phone_number)
        if len(digits_only) < 10:
            phone_verification_logger.warning(f"Invalid phone number length for {current_user.email}: {payload.phone_number}")
            raise HTTPException(
                status_code=400,
                detail=f"Phone number must have at least 10 digits. You entered {len(digits_only)} digits."
            )

        if len(digits_only) > 15:
            phone_verification_logger.warning(f"Phone number too long for {current_user.email}: {payload.phone_number}")
            raise HTTPException(
                status_code=400,
                detail=f"Phone number cannot exceed 15 digits. You entered {len(digits_only)} digits."
            )

        session_id, expires_at = start_phone_verification(
            email=current_user.email,
            phone_number=payload.phone_number
        )

        phone_verification_logger.info(f"OTP sent successfully to {payload.phone_number} for {current_user.email}")

        return SendOTPResponse(
            message="OTP sent successfully to your phone number",
            expires_at=expires_at,
            session_active=True
        )

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except PhoneVerificationError as e:
        phone_verification_logger.error(f"Phone verification error for {current_user.email}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        phone_verification_logger.error(f"Unexpected error sending OTP: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to send OTP: {str(e)}")


@router.post("/verify-otp", response_model=VerifyOTPResponse)
def verify_otp(
    payload: VerifyOTPRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Verify OTP code entered by user.

    - Validates OTP against the active session
    - Marks phone number as verified in database
    - Maximum 3 attempts allowed
    - Session expires after 10 minutes
    """
    phone_verification_logger.info(f"OTP verification request from user: {current_user.email}")

    if not current_user.email:
        phone_verification_logger.warning(f"User {current_user.login_id} attempted OTP verification without email")
        raise HTTPException(
            status_code=400,
            detail="Email address is required for phone verification"
        )

    try:
        is_valid = verify_phone_otp(
            email=current_user.email,
            otp_code=payload.otp_code
        )

        if is_valid:
            phone_verification_logger.info(f"Phone number verified successfully for {current_user.email}")

            # Get the verified phone number from status
            status = get_verification_status(current_user.email)

            return VerifyOTPResponse(
                success=True,
                message="Phone number verified successfully",
                phone_number=status.get("phone_number")
            )
        else:
            phone_verification_logger.warning(f"Invalid OTP entered by {current_user.email}")
            return VerifyOTPResponse(
                success=False,
                message="Invalid OTP code. Please try again."
            )

    except PhoneVerificationError as e:
        phone_verification_logger.error(f"Phone verification error for {current_user.email}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        phone_verification_logger.error(f"Unexpected error verifying OTP: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to verify OTP. Please try again later.")


@router.get("/status", response_model=VerificationStatusResponse)
def get_status(current_user: User = Depends(get_current_user)):
    """
    Get current phone verification status for the user.

    Returns:
    - Active OTP session information (if any)
    - Database verification status
    - Remaining attempts
    """
    phone_verification_logger.info(f"Status request from user: {current_user.email}")

    if not current_user.email:
        phone_verification_logger.warning(f"User {current_user.login_id} attempted to check status without email")
        raise HTTPException(
            status_code=400,
            detail="Email address is required for phone verification"
        )

    try:
        status = get_verification_status(current_user.email)
        return VerificationStatusResponse(**status)

    except Exception as e:
        phone_verification_logger.error(f"Error getting verification status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get verification status")


@router.post("/resend-otp", response_model=SendOTPResponse)
def resend_otp_endpoint(current_user: User = Depends(get_current_user)):
    """
    Resend OTP to the phone number from active session.

    - Requires an active verification session
    - Creates a new OTP session with fresh expiry time
    - Previous OTP becomes invalid
    """
    phone_verification_logger.info(f"OTP resend request from user: {current_user.email}")

    if not current_user.email:
        phone_verification_logger.warning(f"User {current_user.login_id} attempted to resend OTP without email")
        raise HTTPException(
            status_code=400,
            detail="Email address is required for phone verification"
        )

    try:
        session_id, expires_at = resend_otp(current_user.email)

        phone_verification_logger.info(f"OTP resent successfully for {current_user.email}")

        return SendOTPResponse(
            message="OTP resent successfully",
            expires_at=expires_at,
            session_active=True
        )

    except PhoneVerificationError as e:
        phone_verification_logger.error(f"Error resending OTP for {current_user.email}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        phone_verification_logger.error(f"Unexpected error resending OTP: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to resend OTP. Please try again later.")
