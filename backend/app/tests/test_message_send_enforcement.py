from fastapi.testclient import TestClient
from decimal import Decimal
from datetime import timedelta

from app.main import app
from app.models import ChatSession, Wallet
from app.utils import now_utc, create_access_token
from app.auth import get_current_user
from app.dependencies import get_db_session


client = TestClient(app)


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_send_blocked_when_session_expired(db_session, test_user):
    # Create an already-expired session
    s = ChatSession(
        session_id="sess-expired-1",
        user_id=test_user.id,
        category="TherapyBro",
        created_at=now_utc(),
        updated_at=now_utc(),
        session_start_time=now_utc() - timedelta(minutes=10),
        session_end_time=now_utc() - timedelta(minutes=5),
        duration_seconds=300,
        status="ended",
    )
    db = db_session
    db.add(s)
    db.commit()

    token = create_access_token(test_user.login_id)

    # Override auth and DB for test app
    app.dependency_overrides[get_current_user] = lambda: test_user
    def _override_db():
        yield db_session
    app.dependency_overrides[get_db_session] = _override_db
    try:
        res = client.post(
            f"/api/sessions/{s.session_id}/messages",
            json={"content": "hello"},
            headers=auth_headers(token),
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db_session, None)

    assert res.status_code == 403
    body = res.json()
    assert body["error"]["code"] == "HTTP_403"
    assert "Session has ended" in body["error"]["message"]



