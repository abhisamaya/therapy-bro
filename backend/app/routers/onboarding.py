"""Onboarding router for TherapyBro backend."""
import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select

from app.db import get_session
from app.models import User, OnboardingResponse
from app.schemas import OnboardingResponseIn, OnboardingResponseOut
from app.auth import get_current_user
from app.utils import now_utc
from app.logging_config import get_logger

# Create logger
onboarding_logger = get_logger('onboarding')

# Create router
router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


@router.post("/submit", response_model=OnboardingResponseOut)
def submit_onboarding(
    payload: OnboardingResponseIn,
    user: User = Depends(get_current_user)
):
    """Submit or update onboarding responses."""
    onboarding_logger.info(f"Onboarding submission for user: {user.login_id}")

    with get_session() as session:
        # Update user's name if provided
        if payload.name and payload.name.strip():
            # Get user from session using get() method for proper attachment
            db_user = session.get(User, user.id)
            if db_user:
                db_user.name = payload.name.strip()
                session.add(db_user)
                session.commit()
                session.refresh(db_user)
                onboarding_logger.info(f"Updated user name to: {db_user.name}")

        # Check if user already has onboarding responses
        stmt = select(OnboardingResponse).where(OnboardingResponse.user_id == user.id)
        existing_response = session.exec(stmt).first()

        if existing_response:
            # Update existing response
            onboarding_logger.info(f"Updating existing onboarding for user_id: {user.id}")
            if payload.reasons is not None:
                existing_response.reasons = json.dumps(payload.reasons)
            if payload.mental_state is not None:
                existing_response.mental_state = payload.mental_state
            if payload.previous_therapy is not None:
                existing_response.previous_therapy = payload.previous_therapy
            if payload.goals is not None:
                existing_response.goals = json.dumps(payload.goals)
            if payload.referral_source is not None:
                existing_response.referral_source = payload.referral_source
            if payload.preferred_time is not None:
                existing_response.preferred_time = payload.preferred_time

            existing_response.completed = True
            existing_response.updated_at = now_utc()

            session.add(existing_response)
            session.commit()
            session.refresh(existing_response)

            response_data = existing_response
        else:
            # Create new response
            onboarding_logger.info(f"Creating new onboarding for user_id: {user.id}")
            new_response = OnboardingResponse(
                user_id=user.id,
                reasons=json.dumps(payload.reasons) if payload.reasons else None,
                mental_state=payload.mental_state,
                previous_therapy=payload.previous_therapy,
                goals=json.dumps(payload.goals) if payload.goals else None,
                referral_source=payload.referral_source,
                preferred_time=payload.preferred_time,
                completed=True,
                created_at=now_utc(),
                updated_at=now_utc()
            )

            session.add(new_response)
            session.commit()
            session.refresh(new_response)

            response_data = new_response

        # Parse JSON fields for response
        return OnboardingResponseOut(
            user_id=response_data.user_id,
            reasons=json.loads(response_data.reasons) if response_data.reasons else None,
            mental_state=response_data.mental_state,
            previous_therapy=response_data.previous_therapy,
            goals=json.loads(response_data.goals) if response_data.goals else None,
            referral_source=response_data.referral_source,
            preferred_time=response_data.preferred_time,
            completed=response_data.completed,
            created_at=response_data.created_at
        )


@router.get("/status", response_model=OnboardingResponseOut)
def get_onboarding_status(user: User = Depends(get_current_user)):
    """Get user's onboarding status."""
    onboarding_logger.info(f"Fetching onboarding status for user: {user.login_id}")

    with get_session() as session:
        stmt = select(OnboardingResponse).where(OnboardingResponse.user_id == user.id)
        response = session.exec(stmt).first()

        if not response:
            raise HTTPException(status_code=404, detail="Onboarding not found")

        return OnboardingResponseOut(
            user_id=response.user_id,
            reasons=json.loads(response.reasons) if response.reasons else None,
            mental_state=response.mental_state,
            previous_therapy=response.previous_therapy,
            goals=json.loads(response.goals) if response.goals else None,
            referral_source=response.referral_source,
            preferred_time=response.preferred_time,
            completed=response.completed,
            created_at=response.created_at
        )
