from __future__ import annotations
import json, os, uuid
from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from app.db import init_db, get_session
from app.models import User, ChatSession, Message
from app.schemas import (
    RegisterIn, LoginIn, TokenOut, MeOut,
    StartSessionIn, StartSessionOut, MessageIn, MessageOut, HistoryOut,
    ConversationItem, NotesIn,
)
from app.utils import now_ist, hash_password, verify_password, create_access_token
from app.prompts import system_prompt_for
from app.openai_client import OpenAIStreamer
from app.auth import get_current_user



from .db import init_db, get_session
from .models import User, ChatSession, Message
from .schemas import (
    RegisterIn, LoginIn, TokenOut, MeOut,
    StartSessionIn, StartSessionOut, MessageIn, MessageOut, HistoryOut,
    ConversationItem, NotesIn,
)
#from utils import now_ist, hash_password, verify_password, create_access_token
#
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- startup ---
    init_db()
    yield
    # --- shutdown ---
    # place shutdown/cleanup logic here if/when needed

app = FastAPI(title="Auth Chat API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:3000"), "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

# ---------- Auth ----------
@app.post("/auth/register", response_model=TokenOut)
def register(payload: RegisterIn):
    from .db import get_session
    with get_session() as db:
        if db.query(User).filter(User.login_id == payload.login_id).first():
            raise HTTPException(status_code=400, detail="login_id already exists")
        user = User(
            login_id=payload.login_id,
            password_hash=hash_password(payload.password),
            name=payload.name,
            phone=payload.phone,
            age=payload.age,
            created_at=now_ist(),
        )
        db.add(user)
        db.commit()
    token = create_access_token(payload.login_id)
    return TokenOut(access_token=token)

@app.post("/auth/login", response_model=TokenOut)
def login(payload: LoginIn):
    with get_session() as db:
        user = db.query(User).filter(User.login_id == payload.login_id).first()
        if not user or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(payload.login_id)
    return TokenOut(access_token=token)

@app.get("/auth/me", response_model=MeOut)
def me(user: User = Depends(get_current_user)):
    return MeOut(login_id=user.login_id, name=user.name)

# ---------- Chat ----------
@app.get("/api/chats", response_model=List[ConversationItem])
def list_chats(user: User = Depends(get_current_user)):
    with get_session() as db:
        rows = (
            db.query(ChatSession)
              .filter(ChatSession.user_id == user.id)
              .order_by(ChatSession.updated_at.desc())
              .all()
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
    session_id = uuid.uuid4().hex
    system_prompt = system_prompt_for(payload.category)
    with get_session() as db:
        chat = ChatSession(
            session_id=session_id,
            user_id=user.id,
            category=payload.category,
            notes=None,
            complete_chat=json.dumps([{"role":"system","content":system_prompt}], ensure_ascii=False),
            created_at=now_ist(),
            updated_at=now_ist(),
        )
        db.add(chat)
        db.add(Message(session_id=session_id, role="system", content=system_prompt, created_at=now_ist()))
        db.commit()
    return {"session_id": session_id}

@app.get("/api/sessions/{session_id}", response_model=HistoryOut)
def get_history(session_id: str, user: User = Depends(get_current_user)):
    with get_session() as db:
        chat = db.query(ChatSession).filter(ChatSession.session_id == session_id, ChatSession.user_id == user.id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Session not found")
        msgs = (
            db.query(Message)
              .filter(Message.session_id == session_id)
              .order_by(Message.created_at.asc())
              .all()
        )
        return {
            "session_id": chat.session_id,
            "category": chat.category,
            "messages": [MessageOut(role=m.role, content=m.content) for m in msgs],
        }

@app.put("/api/sessions/{session_id}/notes")
def put_notes(session_id: str, payload: NotesIn, user: User = Depends(get_current_user)):
    with get_session() as db:
        chat = db.query(ChatSession).filter(ChatSession.session_id == session_id, ChatSession.user_id == user.id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Session not found")
        
        chat.notes = payload.notes
        chat.updated_at = now_ist()
        db.commit()
        return {"ok": True}

@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: str, user: User = Depends(get_current_user)):
    with get_session() as db:
        chat = db.query(ChatSession).filter(ChatSession.session_id == session_id, ChatSession.user_id == user.id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Delete all messages for this session
        db.query(Message).filter(Message.session_id == session_id).delete()
        
        # Delete the chat session
        db.delete(chat)
        db.commit()
        return {"ok": True}

@app.post("/api/sessions/{session_id}/messages")
def send_message(session_id: str, payload: MessageIn, user: User = Depends(get_current_user)):
    with get_session() as db:
      chat = db.query(ChatSession).filter(ChatSession.session_id == session_id, ChatSession.user_id == user.id).first()
      if not chat:
          raise HTTPException(status_code=404, detail="Session not found")
      # persist user message
      db.add(Message(session_id=session_id, role="user", content=payload.content, created_at=now_ist()))
      # update complete_chat JSON snapshot
      current = json.loads(chat.complete_chat)
      current.append({"role":"user","content":payload.content})
      chat.complete_chat = json.dumps(current, ensure_ascii=False)
      chat.updated_at = now_ist()
      db.commit()

      # build history for LLM
      msgs = (
          db.query(Message)
            .filter(Message.session_id == session_id)
            .order_by(Message.created_at.asc())
            .all()
      )
      wire = [{"role": m.role, "content": m.content} for m in msgs]

    streamer = OpenAIStreamer()

    def ndjson_stream():
        assembled: List[str] = []
        try:
            for tok in streamer.stream_chat(wire):
                assembled.append(tok)
                yield (json.dumps({"type":"delta","content": tok}) + "\n").encode("utf-8")
        except Exception:
            yield (json.dumps({"type":"delta","content": "[Error streaming, please retry]"}) + "\n").encode("utf-8")
        finally:
            full = "".join(assembled)
            with get_session() as db2:
                db2.add(Message(session_id=session_id, role="assistant", content=full, created_at=now_ist()))
                # update complete_chat JSON
                chat2 = db2.query(ChatSession).filter(ChatSession.session_id == session_id).first()
                hist = json.loads(chat2.complete_chat)
                hist.append({"role":"assistant","content": full})
                chat2.complete_chat = json.dumps(hist, ensure_ascii=False)
                chat2.updated_at = now_ist()
                db2.commit()
            yield (json.dumps({"type":"done"}) + "\n").encode("utf-8")

    return StreamingResponse(ndjson_stream(), media_type="application/x-ndjson")
