"""Feedback router for TherapyBro backend."""
import json
from fastapi import APIRouter, HTTPException, Depends

from app.db import get_session
from app.models import User, Feedback
from app.schemas import FeedbackIn, FeedbackOut
from app.auth import get_current_user
from app.utils import now_utc
from app.logging_config import get_logger

# Create logger
feedback_logger = get_logger('feedback')

# Create router
router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("/submit", response_model=FeedbackOut)
def submit_feedback(
    payload: FeedbackIn,
    user: User = Depends(get_current_user)
):
    """Submit feedback for a chat session."""
    feedback_logger.info(f"Feedback submission for user: {user.login_id}, session: {payload.session_id}")

    # Validate rating
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    with get_session() as session:
        # Create new feedback
        new_feedback = Feedback(
            user_id=user.id,
            session_id=payload.session_id,
            rating=payload.rating,
            tags=json.dumps(payload.tags) if payload.tags else None,
            comment=payload.comment,
            created_at=now_utc()
        )

        session.add(new_feedback)
        session.commit()
        session.refresh(new_feedback)

        feedback_logger.info(f"Feedback created with ID: {new_feedback.id}")

        # Return response
        return FeedbackOut(
            id=new_feedback.id,
            user_id=new_feedback.user_id,
            session_id=new_feedback.session_id,
            rating=new_feedback.rating,
            tags=json.loads(new_feedback.tags) if new_feedback.tags else None,
            comment=new_feedback.comment,
            created_at=new_feedback.created_at
        )
