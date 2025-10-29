"""Tests for message service."""
import pytest
import json
from datetime import date
from unittest.mock import Mock, patch, MagicMock
from fastapi.responses import StreamingResponse
from app.services.message_service import MessageService
from app.services.session_service import SessionService
from app.models import User


class TestMessageService:
    """Test cases for MessageService."""
    
    def test_process_message_stream_success(self, db_session, test_user):
        """Test successful message processing and streaming."""
        message_service = MessageService(db_session)
        
        # Create a test session
        session_service = SessionService(db_session)
        session_out = session_service.create_session(
            test_user.id,
            "therapy",
            "You are a helpful therapist."
        )
        session_id = session_out.session_id
        
        # Mock the LLM factory and streamer
        with patch('app.services.message_service.get_llm_factory') as mock_get_factory:
            mock_factory = Mock()
            mock_streamer = Mock()
            mock_streamer.model = "test-model"
            mock_streamer.stream_chat.return_value = ["Hello", " there", "!"]
            mock_factory.create_streamer.return_value = mock_streamer
            mock_get_factory.return_value = mock_factory
            
            # Process message
            response = message_service.process_message_stream(
                session_id, test_user.id, "Hello", "anthropic"
            )
            
            # Verify response
            assert isinstance(response, StreamingResponse)
            assert response.media_type == "application/x-ndjson"
            
            # Verify LLM factory was called
            mock_factory.create_streamer.assert_called_once_with(provider="anthropic")
    
    def test_process_message_stream_session_not_found(self, db_session, test_user):
        """Test message processing with non-existent session."""
        message_service = MessageService(db_session)
        
        with pytest.raises(ValueError, match="Session not found"):
            message_service.process_message_stream(
                "nonexistent_session", test_user.id, "Hello"
            )
    
    def test_process_message_stream_llm_error(self, db_session, test_user):
        """Test message processing with LLM error."""
        message_service = MessageService(db_session)
        
        # Create a test session
        session_service = SessionService(db_session)
        session_out = session_service.create_session(
            test_user.id,
            "therapy",
            "You are a helpful therapist."
        )
        session_id = session_out.session_id
        
        # Mock LLM factory to raise error
        with patch('app.services.message_service.get_llm_factory') as mock_get_factory:
            mock_factory = Mock()
            mock_factory.create_streamer.side_effect = RuntimeError("API key not set")
            mock_get_factory.return_value = mock_factory
            
            with pytest.raises(RuntimeError, match="Failed to create LLM streamer"):
                message_service.process_message_stream(
                    session_id, test_user.id, "Hello"
                )
    
    def test_get_conversation_history(self, db_session, test_user):
        """Test getting conversation history."""
        message_service = MessageService(db_session)
        
        # Create a test session with messages
        session_service = SessionService(db_session)
        session_out = session_service.create_session(
            test_user.id,
            "therapy",
            "You are a helpful therapist."
        )
        session_id = session_out.session_id
        session_service.add_user_message(session_id, "Hello", test_user.id)
        session_service.add_assistant_message(session_id, "Hi there!")
        
        # Get conversation history
        history = message_service.get_conversation_history(session_id)
        
        # Verify history
        assert len(history) == 3
        assert history[0]["role"] == "system"
        assert history[1]["role"] == "user"
        assert history[2]["role"] == "assistant"
        assert history[1]["content"] == "Hello"
        assert history[2]["content"] == "Hi there!"
    
    def test_add_user_message(self, db_session, test_user):
        """Test adding user message."""
        message_service = MessageService(db_session)
        
        # Create a test session
        session_service = SessionService(db_session)
        session_out = session_service.create_session(
            test_user.id,
            "therapy",
            "You are a helpful therapist."
        )
        session_id = session_out.session_id
        
        # Add user message
        message_service.add_user_message(session_id, "Test message", test_user.id)
        
        # Verify message was added
        history = message_service.get_conversation_history(session_id)
        assert len(history) == 2
        assert history[1]["role"] == "user"
        assert history[1]["content"] == "Test message"
    
    def test_add_user_message_session_not_found(self, db_session, test_user):
        """Test adding user message to non-existent session."""
        message_service = MessageService(db_session)
        
        with pytest.raises(ValueError, match="Session not found"):
            message_service.add_user_message("nonexistent_session", "Hello", test_user.id)
    
    def test_add_assistant_message(self, db_session, test_user):
        """Test adding assistant message."""
        message_service = MessageService(db_session)
        
        # Create a test session
        session_service = SessionService(db_session)
        session_out = session_service.create_session(
            test_user.id,
            "therapy",
            "You are a helpful therapist."
        )
        session_id = session_out.session_id
        
        # Add assistant message
        message_service.add_assistant_message(session_id, "Assistant response")
        
        # Verify message was added
        history = message_service.get_conversation_history(session_id)
        assert len(history) == 2
        assert history[1]["role"] == "assistant"
        assert history[1]["content"] == "Assistant response"
    
    def test_validate_session_access_valid(self, db_session, test_user):
        """Test validating valid session access."""
        message_service = MessageService(db_session)
        
        # Create a test session
        session_service = SessionService(db_session)
        session_out = session_service.create_session(
            test_user.id,
            "therapy",
            "You are a helpful therapist."
        )
        session_id = session_out.session_id
        
        # Validate access
        has_access = message_service.validate_session_access(session_id, test_user.id)
        
        assert has_access is True
    
    def test_validate_session_access_invalid(self, db_session, test_user):
        """Test validating invalid session access."""
        message_service = MessageService(db_session)
        
        # Create another user with unique login_id
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        other_user = User(
            login_id=f"other_user_{unique_id}",
            password_hash="hashed_password",
            name="Other User",
            phone="9876543210",
            date_of_birth=date.today().replace(year=date.today().year - 30),
            auth_provider="local"
        )
        db_session.add(other_user)
        db_session.commit()
        db_session.refresh(other_user)
        
        # Create a test session for test_user
        session_service = SessionService(db_session)
        session_out = session_service.create_session(
            test_user.id,
            "therapy",
            "You are a helpful therapist."
        )
        session_id = session_out.session_id
        
        # Validate access with other user
        has_access = message_service.validate_session_access(session_id, other_user.id)
        
        assert has_access is False
    
    def test_validate_session_access_nonexistent(self, db_session, test_user):
        """Test validating access to non-existent session."""
        message_service = MessageService(db_session)
        
        # Validate access to non-existent session
        has_access = message_service.validate_session_access("nonexistent_session", test_user.id)
        
        assert has_access is False
    
    def test_streaming_response_content(self, db_session, test_user):
        """Test that streaming response contains correct content."""
        message_service = MessageService(db_session)
        
        # Create a test session
        session_service = SessionService(db_session)
        session_out = session_service.create_session(
            test_user.id,
            "therapy",
            "You are a helpful therapist."
        )
        session_id = session_out.session_id
        
        # Mock the LLM factory and streamer
        with patch('app.services.message_service.get_llm_factory') as mock_get_factory:
            mock_factory = Mock()
            mock_streamer = Mock()
            mock_streamer.model = "test-model"
            mock_streamer.stream_chat.return_value = ["Hello", " world"]
            mock_factory.create_streamer.return_value = mock_streamer
            mock_get_factory.return_value = mock_factory
            
            # Process message
            response = message_service.process_message_stream(
                session_id, test_user.id, "Hello"
            )
            
            # Verify response type and media type
            assert isinstance(response, StreamingResponse)
            assert response.media_type == "application/x-ndjson"
            
            # Verify that the response has a body iterator
            assert hasattr(response, 'body_iterator')
