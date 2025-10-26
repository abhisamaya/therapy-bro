"""Message service for handling LLM interactions and streaming."""
import json
import logging
import os
from typing import List, Dict, Iterable, Generator
from fastapi.responses import StreamingResponse
from app.services.base_service import BaseService
from app.services.llm_factory import get_llm_factory, LLMStreamer
from app.services.session_service import SessionService
from datetime import timezone
from app.utils import now_utc
from app.repositories.session_repository import SessionRepository
from app.config.settings import get_settings


class MessageService(BaseService):
    """Service for handling message operations and LLM interactions."""
    
    def __init__(self, db_session):
        """Initialize message service.
        
        Args:
            db_session: Database session
        """
        super().__init__(db_session)
        self.session_service = SessionService(db_session)
    
    def process_message_stream(self, session_id: str, user_id: int, content: str, provider: str = None) -> StreamingResponse:
        """Process a user message and stream LLM response.
        
        Args:
            session_id: Session ID to add message to
            user_id: User ID (for authorization)
            content: User message content
            provider: LLM provider to use (optional)
            
        Returns:
            StreamingResponse with LLM response
            
        Raises:
            ValueError: If session not found
            RuntimeError: If LLM processing fails
        """
        self.logger.info(f"Processing message stream for session: {session_id}, user: {user_id}")
        self.logger.debug(f"Message length: {len(content)} characters")
        
        try:
            # Enforce server-side timer: reject if expired/not active
            repo = SessionRepository(self.db)
            chat_session = repo.find_by_session_and_user(session_id, user_id)
            if not chat_session:
                raise ValueError("Session not found")
            now = now_utc()
            end = chat_session.session_end_time
            if end is not None and getattr(end, "tzinfo", None) is None:
                end = end.replace(tzinfo=timezone.utc)
            # Block if session not active or time elapsed
            if getattr(chat_session, "status", "ended") != "active" or (end is not None and end <= now):
                self.logger.info(f"Blocking send: session expired for {session_id}")
                # Finalize-on-expiry: chunk and store session memory once when expired
                try:
                    settings = get_settings()
                    if settings.memory_enabled:
                        from app.services.memory_chunker import MemoryChunkerService
                        from app.repositories.memory_repository import MemoryRepository
                        # Only chunk if there are meaningful messages
                        messages = self.session_service.message_repository.find_by_session_id(session_id)
                        if len(messages) > 1:
                            # Avoid duplicate chunking for same session
                            mem_repo = MemoryRepository(self.db)
                            if mem_repo.count_by_session_id(session_id) == 0:
                                chunker = MemoryChunkerService(self.db)
                                chunker.chunk_and_store_session(session_id, user_id, messages)
                                self.logger.info(f"Finalized memory for expired session {session_id}")
                except Exception as e:
                    self.logger.warning(f"Finalize-on-expiry memory store failed for {session_id}: {str(e)}")
                raise RuntimeError("SESSION_EXPIRED")

            # Add user message to session
            self.session_service.add_user_message(session_id, content, user_id)
            self.logger.debug(f"User message persisted for session: {session_id}")

            # Build conversation history for LLM with memory enrichment
            base_history = self.session_service.get_conversation_history(session_id)
            self.logger.debug(f"Built base conversation history with {len(base_history)} messages")
            
            # Check if memory system is enabled
            settings = get_settings()
            memory_enabled = settings.memory_enabled
            
            if memory_enabled:
                try:
                    # Use memory agent to enrich with past context
                    from app.services.memory_agent import MemoryAgent
                    
                    memory_agent = MemoryAgent(self.db)
                    wire = memory_agent.process(
                        user_id=user_id,
                        session_id=session_id,
                        message=content,
                        history=base_history
                    )
                    self.logger.info(f"Memory agent enriched context for session: {session_id}")
                except Exception as e:
                    self.logger.warning(f"Memory agent failed, using base history: {str(e)}")
                    wire = base_history
            else:
                self.logger.debug("Memory system disabled, using base history")
                wire = base_history
            
            self.logger.debug(f"Final conversation context has {len(wire)} messages")
            
        except ValueError as e:
            self.logger.warning(f"Session not found: {session_id} for user: {user_id}")
            raise ValueError(f"Session not found: {session_id}")
        except RuntimeError as e:
            if str(e) == "SESSION_EXPIRED":
                # Map to HTTP 403 via router handler
                raise RuntimeError("SESSION_EXPIRED")
            raise

        # Create LLM streamer
        try:
            llm_factory = get_llm_factory()
            streamer = llm_factory.create_streamer(provider=provider)
            self.logger.info(f"Using LLM provider: {provider or 'default'}, model: {getattr(streamer, 'model', 'unknown')}")
        except Exception as e:
            self.logger.error(f"Failed to create LLM streamer: {str(e)}")
            raise RuntimeError(f"Failed to create LLM streamer: {str(e)}")

        def ndjson_stream() -> Generator[bytes, None, None]:
            """Generate NDJSON stream for LLM response."""
            assembled: List[str] = []
            try:
                self.logger.info(f"Starting LLM stream for session: {session_id}")
                for tok in streamer.stream_chat(wire):
                    assembled.append(tok)
                    yield (json.dumps({"type": "delta", "content": tok}) + "\n").encode("utf-8")
                    
            except Exception as e:
                self.logger.error(f"LLM streaming error for session {session_id}: {str(e)}")
                yield (json.dumps({"type": "delta", "content": "[Error streaming, please retry]"}) + "\n").encode("utf-8")
                
            finally:
                full = "".join(assembled)
                self.logger.info(f"LLM response completed for session {session_id}, length: {len(full)} characters")
                
                # Persist assistant message
                try:
                    self.session_service.add_assistant_message(session_id, full)
                    self.logger.debug(f"Assistant message persisted for session: {session_id}")
                except Exception as e:
                    self.logger.error(f"Failed to persist assistant message for session {session_id}: {str(e)}")
                
                yield (json.dumps({"type": "done"}) + "\n").encode("utf-8")

        return StreamingResponse(ndjson_stream(), media_type="application/x-ndjson")
    
    def get_conversation_history(self, session_id: str) -> List[Dict[str, str]]:
        """Get conversation history for a session.
        
        Args:
            session_id: Session ID to get history for
            
        Returns:
            List of message dictionaries
        """
        self.logger.debug(f"Getting conversation history for session: {session_id}")
        return self.session_service.get_conversation_history(session_id)
    
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
        self.session_service.add_user_message(session_id, content, user_id)
    
    def add_assistant_message(self, session_id: str, content: str) -> None:
        """Add an assistant message to a session.
        
        Args:
            session_id: Session ID to add message to
            content: Message content
        """
        self.logger.debug(f"Adding assistant message to session: {session_id}")
        self.session_service.add_assistant_message(session_id, content)
    
    def validate_session_access(self, session_id: str, user_id: int) -> bool:
        """Validate that a user has access to a session.
        
        Args:
            session_id: Session ID to validate
            user_id: User ID to validate access for
            
        Returns:
            True if user has access, False otherwise
        """
        self.logger.debug(f"Validating session access: {session_id} for user: {user_id}")
        session = self.session_service.find_session_by_id(session_id, user_id)
        return session is not None
