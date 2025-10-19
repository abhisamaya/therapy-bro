from __future__ import annotations
import json, os, uuid, logging, time
from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.db import init_db, get_session
from app.models import User
from app.utils import now_ist
from app.auth import get_current_user

from app.routers import auth_router, sessions_router, wallet_router

from fastapi import Cookie, Response

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

# Include routers
app.include_router(auth_router)
app.include_router(sessions_router)
app.include_router(wallet_router)

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
