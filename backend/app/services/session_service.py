"""Session service for managing chat session operations."""
import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import ChatSession, Message
from app.schemas import StartSessionIn, MessageIn, NotesIn, ConversationItem, HistoryOut, MessageOut
from app.services.base_service import BaseService
from app.utils import now_ist


class SessionService(BaseService):
    """Service for chat session operations."""
    
    def list_user_sessions(self, user_id: int) -> List[ConversationItem]:
        """Get all chat sessions for a user.
        
        Args:
            user_id: User ID to get sessions for
            
        Returns:
            List of conversation items
        """
        self.logger.debug(f"Listing sessions for user_id: {user_id}")
        
        sessions = self.find_by_criteria(
            ChatSession, 
            user_id=user_id
        )
        
        # Sort by updated_at desc since find_by_criteria sorts by PK
        sessions.sort(key=lambda s: s.updated_at, reverse=True)
        
        return [
            ConversationItem(
                session_id=session.session_id,
                category=session.category,
                updated_at=session.updated_at.isoformat(),
                notes=session.notes,
            )
            for session in sessions
        ]
    
    def create_session(self, user_id: int, category: str, system_prompt: str) -> str:
        """Create a new chat session.
        
        Args:
            user_id: User ID creating the session
            category: Session category
            system_prompt: System prompt for the session
            
        Returns:
            Session ID of the created session
            
        Raises:
            Exception: If session creation fails
        """
        self.logger.info(f"Creating new session for user_id: {user_id}, category: {category}")
        
        session_id = uuid.uuid4().hex
        
        try:
            # Create chat session
            chat_session = ChatSession(
                session_id=session_id,
                user_id=user_id,
                category=category,
                notes=None,
                created_at=now_ist(),
                updated_at=now_ist(),
            )
            self.db.add(chat_session)
            
            # Add system message
            system_message = Message(
                session_id=session_id,
                role="system",
                content=system_prompt,
                created_at=now_ist()
            )
            self.db.add(system_message)
            
            self.db.commit()
            self.logger.info(f"Session created successfully: {session_id}")
            
            return session_id
            
        except Exception as e:
            self.logger.error(f"Failed to create session: {str(e)}")
            raise Exception(f"Failed to create session: {str(e)}")
    
    def get_session_history(self, session_id: str, user_id: int) -> HistoryOut:
        """Get chat history for a session.
        
        Args:
            session_id: Session ID to get history for
            user_id: User ID (for authorization)
            
        Returns:
            Session history with messages
            
        Raises:
            ValueError: If session not found
        """
        self.logger.info(f"Retrieving history for session: {session_id}, user_id: {user_id}")
        
        # Find session
        chat_session = self.find_one_by_criteria(
            ChatSession,
            session_id=session_id,
            user_id=user_id
        )
        
        if not chat_session:
            self.logger.warning(f"Session not found: {session_id} for user: {user_id}")
            raise ValueError("Session not found")
        
        # Get messages
        messages = self.find_by_criteria(
            Message,
            session_id=session_id
        )
        
        # Sort by created_at asc since find_by_criteria sorts by PK
        messages.sort(key=lambda m: m.created_at)
        
        self.logger.info(f"Retrieved {len(messages)} messages for session: {session_id}")
        
        return HistoryOut(
            session_id=chat_session.session_id,
            category=chat_session.category,
            messages=[MessageOut(role=m.role, content=m.content) for m in messages],
        )
    
    def add_user_message(self, session_id: str, content: str, user_id: int) -> None:
        """Add a user message to a session.
        
        Args:
            session_id: Session ID to add message to
            content: Message content
            user_id: User ID (for authorization)
            
        Raises:
            ValueError: If session not found
        """
        self.logger.debug(f"Adding user message to session: {session_id}")
        
        # Verify session exists and belongs to user
        chat_session = self.find_one_by_criteria(
            ChatSession,
            session_id=session_id,
            user_id=user_id
        )
        
        if not chat_session:
            self.logger.warning(f"Session not found: {session_id} for user: {user_id}")
            raise ValueError("Session not found")
        
        # Add user message
        user_message = Message(
            session_id=session_id,
            role="user",
            content=content,
            created_at=now_ist()
        )
        self.db.add(user_message)
        
        # Update session timestamp
        chat_session.updated_at = now_ist()
        
        self.db.commit()
        self.logger.debug(f"User message added to session: {session_id}")
    
    def add_assistant_message(self, session_id: str, content: str) -> None:
        """Add an assistant message to a session.
        
        Args:
            session_id: Session ID to add message to
            content: Message content
        """
        self.logger.debug(f"Adding assistant message to session: {session_id}")
        
        assistant_message = Message(
            session_id=session_id,
            role="assistant",
            content=content,
            created_at=now_ist()
        )
        self.db.add(assistant_message)
        self.db.commit()
        self.logger.debug(f"Assistant message added to session: {session_id}")
    
    def get_conversation_history(self, session_id: str) -> List[dict]:
        """Get conversation history for LLM processing.
        
        Args:
            session_id: Session ID to get history for
            
        Returns:
            List of message dictionaries for LLM
        """
        self.logger.debug(f"Building conversation history for session: {session_id}")
        
        messages = self.find_by_criteria(
            Message,
            session_id=session_id
        )
        
        # Sort by created_at asc since find_by_criteria sorts by PK
        messages.sort(key=lambda m: m.created_at)
        
        wire = [{"role": m.role, "content": m.content} for m in messages]
        self.logger.debug(f"Built conversation history with {len(wire)} messages")
        
        return wire
    
    def update_session_notes(self, session_id: str, notes: str, user_id: int) -> None:
        """Update session notes.
        
        Args:
            session_id: Session ID to update
            notes: New notes content
            user_id: User ID (for authorization)
            
        Raises:
            ValueError: If session not found
        """
        self.logger.debug(f"Updating notes for session: {session_id}")
        
        chat_session = self.find_one_by_criteria(
            ChatSession,
            session_id=session_id,
            user_id=user_id
        )
        
        if not chat_session:
            self.logger.warning(f"Session not found: {session_id} for user: {user_id}")
            raise ValueError("Session not found")
        
        chat_session.notes = notes
        chat_session.updated_at = now_ist()
        
        self.db.commit()
        self.logger.debug(f"Notes updated for session: {session_id}")
    
    def delete_session(self, session_id: str, user_id: int) -> None:
        """Delete a chat session and all its messages.
        
        Args:
            session_id: Session ID to delete
            user_id: User ID (for authorization)
            
        Raises:
            ValueError: If session not found
        """
        self.logger.info(f"Deleting session: {session_id} for user: {user_id}")
        
        chat_session = self.find_one_by_criteria(
            ChatSession,
            session_id=session_id,
            user_id=user_id
        )
        
        if not chat_session:
            self.logger.warning(f"Session not found: {session_id} for user: {user_id}")
            raise ValueError("Session not found")
        
        # Delete all messages for this session
        messages = self.find_by_criteria(Message, session_id=session_id)
        for message in messages:
            self.db.delete(message)
        
        # Delete the chat session
        self.db.delete(chat_session)
        self.db.commit()
        
        self.logger.info(f"Session deleted: {session_id}")
    
    def find_session_by_id(self, session_id: str, user_id: int) -> Optional[ChatSession]:
        """Find a session by ID and user.
        
        Args:
            session_id: Session ID to find
            user_id: User ID (for authorization)
            
        Returns:
            ChatSession if found, None otherwise
        """
        self.logger.debug(f"Finding session: {session_id} for user: {user_id}")
        return self.find_one_by_criteria(
            ChatSession,
            session_id=session_id,
            user_id=user_id
        )
