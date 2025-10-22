from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlmodel import Session

from app.models import ChatSession
from app.db import get_session


def test_chat_session_timing_fields(db_session):
    now = datetime.now(timezone.utc)
    later = now + timedelta(minutes=5)

    s = ChatSession(
        session_id="test-session-123",
        user_id=1,
        category="TherapyBro",
        created_at=now,
        updated_at=now,
        minutes_used=Decimal("0"),
        session_start_time=now,
        session_end_time=later,
        duration_seconds=300,
        status="active",
    )

    db: Session = db_session
    db.add(s)
    db.commit()
    db.refresh(s)

    assert s.id is not None
    # SQLite stores naive datetimes by default; compare without tzinfo
    assert s.session_start_time.replace(tzinfo=timezone.utc) == now
    assert s.session_end_time.replace(tzinfo=timezone.utc) == later
    assert s.duration_seconds == 300
    assert s.status == "active"


