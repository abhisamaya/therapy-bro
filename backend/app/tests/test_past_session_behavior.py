"""Test behavior when old ended sessions exist and user tries to start new chat."""
import pytest
from fastapi.testclient import TestClient
from decimal import Decimal
from app.main import app
from app.models import ChatSession, Wallet, Message, WalletTransaction
from app.utils import now_utc, create_access_token
from app.auth import get_current_user
from app.dependencies import get_db_session
from datetime import timedelta, timezone
from app.repositories.wallet_repository import WalletRepository, TransactionRepository


client = TestClient(app)


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_user_with_wallet(db_session):
    """Create a test user with wallet."""
    from app.models import User
    from app.utils import hash_password
    import uuid
    from datetime import date
    
    unique_id = str(uuid.uuid4())[:8]
    user = User(
        login_id=f"test_past_session_{unique_id}",
        password_hash=hash_password("testpass"),
        name="Test User",
        auth_provider="local"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Create wallet
    wallet_repo = WalletRepository(db_session)
    wallet = wallet_repo.create(Wallet(
        user_id=user.id,
        balance=Decimal("100.00"),
        reserved=Decimal("0.00"),
        currency="INR"
    ))
    
    # Mark free session as used (so new sessions are ended immediately)
    tx_repo = TransactionRepository(db_session)
    tx = WalletTransaction(
        wallet_id=wallet.id,
        user_id=user.id,
        type="free_session",
        amount=Decimal("0.0000"),
        balance_after=wallet.balance,
        reference_id="free:test",
        meta={}
    )
    tx_repo.create(tx)
    
    db_session.commit()
    return user


def test_past_ended_session_creates_new_session_on_list_chats(monkeypatch, db_session, test_user_with_wallet):
    """Test that when old ended sessions exist, listing chats and creating new session works correctly."""
    
    user = test_user_with_wallet
    token = create_access_token(user.login_id)
    
    # Override dependencies
    app.dependency_overrides[get_current_user] = lambda: user
    def _override_db():
        yield db_session
    app.dependency_overrides[get_db_session] = _override_db
    
    try:
        # Create an old session (2 days ago) without messages
        old_date = now_utc() - timedelta(days=2)
        old_session_no_messages = ChatSession(
            session_id="old_session_no_msgs",
            user_id=user.id,
            category="TherapyBro",
            created_at=old_date,
            updated_at=old_date,
            session_start_time=old_date,
            session_end_time=old_date + timedelta(seconds=300),
            duration_seconds=300,
            status="ended",
        )
        db_session.add(old_session_no_messages)
        
        # Create an old session (3 days ago) with messages
        older_date = now_utc() - timedelta(days=3)
        old_session_with_messages = ChatSession(
            session_id="old_session_with_msgs",
            user_id=user.id,
            category="TherapyBro",
            created_at=older_date,
            updated_at=older_date,
            session_start_time=older_date,
            session_end_time=older_date + timedelta(seconds=300),
            duration_seconds=300,
            status="ended",
        )
        db_session.add(old_session_with_messages)
        
        # Add a message to the older session
        message = Message(
            session_id="old_session_with_msgs",
            role="user",
            content="Hello from the past",
            created_at=older_date
        )
        db_session.add(message)
        db_session.commit()
        
        # Step 1: List chats - should return old sessions
        res = client.get("/api/chats", headers=auth_headers(token))
        assert res.status_code == 200
        chats = res.json()
        assert len(chats) == 2
        assert all(c["status"] == "ended" for c in chats)
        
        # Verify dates are in the past (not today)
        today_utc_str = now_utc().date().isoformat()
        for chat in chats:
            chat_date = chat["updated_at"][:10]  # Extract date part (YYYY-MM-DD)
            # Chat date should be before today
            assert chat_date < today_utc_str
        
        # Step 2: Try to start a new session - should create a new one
        res = client.post(
            "/api/sessions",
            json={"category": "TherapyBro"},
            headers=auth_headers(token)
        )
        assert res.status_code == 200
        new_session = res.json()
        assert new_session["session_id"] not in ["old_session_no_msgs", "old_session_with_msgs"]
        # Since free session is used, status should be "ended"
        assert new_session["status"] == "ended"
        
        # Step 3: List chats again - should now have 3 sessions
        res = client.get("/api/chats", headers=auth_headers(token))
        assert res.status_code == 200
        chats = res.json()
        assert len(chats) == 3
        
        # Verify the new session is listed first (most recent)
        assert chats[0]["session_id"] == new_session["session_id"]
        assert chats[0]["status"] == "ended"
        
        # Step 4: Verify the new session date is today
        new_session_updated = chats[0]["updated_at"][:10]
        today_str = now_utc().date().isoformat()
        assert new_session_updated == today_str
        
        print("✅ Test passed: New session created correctly when old sessions exist")
        
    finally:
        # Clean up overrides
        app.dependency_overrides.clear()


def test_past_session_with_today_session_uses_today_session(monkeypatch, db_session, test_user_with_wallet):
    """Test that when both old and today's sessions exist, today's session is used."""
    
    user = test_user_with_wallet
    token = create_access_token(user.login_id)
    
    # Override dependencies
    app.dependency_overrides[get_current_user] = lambda: user
    def _override_db():
        yield db_session
    app.dependency_overrides[get_db_session] = _override_db
    
    try:
        # Create an old session (2 days ago)
        old_date = now_utc() - timedelta(days=2)
        old_session = ChatSession(
            session_id="old_session",
            user_id=user.id,
            category="TherapyBro",
            created_at=old_date,
            updated_at=old_date,
            session_start_time=old_date,
            session_end_time=old_date + timedelta(seconds=300),
            duration_seconds=300,
            status="ended",
        )
        db_session.add(old_session)
        
        # Create today's session (active)
        today_session = ChatSession(
            session_id="today_session",
            user_id=user.id,
            category="TherapyBro",
            created_at=now_utc(),
            updated_at=now_utc(),
            session_start_time=now_utc(),
            session_end_time=now_utc() + timedelta(seconds=300),
            duration_seconds=300,
            status="active",
        )
        db_session.add(today_session)
        db_session.commit()
        
        # List chats - should return both, with today's first
        res = client.get("/api/chats", headers=auth_headers(token))
        assert res.status_code == 200
        chats = res.json()
        assert len(chats) == 2
        
        # Today's session should be first
        assert chats[0]["session_id"] == "today_session"
        assert chats[0]["status"] == "active"
        
        # Verify today's session date
        today_updated = chats[0]["updated_at"][:10]
        today_str = now_utc().date().isoformat()
        assert today_updated == today_str
        
        print("✅ Test passed: Today's session is selected when it exists")
        
    finally:
        app.dependency_overrides.clear()


def test_frontend_date_matching_logic(monkeypatch, db_session, test_user_with_wallet):
    """Test that verifies the frontend date matching logic would work correctly.
    
    The frontend uses: new Date().toISOString().slice(0, 10) which gives UTC date.
    This test verifies that sessions are correctly identified as 'today' vs 'past'.
    """
    
    user = test_user_with_wallet
    token = create_access_token(user.login_id)
    
    # Override dependencies
    app.dependency_overrides[get_current_user] = lambda: user
    def _override_db():
        yield db_session
    app.dependency_overrides[get_db_session] = _override_db
    
    try:
        # Get today's UTC date string (as frontend would calculate it)
        today_utc_frontend = now_utc().date().isoformat()  # YYYY-MM-DD
        
        # Create today's session
        today_session = ChatSession(
            session_id="today_session",
            user_id=user.id,
            category="TherapyBro",
            created_at=now_utc(),
            updated_at=now_utc(),
            session_start_time=now_utc(),
            session_end_time=now_utc() + timedelta(seconds=300),
            duration_seconds=300,
            status="active",
        )
        db_session.add(today_session)
        
        # Create yesterday's session
        yesterday = now_utc() - timedelta(days=1)
        yesterday_session = ChatSession(
            session_id="yesterday_session",
            user_id=user.id,
            category="TherapyBro",
            created_at=yesterday,
            updated_at=yesterday,
            session_start_time=yesterday,
            session_end_time=yesterday + timedelta(seconds=300),
            duration_seconds=300,
            status="ended",
        )
        db_session.add(yesterday_session)
        db_session.commit()
        
        # List chats
        res = client.get("/api/chats", headers=auth_headers(token))
        assert res.status_code == 200
        chats = res.json()
        
        # Find today's session using frontend logic
        # Frontend would do: c.updated_at.startsWith(today)
        today_sessions = [c for c in chats if c["updated_at"][:10] == today_utc_frontend]
        assert len(today_sessions) == 1
        assert today_sessions[0]["session_id"] == "today_session"
        
        # Verify yesterday's session is NOT matched as today
        yesterday_sessions = [c for c in chats if c["updated_at"][:10] == today_utc_frontend]
        assert "yesterday_session" not in [s["session_id"] for s in yesterday_sessions]
        
        print(f"✅ Test passed: Frontend date matching logic works correctly")
        print(f"   Today UTC: {today_utc_frontend}")
        print(f"   Today's session updated_at: {today_sessions[0]['updated_at'][:10]}")
        
    finally:
        app.dependency_overrides.clear()

