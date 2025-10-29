from fastapi.testclient import TestClient
from decimal import Decimal
from datetime import timedelta

from app.main import app
from app.models import ChatSession, Wallet, Message
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
    # Add a couple messages so chunker will run
    db.add(Message(session_id=s.session_id, role="system", content="sys", created_at=now_utc()))
    db.add(Message(session_id=s.session_id, role="user", content="u1", created_at=now_utc()))
    db.commit()

    token = create_access_token(test_user.login_id)

    # Override auth and DB for test app
    app.dependency_overrides[get_current_user] = lambda: test_user
    def _override_db():
        yield db_session
    app.dependency_overrides[get_db_session] = _override_db
    # Monkeypatch chunker to observe finalize-on-expiry behavior
    from app.services import memory_chunker as mc
    called = {"chunked": False}
    original = mc.MemoryChunkerService.chunk_and_store_session
    def _fake_chunk(self, session_id, user_id, messages):
        called["chunked"] = True
    mc.MemoryChunkerService.chunk_and_store_session = _fake_chunk
    try:
        res = client.post(
            f"/api/sessions/{s.session_id}/messages",
            json={"content": "hello"},
            headers=auth_headers(token),
        )
    finally:
        mc.MemoryChunkerService.chunk_and_store_session = original
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db_session, None)

    assert res.status_code == 403
    body = res.json()
    assert body["error"]["code"] == "HTTP_403"
    assert "Session has ended" in body["error"]["message"]
    # Ensure finalize-on-expiry attempted chunking
    assert called["chunked"] is True


def test_send_blocked_at_exact_expiry_boundary(db_session, test_user):
    # Create a session that expires exactly now
    s = ChatSession(
        session_id="sess-expired-boundary-1",
        user_id=test_user.id,
        category="TherapyBro",
        created_at=now_utc(),
        updated_at=now_utc(),
        session_start_time=now_utc(),
        session_end_time=now_utc(),  # exactly at now
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
            json={"content": "hello at boundary"},
            headers=auth_headers(token),
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db_session, None)

    assert res.status_code == 403
    body = res.json()
    assert body["error"]["code"] == "HTTP_403"
    assert "Session has ended" in body["error"]["message"]



