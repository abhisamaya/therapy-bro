"""Vector store service for managing ChromaDB memory storage."""
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Optional
import logging
import os
from app.config.settings import get_settings

logger = logging.getLogger(__name__)


class VectorStoreService:
    """Service for managing vector embeddings in ChromaDB."""
    
    def __init__(self, persist_directory: Optional[str] = None):
        """
        Initialize ChromaDB client with persistent storage.
        
        Args:
            persist_directory: Directory path for ChromaDB persistence (uses settings if None)
        """
        try:
            # Get persist directory from settings if not provided
            if persist_directory is None:
                settings = get_settings()
                persist_directory = settings.chroma_persist_directory
            
            # Embedded ChromaDB - stores in specified directory
            self.client = chromadb.PersistentClient(
                path=persist_directory,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Get or create collection for therapy memories
            self.collection = self.client.get_or_create_collection(
                name="therapybro_memories",
                metadata={"hnsw:space": "cosine"}  # Use cosine similarity
            )
            
            logger.info(f"VectorStoreService initialized with collection: {self.collection.name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize VectorStoreService: {str(e)}")
            raise
    
    def add_memory(self, chunk_id: str, text: str, metadata: Dict) -> None:
        """
        Add a memory chunk to the vector store.
        
        Args:
            chunk_id: Unique identifier for the chunk
            text: Text content to be embedded
            metadata: Metadata dictionary (must include user_id for filtering)
        
        Raises:
            ValueError: If metadata doesn't include user_id
        """
        if "user_id" not in metadata:
            raise ValueError("metadata must include 'user_id' for multi-user isolation")
        
        try:
            self.collection.add(
                ids=[chunk_id],
                documents=[text],
                metadatas=[metadata]
            )
            logger.debug(f"Added memory chunk {chunk_id} for user {metadata['user_id']}")
            
        except Exception as e:
            logger.error(f"Failed to add memory chunk {chunk_id}: {str(e)}")
            raise
    
    def search_memories(
        self,
        query: str,
        user_id: int,
        limit: Optional[int] = None,
        min_similarity: Optional[float] = None
    ) -> Dict:
        """
        Search for relevant memories using semantic similarity.
        
        Args:
            query: Search query text
            user_id: User ID to filter memories (ensures isolation)
            limit: Maximum number of results to return (uses settings if None)
            min_similarity: Optional minimum similarity threshold (uses settings if None)
        
        Returns:
            Dictionary with 'documents', 'metadatas', 'distances', and 'ids'
        """
        try:
            # Get defaults from settings if not provided
            if limit is None or min_similarity is None:
                settings = get_settings()
                if limit is None:
                    limit = settings.memory_retrieval_limit
                if min_similarity is None:
                    min_similarity = settings.memory_min_similarity
            results = self.collection.query(
                query_texts=[query],
                n_results=limit,
                where={"user_id": user_id}  # User isolation via metadata filtering
            )
            
            # Filter by similarity threshold if provided
            if min_similarity is not None and results.get('distances'):
                filtered_results = {
                    'documents': [[]],
                    'metadatas': [[]],
                    'distances': [[]],
                    'ids': [[]]
                }
                
                for i, distance in enumerate(results['distances'][0]):
                    # ChromaDB uses distance (lower is better), convert to similarity
                    similarity = 1 - distance
                    if similarity >= min_similarity:
                        filtered_results['documents'][0].append(results['documents'][0][i])
                        filtered_results['metadatas'][0].append(results['metadatas'][0][i])
                        filtered_results['distances'][0].append(distance)
                        filtered_results['ids'][0].append(results['ids'][0][i])
                
                results = filtered_results
            
            logger.debug(f"Found {len(results.get('documents', [[]])[0])} memories for user {user_id}")
            return results
            
        except Exception as e:
            logger.error(f"Failed to search memories for user {user_id}: {str(e)}")
            # Return empty results on error
            return {'documents': [[]], 'metadatas': [[]], 'distances': [[]], 'ids': [[]]}
    
    def delete_memory(self, chunk_id: str) -> None:
        """
        Delete a specific memory chunk.
        
        Args:
            chunk_id: Unique identifier of the chunk to delete
        """
        try:
            self.collection.delete(ids=[chunk_id])
            logger.debug(f"Deleted memory chunk {chunk_id}")
            
        except Exception as e:
            logger.error(f"Failed to delete memory chunk {chunk_id}: {str(e)}")
            raise
    
    def delete_user_memories(self, user_id: int) -> None:
        """
        Delete all memories for a specific user.
        
        Args:
            user_id: User ID whose memories should be deleted
        """
        try:
            self.collection.delete(where={"user_id": user_id})
            logger.info(f"Deleted all memories for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to delete memories for user {user_id}: {str(e)}")
            raise
    
    def delete_session_memories(self, session_id: str) -> None:
        """
        Delete all memories from a specific session.
        
        Args:
            session_id: Session ID whose memories should be deleted
        """
        try:
            self.collection.delete(where={"session_id": session_id})
            logger.debug(f"Deleted all memories for session {session_id}")
            
        except Exception as e:
            logger.error(f"Failed to delete memories for session {session_id}: {str(e)}")
            raise
    
    def get_collection_stats(self) -> Dict:
        """
        Get statistics about the vector store collection.
        
        Returns:
            Dictionary with collection statistics
        """
        try:
            count = self.collection.count()
            return {
                "name": self.collection.name,
                "count": count,
                "metadata": self.collection.metadata
            }
        except Exception as e:
            logger.error(f"Failed to get collection stats: {str(e)}")
            return {"error": str(e)}
    
    def reset_collection(self) -> None:
        """
        Reset the entire collection (delete all memories).
        WARNING: This is destructive and should only be used in development/testing.
        """
        try:
            self.client.delete_collection(name="therapybro_memories")
            self.collection = self.client.create_collection(
                name="therapybro_memories",
                metadata={"hnsw:space": "cosine"}
            )
            logger.warning("Collection reset - all memories deleted")
            
        except Exception as e:
            logger.error(f"Failed to reset collection: {str(e)}")
            raise


# Singleton instance for reuse across services
_vector_store_instance: Optional[VectorStoreService] = None


def get_vector_store() -> VectorStoreService:
    """
    Get or create a singleton instance of VectorStoreService.
    
    Returns:
        VectorStoreService instance
    """
    global _vector_store_instance
    
    if _vector_store_instance is None:
        persist_dir = os.getenv("CHROMA_PERSIST_DIRECTORY", "./chroma_db")
        _vector_store_instance = VectorStoreService(persist_directory=persist_dir)
    
    return _vector_store_instance

