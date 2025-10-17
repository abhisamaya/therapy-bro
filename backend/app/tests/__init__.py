"""Test infrastructure for TherapyBro backend."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from app.db import get_session
from app.models import User, ChatSession, Message, Wallet, WalletTransaction
from app.config.settings import settings
import tempfile
import os


@pytest.fixture(scope="session")
def test_db_url():
    """Create a temporary database URL for testing."""
    # Create a temporary database file
    temp_db = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
    temp_db.close()
    db_url = f"sqlite:///{temp_db.name}"
    
    yield db_url
    
    # Cleanup
    try:
        os.unlink(temp_db.name)
    except OSError:
        pass


@pytest.fixture(scope="session")
def test_engine(test_db_url):
    """Create test database engine."""
    engine = create_engine(test_db_url, connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    return engine


@pytest.fixture(scope="session")
def test_session_factory(test_engine):
    """Create test session factory."""
    return sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture
def db_session(test_session_factory):
    """Create a test database session."""
    session = test_session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    user = User(
        login_id="test_user",
        password_hash="hashed_password",
        name="Test User",
        phone="1234567890",
        age=25,
        auth_provider="local"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_wallet(db_session, test_user):
    """Create a test wallet for the test user."""
    wallet = Wallet(
        user_id=test_user.id,
        balance=200.0000,
        reserved=0.0000,
        currency="INR"
    )
    db_session.add(wallet)
    db_session.commit()
    db_session.refresh(wallet)
    return wallet


@pytest.fixture
def test_chat_session(db_session, test_user):
    """Create a test chat session."""
    session = ChatSession(
        session_id="test_session_123",
        user_id=test_user.id,
        category="general",
        status="active"
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)
    return session


@pytest.fixture
def test_messages(db_session, test_chat_session):
    """Create test messages for the chat session."""
    messages = [
        Message(
            session_id=test_chat_session.session_id,
            role="user",
            content="Hello, this is a test message"
        ),
        Message(
            session_id=test_chat_session.session_id,
            role="assistant",
            content="Hello! How can I help you today?"
        )
    ]
    for message in messages:
        db_session.add(message)
    db_session.commit()
    for message in messages:
        db_session.refresh(message)
    return messages


@pytest.fixture
def sample_register_data():
    """Sample registration data for testing."""
    return {
        "login_id": "test_register_user",
        "password": "test_password_123",
        "name": "Test Register User",
        "phone": "9876543210",
        "age": 30
    }


@pytest.fixture
def sample_login_data():
    """Sample login data for testing."""
    return {
        "login_id": "test_user",
        "password": "test_password"
    }


@pytest.fixture
def sample_session_data():
    """Sample session creation data for testing."""
    return {
        "category": "general"
    }


@pytest.fixture
def sample_message_data():
    """Sample message data for testing."""
    return {
        "content": "This is a test message for the chat session"
    }


# Configuration for pytest
def pytest_configure(config):
    """Configure pytest with custom settings."""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )
