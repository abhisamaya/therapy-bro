from __future__ import annotations
import json, os, uuid, logging, time
from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from app.db import init_db, get_session
from app.models import User, ChatSession, Message, Wallet, WalletTransaction
from app.schemas import (
    RegisterIn, LoginIn, TokenOut,
    StartSessionIn, StartSessionOut, MessageIn, MessageOut, HistoryOut,
    ConversationItem, NotesIn, UpdateProfileIn, WalletOut, CreateWalletOut,
)
from app.utils import now_ist, hash_password, verify_password, create_access_token, JWT_EXPIRE_MIN
from app.prompts import system_prompt_for
from app.openai_client import OpenAIStreamer
from app.anthropic_client import AnthropicStreamer
from app.together_client import TogetherStreamer
from app.auth import get_current_user

from app.google_auth import google_auth_service
from app.schemas import GoogleAuthIn, UserOut

from fastapi import Cookie, Response
from typing import Optional
from sqlalchemy import select, delete

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

# Create specific loggers
logger = logging.getLogger(__name__)
login_logger = logging.getLogger('login_debug')
google_logger = logging.getLogger('google_auth')
auth_logger = logging.getLogger('auth')
db_logger = logging.getLogger('database')
session_logger = logging.getLogger('session')
llm_logger = logging.getLogger('llm')

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- startup ---
    logger.info("Starting TherapyBro application")
    init_db()
    logger.info("Database initialized successfully")
    yield
    # --- shutdown ---
    logger.info("Shutting down TherapyBro application")

app = FastAPI(title="Auth Chat API", version="1.0.0", lifespan=lifespan)

# Get allowed origins - when using credentials, cannot use "*"
allowed_origins = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000").split(",")

# Add common development origins
if "http://localhost:3000" not in allowed_origins:
    allowed_origins.append("http://localhost:3000")

# Add both www and non-www versions for production
production_origins_to_add = []
for origin in list(allowed_origins):
    if origin.startswith("https://"):
        # If it has www, add non-www version
        if "://www." in origin:
            production_origins_to_add.append(origin.replace("://www.", "://"))
        # If it doesn't have www, add www version
        else:
            domain = origin.replace("https://", "")
            production_origins_to_add.append(f"https://www.{domain}")

allowed_origins.extend(production_origins_to_add)

logger.info(f"Allowed CORS origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Add request/response logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Log incoming request
    logger.info(f"Request: {request.method} {request.url}")
    logger.debug(f"Request headers: {dict(request.headers)}")
    
    # Process request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time.time() - start_time
    
    # Log response
    logger.info(f"Response: {response.status_code} - {request.method} {request.url} - {process_time:.3f}s")
    
    return response

@app.get("/health")
def health():
    return {"status": "ok"}

# Handle OPTIONS requests for CORS preflight
from fastapi import Response as FastAPIResponse

@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    return FastAPIResponse(status_code=200)

# ---------- Auth ----------
@app.post("/auth/register", response_model=TokenOut)
def register(payload: RegisterIn):
    logger.info(f"Registration attempt for login_id: {payload.login_id}")
    
    from .db import get_session
    with get_session() as db:
        from app.services.user_service import UserService
        user_service = UserService(db)
        user = user_service.create_user(payload)

    token = create_access_token(payload.login_id)
    logger.info(f"Registration completed successfully for: {payload.login_id}")
    return TokenOut(access_token=token)

@app.post("/auth/login", response_model=TokenOut)
def login(payload: LoginIn):
    logger.info(f"Login attempt for login_id: {payload.login_id}")
    
    with get_session() as db:
        from app.services.user_service import UserService
        user_service = UserService(db)
        user = user_service.authenticate_user(payload.login_id, payload.password)
        if not user:
            logger.warning(f"Login failed - invalid credentials for: {payload.login_id}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(payload.login_id)
    logger.info(f"Login successful for: {payload.login_id}")
    return TokenOut(access_token=token)

@app.get("/auth/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    with get_session() as db:
        from app.services.user_service import UserService
        user_service = UserService(db)
        return user_service.get_user_profile(user)

@app.put("/auth/profile")
def update_profile(payload: UpdateProfileIn, user: User = Depends(get_current_user)):
    logger.info(f"Profile update request for user: {user.login_id}")
    logger.debug(f"Payload: name={payload.name}, phone={payload.phone}, age={payload.age}")

    try:
        with get_session() as db:
            from app.services.user_service import UserService
            user_service = UserService(db)
            updated_user = user_service.update_user_profile(user.id, payload)

            return {
                "ok": True,
                "user": {
                    "login_id": updated_user.login_id,
                    "name": updated_user.name,
                    "email": updated_user.email,
                    "avatar_url": updated_user.avatar_url,
                    "auth_provider": updated_user.auth_provider,
                    "phone": updated_user.phone,
                    "age": updated_user.age
                }
            }
    except ValueError as e:
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

# ---------- Chat ----------
@app.get("/api/chats", response_model=List[ConversationItem])
def list_chats(user: User = Depends(get_current_user)):
    with get_session() as db:
        rows = (
            db.exec(select(ChatSession).where(ChatSession.user_id == user.id).order_by(ChatSession.updated_at.desc())).scalars().all()
        )
        return [
            ConversationItem(
                session_id=r.session_id,
                category=r.category,
                updated_at=r.updated_at.isoformat(),
                notes=r.notes,
            )
            for r in rows
        ]

@app.post("/api/sessions", response_model=StartSessionOut)
def start_session(payload: StartSessionIn, user: User = Depends(get_current_user)):
    session_logger.info(f"Starting new session for user: {user.login_id}, category: {payload.category}")
    
    session_id = uuid.uuid4().hex
    system_prompt = system_prompt_for(payload.category)
    
    try:
        with get_session() as db:
            chat = ChatSession(
                session_id=session_id,
                user_id=user.id,
                category=payload.category,
                notes=None,
                created_at=now_ist(),
                updated_at=now_ist(),
            )
            db.add(chat)
            db.add(Message(session_id=session_id, role="system", content=system_prompt, created_at=now_ist()))
            db.commit()
        
        session_logger.info(f"Session created successfully: {session_id} for user: {user.login_id}")
        return {"session_id": session_id}
    except Exception as e:
        session_logger.error(f"Failed to create session for user {user.login_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create session")

@app.get("/api/sessions/{session_id}", response_model=HistoryOut)
def get_history(session_id: str, user: User = Depends(get_current_user)):
    session_logger.info(f"Retrieving history for session: {session_id}, user: {user.login_id}")
    
    with get_session() as db:
        chat = db.exec(select(ChatSession).where(ChatSession.session_id == session_id, ChatSession.user_id == user.id)).scalar_one_or_none()
        if not chat:
            session_logger.warning(f"Session not found: {session_id} for user: {user.login_id}")
            raise HTTPException(status_code=404, detail="Session not found")
        
        msgs = (
            db.exec(select(Message).where(Message.session_id == session_id).order_by(Message.created_at.asc())).scalars().all()
        )
        session_logger.info(f"Retrieved {len(msgs)} messages for session: {session_id}")
        
        return {
            "session_id": chat.session_id,
            "category": chat.category,
            "messages": [MessageOut(role=m.role, content=m.content) for m in msgs],
        }

@app.put("/api/sessions/{session_id}/notes")
def put_notes(session_id: str, payload: NotesIn, user: User = Depends(get_current_user)):
    with get_session() as db:
        chat = db.exec(select(ChatSession).where(ChatSession.session_id == session_id, ChatSession.user_id == user.id)).scalar_one_or_none()
        if not chat:
            raise HTTPException(status_code=404, detail="Session not found")
        
        chat.notes = payload.notes
        chat.updated_at = now_ist()
        db.commit()
        return {"ok": True}

@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: str, user: User = Depends(get_current_user)):
    with get_session() as db:
        chat = db.exec(select(ChatSession).where(ChatSession.session_id == session_id, ChatSession.user_id == user.id)).scalar_one_or_none()
        if not chat:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Delete all messages for this session
        db.exec(delete(Message).where(Message.session_id == session_id)).scalars().all()
        
        # Delete the chat session
        db.delete(chat)
        db.commit()
        return {"ok": True}

@app.post("/api/sessions/{session_id}/messages")
def send_message(session_id: str, payload: MessageIn, user: User = Depends(get_current_user)):
    session_logger.info(f"Processing message for session: {session_id}, user: {user.login_id}")
    session_logger.debug(f"Message length: {len(payload.content)} characters")
    
    with get_session() as db:
      chat = db.exec(select(ChatSession).where(ChatSession.session_id == session_id, ChatSession.user_id == user.id)).scalar_one_or_none()
      if not chat:
          session_logger.warning(f"Session not found: {session_id} for user: {user.login_id}")
          raise HTTPException(status_code=404, detail="Session not found")
      
      # persist user message
      db.add(Message(session_id=session_id, role="user", content=payload.content, created_at=now_ist()))
      chat.updated_at = now_ist()
      db.commit()
      session_logger.debug(f"User message persisted for session: {session_id}")

      # build history for LLM
      msgs = (
          db.exec(select(Message).where(Message.session_id == session_id).order_by(Message.created_at.asc())).scalars().all()
      )
      wire = [{"role": m.role, "content": m.content} for m in msgs]
      session_logger.debug(f"Built conversation history with {len(wire)} messages")

    provider = os.getenv("LLM_PROVIDER", "anthropic").strip().lower()
    if provider == "anthropic":
        streamer = AnthropicStreamer()
    elif provider == "together":
        streamer = TogetherStreamer()
    else:
        streamer = OpenAIStreamer()
    logger.info(f"Using LLM provider: {provider}, model: {getattr(streamer, 'model', 'unknown')}")

    def ndjson_stream():
        assembled: List[str] = []
        try:
            session_logger.info(f"Starting LLM stream for session: {session_id}")
            for tok in streamer.stream_chat(wire):
                assembled.append(tok)
                yield (json.dumps({"type":"delta","content": tok}) + "\n").encode("utf-8")
        except Exception as e:
            session_logger.error(f"LLM streaming error for session {session_id}: {str(e)}")
            yield (json.dumps({"type":"delta","content": "[Error streaming, please retry]"}) + "\n").encode("utf-8")
        finally:
            full = "".join(assembled)
            session_logger.info(f"LLM response completed for session {session_id}, length: {len(full)} characters")
            with get_session() as db2:
                db2.add(Message(session_id=session_id, role="assistant", content=full, created_at=now_ist()))
                db2.commit()
                session_logger.debug(f"Assistant message persisted for session: {session_id}")
            yield (json.dumps({"type":"done"}) + "\n").encode("utf-8")

    return StreamingResponse(ndjson_stream(), media_type="application/x-ndjson")


# Add this new Google auth endpoint
@app.post("/auth/google", response_model=TokenOut)
def google_auth(payload: GoogleAuthIn, response: Response):
    login_logger.info("="*60)
    login_logger.info("=== FASTAPI BACKEND: /auth/google ===")
    login_logger.info("="*60)
    login_logger.info(f"🔵 Timestamp: {now_ist()}")
    login_logger.info(f"📦 Received id_token length: {len(payload.id_token)}")
    login_logger.debug(f"📦 ID Token preview: {payload.id_token[:50]}...")

    # Verify Google token
    login_logger.info("🔍 Verifying Google token with Google API...")
    google_user_info = google_auth_service.verify_google_token(payload.id_token)

    if not google_user_info:
        login_logger.error("❌ Google token verification FAILED")
        raise HTTPException(status_code=400, detail="Invalid Google token")

    login_logger.info("✅ Google token verified successfully!")
    login_logger.info(f"📋 Google user info received: {google_user_info}")

    if not google_user_info['email_verified']:
        login_logger.error("❌ Email not verified by Google")
        raise HTTPException(status_code=400, detail="Google email not verified")

    login_logger.info("✅ Email is verified")

    with get_session() as db:
        login_logger.info("--- DATABASE OPERATIONS ---")

        # Check if user exists by Google ID
        login_logger.info(f"🔍 Checking if user exists by Google ID: {google_user_info['google_id']}")
        user = db.exec(select(User).where(User.google_id == google_user_info['google_id'])).scalar_one_or_none()

        if user:
            login_logger.info(f"✅ Found existing user by Google ID: {user.login_id}")
        else:
            login_logger.info("⚠️ No user found with this Google ID")

            # Check if user exists by email (for account linking)
            login_logger.info(f"🔍 Checking if user exists by email: {google_user_info['email']}")
            user = db.exec(select(User).where(User.email == google_user_info['email'])).scalar_one_or_none()

            if user:
                login_logger.info(f"✅ Found existing user by email: {user.login_id}")
                login_logger.info("🔗 Linking Google account to existing user...")

                # Link Google account to existing user
                user.google_id = google_user_info['google_id']
                user.auth_provider = "google"
                user.avatar_url = google_user_info['avatar_url']
                if not user.name:
                    user.name = google_user_info['name']

                login_logger.info(f"✅ Updated user: login_id={user.login_id}, google_id={user.google_id}, name={user.name}")
            else:
                login_logger.info("⚠️ No existing user found, creating new user...")

                # Create new user
                user = User(
                    login_id=google_user_info['email'],  # Use email as login_id
                    google_id=google_user_info['google_id'],
                    email=google_user_info['email'],
                    name=google_user_info['name'],
                    avatar_url=google_user_info['avatar_url'],
                    auth_provider="google",
                    created_at=now_ist(),
                )
                db.add(user)
                login_logger.info(f"✅ Created new user object: login_id={user.login_id}, google_id={user.google_id}, name={user.name}")

            login_logger.info("💾 Committing changes to database...")
            db.commit()
            login_logger.info("✅ Database commit successful")

            # Refresh to get the ID
            db.refresh(user)
            login_logger.info(f"✅ User ID after commit: {user.id}")

        login_logger.info("--- DATABASE OPERATIONS ---")
        
        from app.services.user_service import UserService
        user_service = UserService(db)

        # Check if user exists by Google ID
        login_logger.info(f"🔍 Checking if user exists by Google ID: {google_user_info['google_id']}")
        user = user_service.find_by_google_id(google_user_info['google_id'])

        if user:
            login_logger.info(f"✅ Found existing user by Google ID: {user.login_id}")
        else:
            login_logger.info("⚠️ No user found with this Google ID")

            # Check if user exists by email (for account linking)
            login_logger.info(f"🔍 Checking if user exists by email: {google_user_info['email']}")
            user = user_service.find_by_email(google_user_info['email'])

            if user:
                login_logger.info(f"✅ Found existing user by email: {user.login_id}")
                login_logger.info("🔗 Linking Google account to existing user...")

                # Link Google account to existing user
                user = user_service.link_google_account(user, google_user_info)
                login_logger.info(f"✅ Updated user: login_id={user.login_id}, google_id={user.google_id}, name={user.name}")
            else:
                login_logger.info("⚠️ No existing user found, creating new user...")

                # Create new user
                user = user_service.create_google_user(google_user_info)
                login_logger.info(f"✅ Created new user: login_id={user.login_id}, google_id={user.google_id}, name={user.name}")

            login_logger.info(f"✅ User ID: {user.id}")

        login_logger.info("--- TOKEN GENERATION ---")
        # Create token using login_id (which is email for Google users)
        login_logger.info(f"🔑 Creating access token for login_id: {user.login_id}")
        token = create_access_token(user.login_id)
        login_logger.info(f"✅ Token created (length: {len(token)})")
        login_logger.debug(f"🔑 Token preview: {token[:30]}...")

        login_logger.info("--- COOKIE SETUP ---")
        login_logger.info(f"🍪 Setting HTTP-only cookie with max_age={JWT_EXPIRE_MIN * 60} seconds")

        # Determine if we're in production (HTTPS) or development (HTTP)
        is_production = os.getenv("FRONTEND_ORIGIN", "").startswith("https://")

        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=is_production,  # True for HTTPS (production), False for HTTP (development)
            samesite="lax",
            max_age=JWT_EXPIRE_MIN * 60  # Convert minutes to seconds
        )
        login_logger.info(f"✅ Cookie set successfully (secure={is_production})")

        login_logger.info("--- FINAL USER STATE IN DB ---")
        final_user = db.exec(select(User).where(User.id == user.id)).scalar_one_or_none()
        login_logger.info(f"User ID: {final_user.id}")
        login_logger.info(f"Login ID: {final_user.login_id}")
        login_logger.info(f"Name: {final_user.name}")
        login_logger.info(f"Email: {final_user.email}")
        login_logger.info(f"Google ID: {final_user.google_id}")
        login_logger.info(f"Avatar URL: {final_user.avatar_url}")
        login_logger.info(f"Auth Provider: {final_user.auth_provider}")
        login_logger.info(f"Created At: {final_user.created_at}")

        login_logger.info("✅ GOOGLE AUTH COMPLETED SUCCESSFULLY")
        login_logger.info("="*60)

        return TokenOut(access_token=token)

@app.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}

# ---------- Wallet ----------
from decimal import Decimal

@app.get("/api/wallet", response_model=WalletOut)
def get_wallet(user: User = Depends(get_current_user)):
    """Get or create user's wallet and return balance"""
    with get_session() as db:
        from app.services.wallet_service import WalletService
        wallet_service = WalletService(db)
        wallet_out = wallet_service.get_wallet_balance(user.id)
        return wallet_out

#not used currently
@app.post("/api/wallet/create", response_model=CreateWalletOut)
def create_wallet(user: User = Depends(get_current_user)):
    """Explicitly create a wallet for the user"""
    with get_session() as db:
        from app.services.wallet_service import WalletService
        wallet_service = WalletService(db)
        
        # Check if wallet already exists
        existing = wallet_service.find_wallet_by_user_id(user.id)
        if existing:
            return CreateWalletOut(
                wallet_id=existing.id,
                balance=str(existing.balance),
                currency=existing.currency
            )

        # Create new wallet with initial balance using wallet service
        wallet = wallet_service.create_wallet_with_bonus(user.id)
        return CreateWalletOut(
            wallet_id=wallet.id,
            balance=str(wallet.balance),
            currency=wallet.currency
        )
