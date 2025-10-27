"""Pytest configuration and fixtures."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from app.models import User, ChatSession, Message, Wallet, WalletTransaction
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
    import uuid
    from app.utils import hash_password
    
    from datetime import date
    
    unique_id = str(uuid.uuid4())[:8]
    user = User(
        login_id=f"test_user_{unique_id}",
        password_hash=hash_password("testpassword123"),
        name="Test User",
        phone="1234567890",
        date_of_birth=date.today().replace(year=date.today().year - 25),
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
