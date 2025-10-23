"""Session repository for data access operations."""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models import ChatSession
import logging


class SessionRepository:
    """Repository for ChatSession data access operations."""
    
    def __init__(self, db_session: Session):
        """Initialize repository with database session.
        
        Args:
            db_session: SQLAlchemy database session
        """
        self.db = db_session
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def create(self, session: ChatSession) -> ChatSession:
        """Create a new chat session in the database.
        
        Args:
            session: ChatSession object to create
            
        Returns:
            Created session with ID
        """
        self.logger.debug(f"Creating session: {session.session_id}")
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        self.logger.info(f"Created session: {session.session_id} (ID: {session.id})")
        return session
    
    def find_by_id(self, session_id: str) -> Optional[ChatSession]:
        """Find session by session ID.
        
        Args:
            session_id: Session ID to find
            
        Returns:
            ChatSession if found, None otherwise
        """
        self.logger.debug(f"Finding session by session_id: {session_id}")
        query = select(ChatSession).where(ChatSession.session_id == session_id)
        session = self.db.execute(query).scalar_one_or_none()
        self.logger.debug(f"{'Found' if session else 'Not found'} session with session_id: {session_id}")
        return session
    
    def find_by_user_id(self, user_id: int) -> List[ChatSession]:
        """Find all sessions for a user.
        
        Args:
            user_id: User ID to find sessions for
            
        Returns:
            List of ChatSession objects
        """
        self.logger.debug(f"Finding sessions for user_id: {user_id}")
        query = select(ChatSession).where(ChatSession.user_id == user_id).order_by(ChatSession.id.asc())
        sessions = self.db.execute(query).scalars().all()
        self.logger.debug(f"Found {len(sessions)} sessions for user_id: {user_id}")
        return sessions
    
    def find_by_session_and_user(self, session_id: str, user_id: int) -> Optional[ChatSession]:
        """Find session by session ID and user ID (for authorization).
        
        Args:
            session_id: Session ID to find
            user_id: User ID for authorization
            
        Returns:
            ChatSession if found and belongs to user, None otherwise
        """
        self.logger.debug(f"Finding session {session_id} for user_id: {user_id}")
        query = select(ChatSession).where(
            ChatSession.session_id == session_id,
            ChatSession.user_id == user_id
        )
        session = self.db.execute(query).scalar_one_or_none()
        self.logger.debug(f"{'Found' if session else 'Not found'} session {session_id} for user_id: {user_id}")
        return session
    
    def update(self, session: ChatSession) -> ChatSession:
        """Update an existing session.
        
        Args:
            session: ChatSession object to update
            
        Returns:
            Updated session
        """
        self.logger.debug(f"Updating session: {session.session_id} (ID: {session.id})")
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        self.logger.info(f"Updated session: {session.session_id} (ID: {session.id})")
        return session
    
    def delete(self, session_id: str) -> bool:
        """Delete session by session ID.
        
        Args:
            session_id: Session ID to delete
            
        Returns:
            True if deleted, False if not found
        """
        self.logger.debug(f"Deleting session: {session_id}")
        session = self.find_by_id(session_id)
        if not session:
            self.logger.warning(f"Cannot delete session: {session_id} - not found")
            return False
        self.db.delete(session)
        self.db.commit()
        self.logger.info(f"Deleted session: {session_id}")
        return True
    
    def find_all(self, limit: Optional[int] = None, offset: int = 0) -> List[ChatSession]:
        """Find all sessions with pagination.
        
        Args:
            limit: Maximum number of sessions to return
            offset: Number of sessions to skip
            
        Returns:
            List of ChatSession objects
        """
        self.logger.debug(f"Finding all sessions (limit: {limit}, offset: {offset})")
        query = select(ChatSession).order_by(ChatSession.id.asc())
        if offset:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)
        sessions = self.db.execute(query).scalars().all()
        self.logger.debug(f"Found {len(sessions)} sessions")
        return sessions
