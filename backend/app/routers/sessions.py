"""Sessions router for TherapyBro backend."""
import os
import logging
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse

from app.db import get_session
from app.models import User
from app.schemas import (
    StartSessionIn, StartSessionOut, MessageIn, MessageOut, HistoryOut,
    ConversationItem, NotesIn, ExtendSessionIn, ExtendSessionOut
)
from app.prompts import system_prompt_for
from app.auth import get_current_user
from app.dependencies import get_session_service, get_message_service
from app.services.session_service import SessionService
from app.services.message_service import MessageService
from app.logging_config import get_logger

# Create logger for sessions router
sessions_router_logger = get_logger('sessions_router')

# Create router
router = APIRouter(prefix="/api", tags=["sessions"])


@router.get("/chats", response_model=List[ConversationItem])
def list_chats(user: User = Depends(get_current_user), session_service: SessionService = Depends(get_session_service)):
    """Get list of user's chat sessions."""
    return session_service.list_user_sessions(user.id)


@router.post("/sessions", response_model=StartSessionOut)
def start_session(payload: StartSessionIn, user: User = Depends(get_current_user), session_service: SessionService = Depends(get_session_service)):
    """Start a new chat session."""
    sessions_router_logger.info(f"Starting new session for user: {user.login_id}, category: {payload.category}")
    
    system_prompt = system_prompt_for(payload.category)
    
    try:
        session_out = session_service.create_session(user.id, payload.category, system_prompt)
        sessions_router_logger.info(f"Session created successfully: {session_out.session_id} for user: {user.login_id}")
        return session_out
    except Exception as e:
        sessions_router_logger.error(f"Failed to create session for user {user.login_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create session")


@router.get("/sessions/{session_id}", response_model=HistoryOut)
def get_history(session_id: str, user: User = Depends(get_current_user)):
    """Get chat history for a specific session."""
    sessions_router_logger.info(f"Retrieving history for session: {session_id}, user: {user.login_id}")
    
    try:
        with get_session() as db:
            session_service = SessionService(db)
            return session_service.get_session_history(session_id, user.id)
    except ValueError as e:
        sessions_router_logger.warning(f"Session not found: {session_id} for user: {user.login_id}")
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/sessions/{session_id}/notes")
def put_notes(session_id: str, payload: NotesIn, user: User = Depends(get_current_user)):
    """Update session notes."""
    try:
        with get_session() as db:
            session_service = SessionService(db)
            session_service.update_session_notes(session_id, payload.notes, user.id)
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, user: User = Depends(get_current_user)):
    """Delete a chat session."""
    try:
        with get_session() as db:
            session_service = SessionService(db)
            session_service.delete_session(session_id, user.id)
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/sessions/{session_id}/messages")
def send_message(session_id: str, payload: MessageIn, user: User = Depends(get_current_user), message_service: MessageService = Depends(get_message_service)):
    """Send a message to a chat session and get streaming response."""
    sessions_router_logger.info(f"Processing message for session: {session_id}, user: {user.login_id}")
    sessions_router_logger.debug(f"Message length: {len(payload.content)} characters")
    
    try:
        # Get provider from environment or use default
        provider = os.getenv("LLM_PROVIDER", "anthropic").strip().lower()
        
        # Process message and get streaming response
        return message_service.process_message_stream(
            session_id, user.id, payload.content, provider
        )
            
    except ValueError as e:
        sessions_router_logger.warning(f"Session not found: {session_id} for user: {user.login_id}")
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        if str(e) == "SESSION_EXPIRED":
            raise HTTPException(status_code=403, detail="Session has ended. Please extend to continue.")
        sessions_router_logger.error(f"LLM processing error for session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="LLM processing failed")


@router.post("/sessions/{session_id}/extend", response_model=ExtendSessionOut)
def extend_session(session_id: str, payload: ExtendSessionIn, user: User = Depends(get_current_user), session_service: SessionService = Depends(get_session_service)):
    """Extend a session after charging wallet based on duration."""
    try:
        return session_service.extend_session(session_id, user.id, payload.duration_seconds, payload.request_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        if str(e) == "INSUFFICIENT_FUNDS":
            raise HTTPException(status_code=402, detail="Insufficient wallet balance")
        if str(e) == "NOT_TODAY":
            raise HTTPException(status_code=403, detail="Only today's sessions (UTC) can be extended")
        raise HTTPException(status_code=500, detail="Failed to extend session")
