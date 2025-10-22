"""Tests for repository layer."""
import pytest
from decimal import Decimal
from app.repositories.user_repository import UserRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.message_repository import MessageRepository
from app.repositories.wallet_repository import WalletRepository, TransactionRepository
from app.models import User, ChatSession, Message, Wallet, WalletTransaction
from app.utils import now_utc


class TestUserRepository:
    """Test UserRepository functionality."""
    
    def test_create_user(self, db_session):
        """Test creating a user."""
        repo = UserRepository(db_session)
        
        user = User(
            login_id="test_user_repo",
            password_hash="hashed_password",
            name="Test User Repo",
            phone="1234567890",
            age=25,
            created_at=now_utc()
        )
        
        created_user = repo.create(user)
        assert created_user.id is not None
        assert created_user.login_id == "test_user_repo"
        assert created_user.name == "Test User Repo"
    
    def test_find_by_login_id(self, db_session, test_user):
        """Test finding user by login_id."""
        repo = UserRepository(db_session)
        
        found_user = repo.find_by_login_id(test_user.login_id)
        assert found_user is not None
        assert found_user.id == test_user.id
        assert found_user.login_id == test_user.login_id
    
    def test_find_by_id(self, db_session, test_user):
        """Test finding user by ID."""
        repo = UserRepository(db_session)
        
        found_user = repo.find_by_id(test_user.id)
        assert found_user is not None
        assert found_user.id == test_user.id
        assert found_user.login_id == test_user.login_id
    
    def test_update_user(self, db_session, test_user):
        """Test updating user."""
        repo = UserRepository(db_session)
        
        test_user.name = "Updated Name"
        updated_user = repo.update(test_user)
        
        assert updated_user.name == "Updated Name"
        assert updated_user.id == test_user.id


class TestSessionRepository:
    """Test SessionRepository functionality."""
    
    def test_create_session(self, db_session, test_user):
        """Test creating a session."""
        repo = SessionRepository(db_session)
        
        session = ChatSession(
            session_id="test_session_repo",
            user_id=test_user.id,
            category="test",
            notes=None,
            created_at=now_utc(),
            updated_at=now_utc()
        )
        
        created_session = repo.create(session)
        assert created_session.id is not None
        assert created_session.session_id == "test_session_repo"
        assert created_session.user_id == test_user.id
    
    def test_find_by_session_and_user(self, db_session, test_user):
        """Test finding session by session_id and user_id."""
        repo = SessionRepository(db_session)
        
        # Create a session first
        session = ChatSession(
            session_id="find_test_session",
            user_id=test_user.id,
            category="test",
            created_at=now_utc(),
            updated_at=now_utc()
        )
        created_session = repo.create(session)
        
        # Find it
        found_session = repo.find_by_session_and_user("find_test_session", test_user.id)
        assert found_session is not None
        assert found_session.session_id == "find_test_session"
        assert found_session.user_id == test_user.id
    
    def test_find_by_user_id(self, db_session, test_user):
        """Test finding sessions by user_id."""
        repo = SessionRepository(db_session)
        
        # Create multiple sessions
        session1 = ChatSession(
            session_id="user_session_1",
            user_id=test_user.id,
            category="test1",
            created_at=now_utc(),
            updated_at=now_utc()
        )
        session2 = ChatSession(
            session_id="user_session_2",
            user_id=test_user.id,
            category="test2",
            created_at=now_utc(),
            updated_at=now_utc()
        )
        
        repo.create(session1)
        repo.create(session2)
        
        # Find all sessions for user
        sessions = repo.find_by_user_id(test_user.id)
        assert len(sessions) >= 2
        
        session_ids = [s.session_id for s in sessions]
        assert "user_session_1" in session_ids
        assert "user_session_2" in session_ids


class TestMessageRepository:
    """Test MessageRepository functionality."""
    
    def test_create_message(self, db_session):
        """Test creating a message."""
        repo = MessageRepository(db_session)
        
        message = Message(
            session_id="test_session",
            role="user",
            content="Test message content",
            created_at=now_utc()
        )
        
        created_message = repo.create(message)
        assert created_message.id is not None
        assert created_message.session_id == "test_session"
        assert created_message.role == "user"
        assert created_message.content == "Test message content"
    
    def test_find_by_session_id(self, db_session):
        """Test finding messages by session_id."""
        repo = MessageRepository(db_session)
        
        # Create multiple messages for same session
        message1 = Message(
            session_id="test_session_messages",
            role="user",
            content="First message",
            created_at=now_utc()
        )
        message2 = Message(
            session_id="test_session_messages",
            role="assistant",
            content="Second message",
            created_at=now_utc()
        )
        
        repo.create(message1)
        repo.create(message2)
        
        # Find all messages for session
        messages = repo.find_by_session_id("test_session_messages")
        assert len(messages) == 2
        
        roles = [m.role for m in messages]
        assert "user" in roles
        assert "assistant" in roles


class TestWalletRepository:
    """Test WalletRepository functionality."""
    
    def test_create_wallet(self, db_session, test_user):
        """Test creating a wallet."""
        repo = WalletRepository(db_session)
        
        wallet = Wallet(
            user_id=test_user.id,
            balance=Decimal("100.0000"),
            reserved=Decimal("0.0000"),
            currency="USD",
            updated_at=now_utc()
        )
        
        created_wallet = repo.create(wallet)
        assert created_wallet.id is not None
        assert created_wallet.user_id == test_user.id
        assert created_wallet.balance == Decimal("100.0000")
    
    def test_find_by_user_id(self, db_session, test_user):
        """Test finding wallet by user_id."""
        repo = WalletRepository(db_session)
        
        # Create wallet
        wallet = Wallet(
            user_id=test_user.id,
            balance=Decimal("200.0000"),
            reserved=Decimal("0.0000"),
            currency="USD",
            updated_at=now_utc()
        )
        created_wallet = repo.create(wallet)
        
        # Find it
        found_wallet = repo.find_by_user_id(test_user.id)
        assert found_wallet is not None
        assert found_wallet.id == created_wallet.id
        assert found_wallet.user_id == test_user.id


class TestTransactionRepository:
    """Test TransactionRepository functionality."""
    
    def test_create_transaction(self, db_session, test_user, test_wallet):
        """Test creating a transaction."""
        repo = TransactionRepository(db_session)
        
        transaction = WalletTransaction(
            wallet_id=test_wallet.id,
            user_id=test_user.id,
            type="topup",
            amount=Decimal("50.0000"),
            balance_after=Decimal("250.0000"),
            reference_id="test_transaction",
            meta={"reason": "Test transaction"},
            created_at=now_utc()
        )
        
        created_transaction = repo.create(transaction)
        assert created_transaction.id is not None
        assert created_transaction.wallet_id == test_wallet.id
        assert created_transaction.type == "topup"
        assert created_transaction.amount == Decimal("50.0000")
    
    def test_find_by_wallet_id(self, db_session, test_user, test_wallet):
        """Test finding transactions by wallet_id."""
        repo = TransactionRepository(db_session)
        
        # Create multiple transactions
        transaction1 = WalletTransaction(
            wallet_id=test_wallet.id,
            user_id=test_user.id,
            type="topup",
            amount=Decimal("100.0000"),
            balance_after=Decimal("300.0000"),
            reference_id="transaction_1",
            created_at=now_utc()
        )
        transaction2 = WalletTransaction(
            wallet_id=test_wallet.id,
            user_id=test_user.id,
            type="payment",
            amount=Decimal("50.0000"),
            balance_after=Decimal("250.0000"),
            reference_id="transaction_2",
            created_at=now_utc()
        )
        
        repo.create(transaction1)
        repo.create(transaction2)
        
        # Find all transactions for wallet
        transactions = repo.find_by_wallet_id(test_wallet.id)
        assert len(transactions) >= 2
        
        types = [t.type for t in transactions]
        assert "topup" in types
        assert "payment" in types
