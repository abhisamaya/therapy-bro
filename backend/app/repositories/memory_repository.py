"""Memory repository for data access operations."""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, delete, func
from app.models import MemoryChunk
import logging


class MemoryRepository:
    """Repository for MemoryChunk data access operations."""
    
    def __init__(self, db_session: Session):
        """Initialize repository with database session.
        
        Args:
            db_session: SQLAlchemy database session
        """
        self.db = db_session
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def create(self, memory_chunk: MemoryChunk) -> MemoryChunk:
        """Create a new memory chunk in the database.
        
        Args:
            memory_chunk: MemoryChunk object to create
            
        Returns:
            Created memory chunk with ID
        """
        self.logger.debug(f"Creating memory chunk: {memory_chunk.chunk_id}")
        self.db.add(memory_chunk)
        self.db.commit()
        self.db.refresh(memory_chunk)
        self.logger.info(f"Created memory chunk: {memory_chunk.chunk_id} (ID: {memory_chunk.id})")
        return memory_chunk
    
    def find_by_id(self, chunk_id: str) -> Optional[MemoryChunk]:
        """Find memory chunk by chunk ID.
        
        Args:
            chunk_id: Chunk ID to find
            
        Returns:
            MemoryChunk if found, None otherwise
        """
        self.logger.debug(f"Finding memory chunk by chunk_id: {chunk_id}")
        query = select(MemoryChunk).where(MemoryChunk.chunk_id == chunk_id)
        chunk = self.db.execute(query).scalar_one_or_none()
        self.logger.debug(f"{'Found' if chunk else 'Not found'} chunk with chunk_id: {chunk_id}")
        return chunk
    
    def find_by_user_id(self, user_id: int, limit: Optional[int] = None) -> List[MemoryChunk]:
        """Find all memory chunks for a user.
        
        Args:
            user_id: User ID to find chunks for
            limit: Optional maximum number of chunks to return
            
        Returns:
            List of MemoryChunk objects
        """
        self.logger.debug(f"Finding memory chunks for user_id: {user_id}")
        query = select(MemoryChunk).where(
            MemoryChunk.user_id == user_id
        ).order_by(MemoryChunk.created_at.desc())
        
        if limit:
            query = query.limit(limit)
        
        chunks = self.db.execute(query).scalars().all()
        self.logger.debug(f"Found {len(chunks)} memory chunks for user_id: {user_id}")
        return chunks
    
    def find_by_session_id(self, session_id: str) -> List[MemoryChunk]:
        """Find all memory chunks for a specific session.
        
        Args:
            session_id: Session ID to find chunks for
            
        Returns:
            List of MemoryChunk objects
        """
        self.logger.debug(f"Finding memory chunks for session_id: {session_id}")
        query = select(MemoryChunk).where(
            MemoryChunk.session_id == session_id
        ).order_by(MemoryChunk.created_at.asc())
        
        chunks = self.db.execute(query).scalars().all()
        self.logger.debug(f"Found {len(chunks)} memory chunks for session_id: {session_id}")
        return chunks
    
    def find_by_user_and_session(self, user_id: int, session_id: str) -> List[MemoryChunk]:
        """Find all memory chunks for a user in a specific session.
        
        Args:
            user_id: User ID for authorization
            session_id: Session ID to find chunks for
            
        Returns:
            List of MemoryChunk objects
        """
        self.logger.debug(f"Finding memory chunks for user {user_id} in session {session_id}")
        query = select(MemoryChunk).where(
            MemoryChunk.user_id == user_id,
            MemoryChunk.session_id == session_id
        ).order_by(MemoryChunk.created_at.asc())
        
        chunks = self.db.execute(query).scalars().all()
        self.logger.debug(f"Found {len(chunks)} memory chunks")
        return chunks
    
    def count_by_user_id(self, user_id: int) -> int:
        """Count total memory chunks for a user.
        
        Args:
            user_id: User ID to count chunks for
            
        Returns:
            Number of chunks
        """
        self.logger.debug(f"Counting memory chunks for user_id: {user_id}")
        query = select(func.count()).select_from(MemoryChunk).where(
            MemoryChunk.user_id == user_id
        )
        count = self.db.execute(query).scalar() or 0
        self.logger.debug(f"User {user_id} has {count} memory chunks")
        return count
    
    def count_by_session_id(self, session_id: str) -> int:
        """Count memory chunks for a specific session.
        
        Args:
            session_id: Session ID to count chunks for
            
        Returns:
            Number of chunks
        """
        self.logger.debug(f"Counting memory chunks for session_id: {session_id}")
        query = select(func.count()).select_from(MemoryChunk).where(
            MemoryChunk.session_id == session_id
        )
        count = self.db.execute(query).scalar() or 0
        self.logger.debug(f"Session {session_id} has {count} memory chunks")
        return count
    
    def delete_by_chunk_id(self, chunk_id: str) -> bool:
        """Delete a specific memory chunk.
        
        Args:
            chunk_id: Chunk ID to delete
            
        Returns:
            True if deleted, False if not found
        """
        self.logger.debug(f"Deleting memory chunk: {chunk_id}")
        stmt = delete(MemoryChunk).where(MemoryChunk.chunk_id == chunk_id)
        result = self.db.execute(stmt)
        self.db.commit()
        
        deleted = result.rowcount > 0
        if deleted:
            self.logger.info(f"Deleted memory chunk: {chunk_id}")
        else:
            self.logger.warning(f"Memory chunk not found: {chunk_id}")
        
        return deleted
    
    def delete_by_session_id(self, session_id: str) -> int:
        """Delete all memory chunks for a specific session.
        
        Args:
            session_id: Session ID whose chunks should be deleted
            
        Returns:
            Number of chunks deleted
        """
        self.logger.debug(f"Deleting memory chunks for session: {session_id}")
        stmt = delete(MemoryChunk).where(MemoryChunk.session_id == session_id)
        result = self.db.execute(stmt)
        self.db.commit()
        
        count = result.rowcount
        self.logger.info(f"Deleted {count} memory chunks for session: {session_id}")
        return count
    
    def delete_by_user_id(self, user_id: int) -> int:
        """Delete all memory chunks for a specific user.
        
        Args:
            user_id: User ID whose chunks should be deleted
            
        Returns:
            Number of chunks deleted
        """
        self.logger.debug(f"Deleting memory chunks for user: {user_id}")
        stmt = delete(MemoryChunk).where(MemoryChunk.user_id == user_id)
        result = self.db.execute(stmt)
        self.db.commit()
        
        count = result.rowcount
        self.logger.info(f"Deleted {count} memory chunks for user: {user_id}")
        return count
    
    def update(self, memory_chunk: MemoryChunk) -> MemoryChunk:
        """Update an existing memory chunk.
        
        Args:
            memory_chunk: MemoryChunk object with updated values
            
        Returns:
            Updated memory chunk
        """
        self.logger.debug(f"Updating memory chunk: {memory_chunk.chunk_id}")
        self.db.add(memory_chunk)
        self.db.commit()
        self.db.refresh(memory_chunk)
        self.logger.info(f"Updated memory chunk: {memory_chunk.chunk_id}")
        return memory_chunk

