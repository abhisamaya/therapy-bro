"""
Phone Verification Service

This module handles phone number verification using OTP (One-Time Password)
via the 2Factor.in API. It provides functions to send and verify OTPs for
phone number authentication.

The service uses a separate PhoneVerification table with email as the key.
- One phone number per email address
- Each phone number can only be verified once across all users
- Appropriate error messages for duplicate attempts
"""

import os
import requests
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple, Dict
from sqlmodel import Session, select

from app.models import PhoneVerification
from app.db import get_session


class PhoneVerificationError(Exception):
    """Custom exception for phone verification errors"""
    pass


class OTPService:
    """
    Service class for OTP operations using 2Factor.in API
    """

    def __init__(self):
        self.api_key = os.getenv("TWO_FACTOR_API_KEY")
        if not self.api_key:
            raise PhoneVerificationError("TWO_FACTOR_API_KEY not configured in environment variables")

        self.template_name = os.getenv("TWO_FACTOR_TEMPLATE_NAME", "First+Template")
        self.send_otp_url = "https://2factor.in/API/V1/{api_key}/SMS/{phone_number}/AUTOGEN3/{template_id}"
        self.verify_otp_url = "https://2factor.in/API/V1/{api_key}/SMS/VERIFY/{session_id}/{otp}"

    def send_otp(self, phone_number: str) -> str:
        """
        Send an OTP to the given phone number.

        Args:
            phone_number: Phone number with country code (e.g., +919876543210)

        Returns:
            session_id: Unique identifier for this OTP session

        Raises:
            PhoneVerificationError: If sending OTP fails
        """
        # Remove any spaces or special characters except +
        phone_number = phone_number.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")

        # Validate phone number format - must have exactly 10 digits (without country code) or 12-13 with country code
        import re
        # Extract only digits (excluding the + sign)
        digits_only = re.sub(r'[^\d]', '', phone_number)

        if len(digits_only) < 10:
            raise PhoneVerificationError("Phone number must have at least 10 digits")

        if len(digits_only) > 15:
            raise PhoneVerificationError("Phone number cannot exceed 15 digits")

        if not phone_number:
            raise PhoneVerificationError("Phone number is required")

        url = self.send_otp_url.format(
            api_key=self.api_key,
            phone_number=phone_number,
            template_id=self.template_name
        )

        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()

            if data.get("Status") != "Success":
                error_msg = data.get("Details", "Unknown error")
                raise PhoneVerificationError(f"Failed to send OTP: {error_msg}")

            session_id = data.get("Details")
            if not session_id:
                raise PhoneVerificationError("No session ID returned from OTP service")

            return session_id

        except requests.RequestException as e:
            raise PhoneVerificationError(f"Network error sending OTP: {str(e)}")
        except Exception as e:
            raise PhoneVerificationError(f"Error sending OTP: {str(e)}")

    def verify_otp(self, session_id: str, user_otp: str) -> bool:
        """
        Verify the OTP entered by user using the session_id.

        Args:
            session_id: Session ID returned when OTP was sent
            user_otp: OTP code entered by the user

        Returns:
            True if verification succeeds, False otherwise

        Raises:
            PhoneVerificationError: If verification request fails
        """
        if not session_id or not user_otp:
            raise PhoneVerificationError("Session ID and OTP are required")

        # Clean OTP input (remove spaces, ensure digits only)
        user_otp = user_otp.strip().replace(" ", "")
        if not user_otp.isdigit():
            return False

        url = self.verify_otp_url.format(
            api_key=self.api_key,
            session_id=session_id,
            otp=user_otp
        )

        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()

            return data.get("Status") == "Success"

        except requests.RequestException as e:
            raise PhoneVerificationError(f"Network error verifying OTP: {str(e)}")
        except Exception as e:
            raise PhoneVerificationError(f"Error verifying OTP: {str(e)}")


# In-memory session storage (for simplicity; consider Redis for production)
_otp_sessions = {}


class PhoneVerificationSession:
    """Manages phone verification sessions"""

    def __init__(self, email: str, phone_number: str, session_id: str):
        self.email = email
        self.phone_number = phone_number
        self.session_id = session_id
        self.created_at = datetime.now(timezone.utc)
        self.expires_at = self.created_at + timedelta(minutes=10)
        self.attempts = 0
        self.max_attempts = 3

    def is_expired(self) -> bool:
        return datetime.now(timezone.utc) > self.expires_at

    def can_attempt(self) -> bool:
        return self.attempts < self.max_attempts and not self.is_expired()


def check_phone_duplicacy(email: str, phone_number: str) -> Dict[str, any]:
    """
    Check if email or phone number already exists in verification table.

    Args:
        email: Email address to check
        phone_number: Phone number to check

    Returns:
        Dictionary with duplicacy status and messages
    """
    with get_session() as db:
        # Check if email already has a verified phone
        existing_email = db.exec(
            select(PhoneVerification).where(PhoneVerification.email == email)
        ).first()

        # Check if phone number is already verified by another email
        existing_phone = db.exec(
            select(PhoneVerification).where(PhoneVerification.phone_number == phone_number)
        ).first()

        result = {
            "can_proceed": True,
            "email_exists": False,
            "phone_exists": False,
            "message": None
        }

        if existing_email and existing_email.verified:
            result["can_proceed"] = False
            result["email_exists"] = True
            result["message"] = f"This email is already verified with phone number: {existing_email.phone_number}"
            return result

        if existing_phone and existing_phone.verified:
            result["can_proceed"] = False
            result["phone_exists"] = True
            result["message"] = f"This phone number is already verified with another email address"
            return result

        # Check if there's an unverified entry for this email with a different phone
        if existing_email and not existing_email.verified and existing_email.phone_number != phone_number:
            result["message"] = "Previous verification attempt found. Starting new verification."

        return result


def start_phone_verification(email: str, phone_number: str) -> Tuple[str, datetime]:
    """
    Start phone verification process by sending OTP.

    Args:
        email: Email address of the user
        phone_number: Phone number to verify

    Returns:
        Tuple of (session_id, expires_at)

    Raises:
        PhoneVerificationError: If verification cannot be started
    """
    # Check for duplicacy
    duplicacy_check = check_phone_duplicacy(email, phone_number)

    if not duplicacy_check["can_proceed"]:
        raise PhoneVerificationError(duplicacy_check["message"])

    otp_service = OTPService()

    # Send OTP
    session_id = otp_service.send_otp(phone_number)

    # Create verification session
    verification_session = PhoneVerificationSession(email, phone_number, session_id)

    # Store session (use email as key for easy lookup)
    _otp_sessions[email] = verification_session

    # Create or update PhoneVerification record in database (unverified state)
    with get_session() as db:
        existing = db.exec(
            select(PhoneVerification).where(PhoneVerification.email == email)
        ).first()

        if existing:
            # Update existing unverified record
            existing.phone_number = phone_number
            existing.verified = False
            existing.updated_at = datetime.now(timezone.utc)
            db.add(existing)
        else:
            # Create new record
            phone_verification = PhoneVerification(
                email=email,
                phone_number=phone_number,
                verified=False
            )
            db.add(phone_verification)

        db.commit()

    return session_id, verification_session.expires_at


def verify_phone_otp(email: str, otp_code: str) -> bool:
    """
    Verify OTP code for phone verification.

    Args:
        email: Email address of the user
        otp_code: OTP code entered by user

    Returns:
        True if verification succeeds

    Raises:
        PhoneVerificationError: If verification fails or session invalid
    """
    # Get verification session
    verification_session = _otp_sessions.get(email)

    if not verification_session:
        raise PhoneVerificationError("No active verification session found")

    if verification_session.is_expired():
        del _otp_sessions[email]
        raise PhoneVerificationError("Verification session expired. Please request a new OTP.")

    if not verification_session.can_attempt():
        del _otp_sessions[email]
        raise PhoneVerificationError("Maximum verification attempts exceeded")

    # Increment attempt counter
    verification_session.attempts += 1

    # Verify OTP
    otp_service = OTPService()
    is_valid = otp_service.verify_otp(verification_session.session_id, otp_code)

    if is_valid:
        # Clean up session on success
        del _otp_sessions[email]

        # Update phone verification status in database
        with get_session() as db:
            phone_verification = db.exec(
                select(PhoneVerification).where(PhoneVerification.email == email)
            ).first()

            if phone_verification:
                phone_verification.verified = True
                phone_verification.verified_at = datetime.now(timezone.utc)
                phone_verification.updated_at = datetime.now(timezone.utc)
                db.add(phone_verification)
                db.commit()

        return True

    return False


def get_verification_status(email: str) -> dict:
    """
    Get current verification session status and database status for an email.

    Args:
        email: Email address of the user

    Returns:
        Dictionary with session status information
    """
    # Check database for existing verification
    with get_session() as db:
        phone_verification = db.exec(
            select(PhoneVerification).where(PhoneVerification.email == email)
        ).first()

        db_status = {
            "is_verified": False,
            "phone_number": None,
            "verified_at": None
        }

        if phone_verification:
            db_status["is_verified"] = phone_verification.verified
            db_status["phone_number"] = phone_verification.phone_number
            db_status["verified_at"] = phone_verification.verified_at.isoformat() if phone_verification.verified_at else None

    # Check active OTP session
    verification_session = _otp_sessions.get(email)

    if not verification_session:
        return {
            "has_active_session": False,
            "phone_number": None,
            "expires_at": None,
            "attempts_remaining": 0,
            **db_status
        }

    return {
        "has_active_session": not verification_session.is_expired(),
        "phone_number": verification_session.phone_number,
        "expires_at": verification_session.expires_at.isoformat(),
        "attempts_remaining": verification_session.max_attempts - verification_session.attempts,
        **db_status
    }


def resend_otp(email: str) -> Tuple[str, datetime]:
    """
    Resend OTP to user's phone number.

    Args:
        email: Email address of the user

    Returns:
        Tuple of (new_session_id, expires_at)

    Raises:
        PhoneVerificationError: If no active session or resend fails
    """
    # Get existing verification session
    verification_session = _otp_sessions.get(email)

    if not verification_session:
        raise PhoneVerificationError("No active verification session found")

    phone_number = verification_session.phone_number
    email_addr = verification_session.email

    # Clear old session and start new one
    del _otp_sessions[email]

    return start_phone_verification(email_addr, phone_number)
