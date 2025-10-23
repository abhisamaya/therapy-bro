from fastapi.testclient import TestClient
from decimal import Decimal
from app.main import app
from app.db import get_session
from app.models import ChatSession, Wallet
from app.utils import now_utc
from datetime import timedelta
from app.utils import create_access_token
from app.auth import get_current_user
from app.dependencies import get_db_session


client = TestClient(app)


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_extend_session_insufficient_balance(monkeypatch, db_session, test_user):
    # Create session for user
    s = ChatSession(
        session_id="sess-extend-1",
        user_id=test_user.id,
        category="TherapyBro",
        created_at=now_utc(),
        updated_at=now_utc(),
        session_start_time=now_utc(),
        session_end_time=now_utc() + timedelta(seconds=300),
        duration_seconds=300,
        status="active",
    )
    db = db_session
    db.add(s)
    db.commit()

    # Ensure wallet with low balance
    w = Wallet(user_id=test_user.id, balance=Decimal("10.00"), reserved=Decimal("0.00"), currency="INR")
    db.add(w)
    db.commit()

    token = create_access_token(test_user.login_id)

    # Override auth to return our test_user and DB session to use test db
    app.dependency_overrides[get_current_user] = lambda: test_user
    def _override_db():
        yield db_session
    app.dependency_overrides[get_db_session] = _override_db
    try:
        res = client.post(
            f"/api/sessions/{s.session_id}/extend",
            json={"duration_seconds": 300},
            headers=auth_headers(token),
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db_session, None)

    assert res.status_code == 402
    body = res.json()
    assert body["error"]["code"] == "HTTP_402"
    assert body["error"]["message"] == "Insufficient wallet balance"


def test_extend_session_success(db_session, test_user):
    # Create session for user
    s = ChatSession(
        session_id="sess-extend-2",
        user_id=test_user.id,
        category="TherapyBro",
        created_at=now_utc(),
        updated_at=now_utc(),
        session_start_time=now_utc(),
        session_end_time=now_utc() + timedelta(seconds=300),
        duration_seconds=300,
        status="active",
    )
    db = db_session
    db.add(s)
    db.commit()

    # Sufficient wallet balance
    w = Wallet(user_id=test_user.id, balance=Decimal("100.00"), reserved=Decimal("0.00"), currency="INR")
    db.add(w)
    db.commit()

    token = create_access_token(test_user.login_id)

    app.dependency_overrides[get_current_user] = lambda: test_user
    def _override_db2():
        yield db_session
    app.dependency_overrides[get_db_session] = _override_db2
    try:
        res = client.post(
            f"/api/sessions/{s.session_id}/extend",
            json={"duration_seconds": 300},
            headers=auth_headers(token),
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db_session, None)

    assert res.status_code == 200
    data = res.json()
    assert data["session_id"] == s.session_id
    assert data["remaining_seconds"] >= 299
    assert "wallet_balance" in data
    assert data["cost_charged"] in ("20.00", "20.0", "20.0000")


def test_extend_session_fails_when_not_today_utc(db_session, test_user):
    # Create a session that started yesterday (UTC)
    start = now_utc() - timedelta(days=1)
    s = ChatSession(
        session_id="sess-extend-not-today",
        user_id=test_user.id,
        category="TherapyBro",
        created_at=start,
        updated_at=start,
        session_start_time=start,
        session_end_time=start + timedelta(seconds=300),
        duration_seconds=300,
        status="ended",
    )
    db = db_session
    db.add(s)
    db.commit()

    # Sufficient wallet balance
    w = Wallet(user_id=test_user.id, balance=Decimal("100.00"), reserved=Decimal("0.00"), currency="INR")
    db.add(w)
    db.commit()

    token = create_access_token(test_user.login_id)

    # Override auth and DB for test app
    app.dependency_overrides[get_current_user] = lambda: test_user
    def _override_db3():
        yield db_session
    app.dependency_overrides[get_db_session] = _override_db3
    try:
        res = client.post(
            f"/api/sessions/{s.session_id}/extend",
            json={"duration_seconds": 300},
            headers=auth_headers(token),
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db_session, None)

    assert res.status_code == 403
    body = res.json()
    assert body["error"]["code"] == "HTTP_403"
    assert "today" in body["error"]["message"].lower()
