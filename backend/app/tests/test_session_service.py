"""Tests for session service."""
import pytest
from datetime import date
from app.services.session_service import SessionService
from app.models import ChatSession, Message, User
from app.schemas import StartSessionIn, MessageIn, NotesIn


class TestSessionService:
    """Test cases for SessionService."""
    
    def test_list_user_sessions(self, db_session, test_user):
        """Test listing user sessions."""
        session_service = SessionService(db_session)
        
        # Create test sessions
        session1 = ChatSession(
            session_id="session_1",
            user_id=test_user.id,
            category="therapy",
            notes="Test notes 1"
        )
        session2 = ChatSession(
            session_id="session_2", 
            user_id=test_user.id,
            category="coaching",
            notes="Test notes 2"
        )
        db_session.add_all([session1, session2])
        db_session.commit()
        
        # List sessions
        sessions = session_service.list_user_sessions(test_user.id)
        
        # Verify results
        assert len(sessions) == 2
        assert sessions[0].session_id == "session_2"  # Should be ordered by updated_at desc
        assert sessions[1].session_id == "session_1"
        assert sessions[0].category == "coaching"
        assert sessions[1].category == "therapy"
    
    def test_list_user_sessions_empty(self, db_session, test_user):
        """Test listing sessions for user with no sessions."""
        session_service = SessionService(db_session)
        
        sessions = session_service.list_user_sessions(test_user.id)
        
        assert len(sessions) == 0
    
    def test_create_session(self, db_session, test_user):
        """Test creating a new session."""
        session_service = SessionService(db_session)
        
        session_out = session_service.create_session(
            test_user.id,
            "therapy",
            "You are a helpful therapist."
        )
        session_id = session_out.session_id

        # Verify session was created
        assert session_out is not None
        assert session_out.session_id is not None
        assert len(session_out.session_id) == 32  # UUID hex length
        
        # Verify session exists in database
        session = session_service.find_session_by_id(session_id, test_user.id)
        assert session is not None
        assert session.user_id == test_user.id
        assert session.category == "therapy"
        assert session.notes is None
        
        # Verify system message was created
        messages = session_service.get_conversation_history(session_id)
        assert len(messages) == 1
        assert messages[0]["role"] == "system"
        assert messages[0]["content"] == "You are a helpful therapist."
    
    def test_get_session_history(self, db_session, test_user):
        """Test getting session history."""
        session_service = SessionService(db_session)
        
        # Create session with messages
        session_out = session_service.create_session(
            test_user.id,
            "therapy",
            "You are a helpful therapist."
        )
        session_id = session_out.session_id
        
        # Add user message
        session_service.add_user_message(session_id, "Hello", test_user.id)
        
        # Add assistant message
        session_service.add_assistant_message(session_id, "Hi there!")
        
        # Get history
        history = session_service.get_session_history(session_id, test_user.id)
        
        # Verify history
        assert history.session_id == session_id
        assert history.category == "therapy"
        assert len(history.messages) == 3
        assert history.messages[0].role == "system"
        assert history.messages[1].role == "user"
        assert history.messages[2].role == "assistant"
    
    def test_get_session_history_not_found(self, db_session, test_user):
        """Test getting history for non-existent session."""
        session_service = SessionService(db_session)
        
        with pytest.raises(ValueError, match="Session not found"):
            session_service.get_session_history("nonexistent_session", test_user.id)
    
    def test_add_user_message(self, db_session, test_user):
        """Test adding user message to session."""
        session_service = SessionService(db_session)
        
        # Create session
        session_out = session_service.create_session(
            test_user.id,
            "therapy",
            "You are a helpful therapist."
        )
        session_id = session_out.session_id
        
        # Add user message
        session_service.add_user_message(session_id, "Hello world", test_user.id)
        
        # Verify message was added
        messages = session_service.get_conversation_history(session_id)
        assert len(messages) == 2
        assert messages[1]["role"] == "user"
        assert messages[1]["content"] == "Hello world"
    
    def test_add_user_message_session_not_found(self, db_session, test_user):
        """Test adding message to non-existent session."""
        session_service = SessionService(db_session)
        
        with pytest.raises(ValueError, match="Session not found"):
            session_service.add_user_message("nonexistent_session", "Hello", test_user.id)
    
    def test_add_assistant_message(self, db_session, test_user):
        """Test adding assistant message to session."""
        session_service = SessionService(db_session)
        
        # Create session
        session_out = session_service.create_session(
            test_user.id,
            "therapy",
            "You are a helpful therapist."
        )
        session_id = session_out.session_id
        
        # Add assistant message
        session_service.add_assistant_message(session_id, "How can I help you?")
        
        # Verify message was added
        messages = session_service.get_conversation_history(session_id)
        assert len(messages) == 2
        assert messages[1]["role"] == "assistant"
        assert messages[1]["content"] == "How can I help you?"
    
    def test_get_conversation_history(self, db_session, test_user):
        """Test getting conversation history for LLM."""
        session_service = SessionService(db_session)
        
        # Create session
        session_out = session_service.create_session(
            test_user.id,
            "therapy",
            "You are a helpful therapist."
        )
        session_id = session_out.session_id
        
        # Add messages
        session_service.add_user_message(session_id, "Hello", test_user.id)
        session_service.add_assistant_message(session_id, "Hi!")
        
        # Get conversation history
        history = session_service.get_conversation_history(session_id)
        
        # Verify history format
        assert len(history) == 3
        assert history[0]["role"] == "system"
        assert history[0]["content"] == "You are a helpful therapist."
        assert history[1]["role"] == "user"
        assert history[1]["content"] == "Hello"
        assert history[2]["role"] == "assistant"
        assert history[2]["content"] == "Hi!"
    
    def test_update_session_notes(self, db_session, test_user):
        """Test updating session notes."""
        session_service = SessionService(db_session)
        
        # Create session
        session_out = session_service.create_session(
            test_user.id,
            "therapy",
            "You are a helpful therapist."
        )
        session_id = session_out.session_id
        
        # Update notes
        session_service.update_session_notes(session_id, "Important session notes", test_user.id)
        
        # Verify notes were updated
        session = session_service.find_session_by_id(session_id, test_user.id)
        assert session.notes == "Important session notes"
    
    def test_update_session_notes_not_found(self, db_session, test_user):
        """Test updating notes for non-existent session."""
        session_service = SessionService(db_session)
        
        with pytest.raises(ValueError, match="Session not found"):
            session_service.update_session_notes("nonexistent_session", "Notes", test_user.id)
    
    def test_delete_session(self, db_session, test_user):
        """Test deleting a session."""
        session_service = SessionService(db_session)
        
        # Create session with messages
        session_out = session_service.create_session(
            test_user.id,
            "therapy",
            "You are a helpful therapist."
        )
        session_id = session_out.session_id
        session_service.add_user_message(session_id, "Hello", test_user.id)
        session_service.add_assistant_message(session_id, "Hi!")
        
        # Verify session exists
        session = session_service.find_session_by_id(session_id, test_user.id)
        assert session is not None
        
        # Delete session
        session_service.delete_session(session_id, test_user.id)
        
        # Verify session and messages are deleted
        session = session_service.find_session_by_id(session_id, test_user.id)
        assert session is None
        
        # Verify messages are also deleted
        messages = session_service.get_conversation_history(session_id)
        assert len(messages) == 0
    
    def test_delete_session_not_found(self, db_session, test_user):
        """Test deleting non-existent session."""
        session_service = SessionService(db_session)
        
        with pytest.raises(ValueError, match="Session not found"):
            session_service.delete_session("nonexistent_session", test_user.id)
    
    def test_find_session_by_id(self, db_session, test_user):
        """Test finding session by ID."""
        session_service = SessionService(db_session)
        
        # Create session
        session_out = session_service.create_session(
            test_user.id,
            "therapy",
            "You are a helpful therapist."
        )
        session_id = session_out.session_id
        
        # Find session
        session = session_service.find_session_by_id(session_id, test_user.id)
        
        # Verify session found
        assert session is not None
        assert session.session_id == session_id
        assert session.user_id == test_user.id
        assert session.category == "therapy"
    
    def test_find_session_by_id_not_found(self, db_session, test_user):
        """Test finding non-existent session."""
        session_service = SessionService(db_session)
        
        session = session_service.find_session_by_id("nonexistent_session", test_user.id)
        
        assert session is None
    
    def test_find_session_by_id_wrong_user(self, db_session, test_user):
        """Test finding session with wrong user ID."""
        session_service = SessionService(db_session)
        
        # Create another user
        other_user = User(
            login_id="other_user",
            password_hash="hashed_password",
            name="Other User",
            phone="9876543210",
            date_of_birth=date.today().replace(year=date.today().year - 30),
            auth_provider="local"
        )
        db_session.add(other_user)
        db_session.commit()
        db_session.refresh(other_user)
        
        # Create session for test_user
        session_out = session_service.create_session(
            test_user.id,
            "therapy",
            "You are a helpful therapist."
        )
        session_id = session_out.session_id
        
        # Try to find session with other_user
        session = session_service.find_session_by_id(session_id, other_user.id)
        
        # Should not find session (authorization check)
        assert session is None
