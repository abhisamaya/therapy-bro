import os
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from socketio import AsyncServer
from socketio.asgi import ASGIApp
from .config import settings
from .db import get_collection, get_mongo_client
from .auth import verify_jwt
import asyncio

# Use RedisManager so messages/rooms are shared between instances
from socketio.redis_manager import RedisManager

# mgr = RedisManager(settings.REDIS_URL)
# sio = socketio.AsyncServer(async_mode="asgi", client_manager=mgr, cors_allowed_origins="*")

#sio = AsyncServer(async_mode="asgi", client_manager=redis_manager, cors_allowed_origins=settings.ALLOWED_ORIGINS)

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")


app = FastAPI()

# Mount socketio app at root - Socket.IO client will add /socket.io/ automatically
socket_app = ASGIApp(sio, other_asgi_app=app)

# Enable CORS for REST API endpoints
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# simple presence store in Redis keys (could use manager)

@sio.event
async def connect(sid, environ):
    # For local testing: pick user from query string
    qs = environ.get("QUERY_STRING", "")
    if "userA" in qs:
        user_id = "userA"
    elif "userB" in qs:
        user_id = "userB"
    else:
        user_id = f"user_{sid[:5]}"  # fallback

    await sio.save_session(sid, {"user": {"sub": user_id}})
    print("connected", sid, "user", user_id)


# @sio.event
# async def connect(sid, environ):
#     # authenticate via query string or header
#     qs = environ.get("QUERY_STRING", "")
#     # extract token param e.g. token=...
#     token = None
#     for part in qs.split("&"):
#         if part.startswith("token="):
#             token = part.split("=", 1)[1]
#     if not token:
#         return False  # reject
#     try:
#         user = verify_jwt(token)
#     except Exception:
#         return False
#     # attach user to session
#     await sio.save_session(sid, {"user": user})
#     print("connected", sid, "user", user.get("sub"))

@sio.event
async def join_conversation(sid, data):
    # data: {"conversation_id": "..."}
    await sio.enter_room(sid, data["conversation_id"])

@sio.event
async def leave_conversation(sid, data):
    await sio.leave_room(sid, data["conversation_id"])

@sio.event
async def send_message(sid, data):
    # data: {conversation_id, content, metadata}
    session = await sio.get_session(sid)
    user = session.get("user")
    if not user:
        return
    msg = {
        "conversation_id": data["conversation_id"],
        "sender_id": user.get("sub"),
        "content": data.get("content"),
        "metadata": data.get("metadata", {}),
    }
    # save to mongo
    col = get_collection("messages")
    res = await col.insert_one({**msg})
    # broadcast to room
    await sio.emit("message", {**msg, "_id": str(res.inserted_id)}, room=data["conversation_id"])

@sio.event
async def disconnect(sid):
    print("disconnected", sid)

# include REST router
from .routes import router as chat_router
app.include_router(chat_router, prefix="/api")

# Export socket_app as the main app
app = socket_app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
