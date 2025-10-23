"""Message repository for data access operations."""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models import Message
import logging


class MessageRepository:
    """Repository for Message data access operations."""
    
    def __init__(self, db_session: Session):
        """Initialize repository with database session.
        
        Args:
            db_session: SQLAlchemy database session
        """
        self.db = db_session
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def create(self, message: Message) -> Message:
        """Create a new message in the database.
        
        Args:
            message: Message object to create
            
        Returns:
            Created message with ID
        """
        self.logger.debug(f"Creating message for session: {message.session_id}")
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        self.logger.info(f"Created message: {message.role} (ID: {message.id})")
        return message
    
    def find_by_id(self, message_id: int) -> Optional[Message]:
        """Find message by ID.
        
        Args:
            message_id: Message ID to find
            
        Returns:
            Message if found, None otherwise
        """
        self.logger.debug(f"Finding message by ID: {message_id}")
        message = self.db.get(Message, message_id)
        self.logger.debug(f"{'Found' if message else 'Not found'} message with ID: {message_id}")
        return message
    
    def find_by_session_id(self, session_id: str) -> List[Message]:
        """Find all messages for a session.
        
        Args:
            session_id: Session ID to find messages for
            
        Returns:
            List of Message objects ordered by creation time
        """
        self.logger.debug(f"Finding messages for session: {session_id}")
        query = select(Message).where(Message.session_id == session_id).order_by(Message.id.asc())
        messages = self.db.execute(query).scalars().all()
        self.logger.debug(f"Found {len(messages)} messages for session: {session_id}")
        return messages
    
    def find_by_session_and_role(self, session_id: str, role: str) -> List[Message]:
        """Find messages for a session by role.
        
        Args:
            session_id: Session ID to find messages for
            role: Message role (user, assistant, system)
            
        Returns:
            List of Message objects with specified role
        """
        self.logger.debug(f"Finding {role} messages for session: {session_id}")
        query = select(Message).where(
            Message.session_id == session_id,
            Message.role == role
        ).order_by(Message.id.asc())
        messages = self.db.execute(query).scalars().all()
        self.logger.debug(f"Found {len(messages)} {role} messages for session: {session_id}")
        return messages
    
    def update(self, message: Message) -> Message:
        """Update an existing message.
        
        Args:
            message: Message object to update
            
        Returns:
            Updated message
        """
        self.logger.debug(f"Updating message: {message.role} (ID: {message.id})")
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        self.logger.info(f"Updated message: {message.role} (ID: {message.id})")
        return message
    
    def delete(self, message_id: int) -> bool:
        """Delete message by ID.
        
        Args:
            message_id: Message ID to delete
            
        Returns:
            True if deleted, False if not found
        """
        self.logger.debug(f"Deleting message with ID: {message_id}")
        message = self.find_by_id(message_id)
        if not message:
            self.logger.warning(f"Cannot delete message with ID: {message_id} - not found")
            return False
        self.db.delete(message)
        self.db.commit()
        self.logger.info(f"Deleted message: {message.role} (ID: {message_id})")
        return True
    
    def delete_by_session_id(self, session_id: str) -> int:
        """Delete all messages for a session.
        
        Args:
            session_id: Session ID to delete messages for
            
        Returns:
            Number of messages deleted
        """
        self.logger.debug(f"Deleting all messages for session: {session_id}")
        query = select(Message).where(Message.session_id == session_id)
        messages = self.db.execute(query).scalars().all()
        deleted_count = len(messages)
        
        for message in messages:
            self.db.delete(message)
        self.db.commit()
        
        self.logger.info(f"Deleted {deleted_count} messages for session: {session_id}")
        return deleted_count
    
    def find_all(self, limit: Optional[int] = None, offset: int = 0) -> List[Message]:
        """Find all messages with pagination.
        
        Args:
            limit: Maximum number of messages to return
            offset: Number of messages to skip
            
        Returns:
            List of Message objects
        """
        self.logger.debug(f"Finding all messages (limit: {limit}, offset: {offset})")
        query = select(Message).order_by(Message.id.asc())
        if offset:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)
        messages = self.db.execute(query).scalars().all()
        self.logger.debug(f"Found {len(messages)} messages")
        return messages
