"""Memory chunker service for splitting conversations into semantic chunks."""
import uuid
import logging
from typing import List, Tuple
from sqlalchemy.orm import Session
from app.models import Message, MemoryChunk
from app.services.vector_store import get_vector_store
from app.repositories.memory_repository import MemoryRepository
from app.utils import now_utc


logger = logging.getLogger(__name__)


class MemoryChunkerService:
    """Service for chunking conversations and storing them in vector DB."""
    
    def __init__(self, db_session: Session):
        """
        Initialize memory chunker service.
        
        Args:
            db_session: SQLAlchemy database session
        """
        self.db = db_session
        self.vector_store = get_vector_store()
        self.memory_repo = MemoryRepository(db_session)
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def chunk_and_store_session(
        self, 
        session_id: str, 
        user_id: int, 
        messages: List[Message]
    ) -> int:
        """
        Chunk a completed session and store in vector DB and SQL.
        
        Args:
            session_id: Session ID to chunk
            user_id: User ID who owns the session
            messages: List of messages from the session
            
        Returns:
            Number of chunks created
        """
        self.logger.info(f"Chunking session {session_id} for user {user_id}")
        
        # Create semantic chunks from messages
        chunks = self._create_semantic_chunks(messages)
        
        if not chunks:
            self.logger.warning(f"No chunks created for session {session_id}")
            return 0
        
        chunks_created = 0
        
        for chunk_text, msg_ids in chunks:
            try:
                chunk_id = uuid.uuid4().hex
                
                # Store in ChromaDB with embeddings
                self.vector_store.add_memory(
                    chunk_id=chunk_id,
                    text=chunk_text,
                    metadata={
                        "user_id": user_id,
                        "session_id": session_id,
                        "timestamp": now_utc().isoformat(),
                        "message_count": len(msg_ids)
                    }
                )
                
                # Store metadata in SQL for tracking
                chunk_model = MemoryChunk(
                    chunk_id=chunk_id,
                    user_id=user_id,
                    session_id=session_id,
                    chunk_text=chunk_text[:500],  # Store preview (first 500 chars)
                    message_ids=",".join(map(str, msg_ids)),
                    chunk_type="conversation",
                    created_at=now_utc()
                )
                
                self.memory_repo.create(chunk_model)
                chunks_created += 1
                
                self.logger.debug(
                    f"Created chunk {chunk_id} with {len(msg_ids)} messages"
                )
                
            except Exception as e:
                self.logger.error(
                    f"Failed to create chunk for session {session_id}: {str(e)}"
                )
                # Continue with other chunks even if one fails
                continue
        
        # Log success (commits already happened in create())
        self.logger.info(
            f"Successfully stored {chunks_created} chunks for session {session_id}"
        )
        
        return chunks_created
    
    def _create_semantic_chunks(
        self, 
        messages: List[Message]
    ) -> List[Tuple[str, List[int]]]:
        """
        Split messages into meaningful conversation chunks.
        
        Strategy: Group user-assistant exchanges into chunks of 3 exchanges (6 messages)
        This provides enough context without making chunks too large.
        
        Args:
            messages: List of messages to chunk
            
        Returns:
            List of tuples (chunk_text, message_ids)
        """
        chunks = []
        current_chunk = []
        current_ids = []
        
        for msg in messages:
            # Skip system messages - they're not part of the conversation flow
            if msg.role == "system":
                continue
            
            # Format: "role: content"
            current_chunk.append(f"{msg.role}: {msg.content}")
            current_ids.append(msg.id)
            
            # Create chunk every 6 messages (3 user-assistant exchanges)
            # This balances context richness with retrieval granularity
            if len(current_chunk) >= 6:
                chunk_text = "\n".join(current_chunk)
                chunks.append((chunk_text, current_ids.copy()))
                
                # Reset for next chunk
                current_chunk = []
                current_ids = []
        
        # Add remaining messages as final chunk if any exist
        if current_chunk:
            chunk_text = "\n".join(current_chunk)
            chunks.append((chunk_text, current_ids))
        
        self.logger.debug(f"Created {len(chunks)} semantic chunks")
        return chunks
    
    def delete_session_chunks(self, session_id: str) -> bool:
        """
        Delete all memory chunks for a specific session.
        
        Args:
            session_id: Session ID whose chunks should be deleted
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Delete from vector store
            self.vector_store.delete_session_memories(session_id)
            
            # Delete from SQL using repository
            count = self.memory_repo.delete_by_session_id(session_id)
            
            self.logger.info(f"Deleted {count} chunks for session {session_id}")
            return True
            
        except Exception as e:
            self.logger.error(
                f"Failed to delete chunks for session {session_id}: {str(e)}"
            )
            return False
    
    def delete_user_chunks(self, user_id: int) -> bool:
        """
        Delete all memory chunks for a specific user.
        
        Args:
            user_id: User ID whose chunks should be deleted
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Delete from vector store
            self.vector_store.delete_user_memories(user_id)
            
            # Delete from SQL using repository
            count = self.memory_repo.delete_by_user_id(user_id)
            
            self.logger.info(f"Deleted {count} chunks for user {user_id}")
            return True
            
        except Exception as e:
            self.logger.error(
                f"Failed to delete chunks for user {user_id}: {str(e)}"
            )
            return False
    
    def get_session_chunk_count(self, session_id: str) -> int:
        """
        Get the number of memory chunks for a session.
        
        Args:
            session_id: Session ID to count chunks for
            
        Returns:
            Number of chunks
        """
        try:
            return self.memory_repo.count_by_session_id(session_id)
        except Exception as e:
            self.logger.error(
                f"Failed to count chunks for session {session_id}: {str(e)}"
            )
            return 0
    
    def get_user_chunk_count(self, user_id: int) -> int:
        """
        Get the total number of memory chunks for a user.
        
        Args:
            user_id: User ID to count chunks for
            
        Returns:
            Number of chunks
        """
        try:
            return self.memory_repo.count_by_user_id(user_id)
        except Exception as e:
            self.logger.error(
                f"Failed to count chunks for user {user_id}: {str(e)}"
            )
            return 0

