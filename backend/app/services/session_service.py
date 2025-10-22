"""Session service for managing chat session operations."""
import uuid
from typing import List, Optional
from datetime import timedelta, datetime, timezone
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models import ChatSession, Message, WalletTransaction
from app.schemas import SessionStatus, StartSessionIn, MessageIn, NotesIn, ConversationItem, HistoryOut, MessageOut, ExtendSessionOut, StartSessionOut
from app.services.base_service import BaseService
from app.repositories.session_repository import SessionRepository
from app.repositories.message_repository import MessageRepository
from app.repositories.wallet_repository import WalletRepository, TransactionRepository
from app.utils import now_ist, now_utc
from app.config.settings import get_settings


class SessionService(BaseService):
    """Service for chat session operations."""
    
    def __init__(self, db_session: Session):
        """Initialize service with database session.
        
        Args:
            db_session: SQLAlchemy database session
        """
        super().__init__(db_session)
        self.session_repository = SessionRepository(db_session)
        self.message_repository = MessageRepository(db_session)
    
    def list_user_sessions(self, user_id: int) -> List[ConversationItem]:
        """Get all chat sessions for a user.
        
        Args:
            user_id: User ID to get sessions for
            
        Returns:
            List of conversation items
        """
        self.logger.debug(f"Listing sessions for user_id: {user_id}")
        
        sessions = self.session_repository.find_by_user_id(user_id)
        
        # Sort by updated_at desc since find_by_criteria sorts by PK
        sessions.sort(key=lambda s: s.updated_at, reverse=True)
        
        return [
            ConversationItem(
                session_id=session.session_id,
                category=session.category,
                updated_at=session.updated_at.isoformat(),
                notes=session.notes,
                status=self._get_session_status(session),
                remaining_seconds=self._calculate_remaining_seconds(session),
            )
            for session in sessions
        ]
    
    def create_session(self, user_id: int, category: str, system_prompt: str) -> StartSessionOut:
        """Create a new chat session.
        
        Args:
            user_id: User ID creating the session
            category: Session category
            system_prompt: System prompt for the session
            
        Returns:
            StartSessionOut with session details and timer info
            
        Raises:
            Exception: If session creation fails
        """
        self.logger.info(f"Creating new session for user_id: {user_id}, category: {category}")
        
        session_id = uuid.uuid4().hex
        
        try:
            # Create chat session
            # Initialize server-enforced timer for default 5 minutes
            start_time = now_utc()
            # Check if this is the user's first session
            existing = self.session_repository.find_by_user_id(user_id)
            is_first_session = len(existing) == 0

            if is_first_session:
                default_duration = 300
                end_time = start_time + timedelta(seconds=default_duration)
                status = "active"
            else:
                default_duration = 0
                end_time = start_time  # ended immediately
                status = "ended"


            chat_session = ChatSession(
                session_id=session_id,
                user_id=user_id,
                category=category,
                notes=None,
                created_at=start_time,
                updated_at=start_time,
                session_start_time=start_time,
                session_end_time=end_time,
                duration_seconds=default_duration,
                status=status,
            )
            chat_session = self.session_repository.create(chat_session)
            
            # Add system message
            system_message = Message(
                session_id=session_id,
                role="system",
                content=system_prompt,
                created_at=now_utc()
            )
            self.message_repository.create(system_message)
            
            self.logger.info(f"Session created successfully: {session_id}")
            
            # Get wallet info for the user
            wallet_repo = WalletRepository(self.db)
            wallet = wallet_repo.find_by_user_id(user_id)
            
            return StartSessionOut(
                session_id=session_id,
                session_start_time=start_time,
                session_end_time=end_time,
                duration_seconds=default_duration,
                status=SessionStatus.active,  # Add this
                remaining_seconds=max(0, int((end_time - now_utc()).total_seconds())),  # Calculate remaining seconds
                cost_charged=None,  # No cost for initial session
                wallet_balance=str(wallet.balance) if wallet else "0.00",
                wallet_reserved=str(wallet.reserved) if wallet else "0.00"
            )
            
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
        chat_session = self.session_repository.find_by_session_and_user(session_id, user_id)
        
        if not chat_session:
            self.logger.warning(f"Session not found: {session_id} for user: {user_id}")
            raise ValueError("Session not found")
        
        # Get messages
        messages = self.message_repository.find_by_session_id(session_id)
        
        # Sort by created_at asc since find_by_criteria sorts by PK
        messages.sort(key=lambda m: m.created_at)
        
        self.logger.info(f"Retrieved {len(messages)} messages for session: {session_id}")
        
        return HistoryOut(
            session_id=chat_session.session_id,
            category=chat_session.category,
            session_start_time=chat_session.session_start_time,
            session_end_time=chat_session.session_end_time,
            duration_seconds=chat_session.duration_seconds,
            status=self._get_session_status(chat_session),
            remaining_seconds=self._calculate_remaining_seconds(chat_session),
            messages=[MessageOut(role=m.role, content=m.content) for m in messages],
        )

    def extend_session(self, session_id: str, user_id: int, duration_seconds: int, request_id: Optional[str] = None) -> ExtendSessionOut:
        """Extend a session by duration after checking and deducting wallet balance.

        Args:
            session_id: Chat session ID
            user_id: User ID
            duration_seconds: Extension duration in seconds (e.g., 300, 600, ...)
            request_id: Optional idempotency key

        Returns:
            ExtendSessionOut with updated timing and wallet info
        """
        self.logger.info(f"Extending session {session_id} for user {user_id} by {duration_seconds}s")

        # Validate duration
        if duration_seconds <= 0 or duration_seconds % 60 != 0:
            raise ValueError("Invalid duration_seconds")

        settings = get_settings()
        unit_price: Decimal = settings.inr_per_minute
        minutes = Decimal(duration_seconds) / Decimal(60)
        amount = (unit_price * minutes).quantize(Decimal("0.01"))

        # Load session and ensure it belongs to user
        chat_session = self.session_repository.find_by_session_and_user(session_id, user_id)
        if not chat_session:
            raise ValueError("Session not found")

        # Enforce: only allow extending sessions that started today (UTC)
        start_time = chat_session.session_start_time
        if start_time is None:
            raise RuntimeError("NOT_TODAY")
        if getattr(start_time, "tzinfo", None) is None:
            start_time = start_time.replace(tzinfo=timezone.utc)
        if start_time.date() != now_utc().date():
            raise RuntimeError("NOT_TODAY")

        wallet_repo = WalletRepository(self.db)
        tx_repo = TransactionRepository(self.db)
        wallet = wallet_repo.find_by_user_id(user_id)
        if not wallet:
            # create wallet with zero if somehow missing
            from app.models import Wallet
            wallet = Wallet(user_id=user_id, balance=Decimal("0.0000"), reserved=Decimal("0.0000"), currency=settings.wallet_currency)
            wallet_repo.create(wallet)

        if wallet.balance < amount:
            raise RuntimeError("INSUFFICIENT_FUNDS")

        # Deduct and record transaction atomically
        new_balance = (wallet.balance - amount).quantize(Decimal("0.0000"))
        wallet.balance = new_balance
        wallet_repo.update(wallet)

        tx = WalletTransaction(
            wallet_id=wallet.id,
            user_id=user_id,
            type="charge",
            amount=-amount,
            balance_after=new_balance,
            reference_id=f"extend:{session_id}",
            meta={"duration_seconds": int(duration_seconds), "unit_price": str(unit_price), "request_id": request_id} if request_id else {"duration_seconds": int(duration_seconds), "unit_price": str(unit_price)},
        )
        tx_repo.create(tx)

        # Update session timing
        now = now_utc()
        # Normalize potential naive datetimes from SQLite
        end = chat_session.session_end_time
        if end is not None and end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        # If currently active and end time is in future, extend from existing end; else start from now
        base = end if end and end > now else now
        new_end = base + timedelta(seconds=duration_seconds)
        chat_session.session_end_time = new_end
        chat_session.duration_seconds = duration_seconds
        chat_session.status = "active"
        chat_session.updated_at = now
        self.session_repository.update(chat_session)

        remaining_seconds = max(0, int((new_end - now).total_seconds()))

        return ExtendSessionOut(
            session_id=chat_session.session_id,
            session_start_time=chat_session.session_start_time,
            session_end_time=chat_session.session_end_time,
            duration_seconds=chat_session.duration_seconds,
            remaining_seconds=remaining_seconds,
            cost_charged=str(amount),
            wallet_balance=str(new_balance),
            wallet_reserved=str(wallet.reserved),
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
        chat_session = self.session_repository.find_by_session_and_user(session_id, user_id)
        
        if not chat_session:
            self.logger.warning(f"Session not found: {session_id} for user: {user_id}")
            raise ValueError("Session not found")
        
        # Add user message
        user_message = Message(
            session_id=session_id,
            role="user",
            content=content,
            created_at=now_utc()
        )
        self.message_repository.create(user_message)
        
        # Update session timestamp
        chat_session.updated_at = now_utc()
        self.session_repository.update(chat_session)
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
            created_at=now_utc()
        )
        self.message_repository.create(assistant_message)
        self.logger.debug(f"Assistant message added to session: {session_id}")
    
    def get_conversation_history(self, session_id: str) -> List[dict]:
        """Get conversation history for LLM processing.
        
        Args:
            session_id: Session ID to get history for
            
        Returns:
            List of message dictionaries for LLM
        """
        self.logger.debug(f"Building conversation history for session: {session_id}")
        
        messages = self.message_repository.find_by_session_id(session_id)
        
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
        
        chat_session = self.session_repository.find_by_session_and_user(session_id, user_id)
        
        if not chat_session:
            self.logger.warning(f"Session not found: {session_id} for user: {user_id}")
            raise ValueError("Session not found")
        
        chat_session.notes = notes
        chat_session.updated_at = now_utc()
        
        self.session_repository.update(chat_session)
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
        
        chat_session = self.session_repository.find_by_session_and_user(session_id, user_id)
        
        if not chat_session:
            self.logger.warning(f"Session not found: {session_id} for user: {user_id}")
            raise ValueError("Session not found")
        
        # Delete all messages for this session
        self.message_repository.delete_by_session_id(session_id)
        
        # Delete the chat session
        self.session_repository.delete(session_id)
        
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
        return self.session_repository.find_by_session_and_user(session_id, user_id)
    
    def _get_session_status(self, session: ChatSession) -> str:
        """Get session status based on timing and status field."""
        from app.schemas import SessionStatus
        
        # Check explicit status first
        if hasattr(session, 'status') and session.status:
            if session.status == "ended":
                return SessionStatus.ended
            elif session.status == "active":
                # Verify it's still within time bounds
                if session.session_end_time:
                    now = now_utc()
                    end_time = session.session_end_time
                    if getattr(end_time, "tzinfo", None) is None:
                        end_time = end_time.replace(tzinfo=timezone.utc)
                    if end_time <= now:
                        return SessionStatus.ended
                return SessionStatus.active
        
        # Fallback: check timing
        if session.session_end_time:
            now = now_utc()
            end_time = session.session_end_time
            if getattr(end_time, "tzinfo", None) is None:
                end_time = end_time.replace(tzinfo=timezone.utc)
            if end_time <= now:
                return SessionStatus.ended
        
        return SessionStatus.active
    
    def _calculate_remaining_seconds(self, session: ChatSession) -> int:
        """Calculate remaining seconds for a session."""
        if not session.session_end_time:
            return 0
        
        now = now_utc()
        end_time = session.session_end_time
        if getattr(end_time, "tzinfo", None) is None:
            end_time = end_time.replace(tzinfo=timezone.utc)
        
        remaining = int((end_time - now).total_seconds())
        return max(0, remaining)
