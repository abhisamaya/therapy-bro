"""Main FastAPI application for TherapyBro backend."""
from __future__ import annotations
import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Response as FastAPIResponse
from dotenv import load_dotenv

from app.db import init_db
from app.routers import auth_router, sessions_router, wallet_router, phone_verification_router
from app.routers.onboarding import router as onboarding_router
from app.password_reset import router as password_reset_router
from app.logging_config import configure_logging, get_logger
from app.middleware import register_error_handlers

# Load environment variables
load_dotenv()

# Configure logging
logger = configure_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting TherapyBro application")
    init_db()
    logger.info("Database initialized successfully")
    yield
    # Shutdown
    logger.info("Shutting down TherapyBro application")


# Create FastAPI app
app = FastAPI(title="TherapyBro API", version="1.0.0", lifespan=lifespan)

# Register error handlers
register_error_handlers(app)

# Configure CORS
def configure_cors():
    """Configure CORS middleware."""
    allowed_origins = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000").split(",")
    
    # Add common development origins
    if "http://localhost:3000" not in allowed_origins:
        allowed_origins.append("http://localhost:3000")
    
    # Add both www and non-www versions for production
    production_origins_to_add = []
    for origin in list(allowed_origins):
        if origin.startswith("https://"):
            if "://www." in origin:
                production_origins_to_add.append(origin.replace("://www.", "://"))
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


# Configure CORS
configure_cors()

# Include routers
app.include_router(auth_router)
app.include_router(sessions_router)
app.include_router(wallet_router)
app.include_router(password_reset_router)
app.include_router(phone_verification_router)
app.include_router(onboarding_router)


# Add request/response logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log HTTP requests and responses."""
    start_time = time.time()
    
    # Log incoming request
    logger.info(f"Request: {request.method} {request.url}")
    
    # Process request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time.time() - start_time
    
    # Log response
    logger.info(f"Response: {response.status_code} - {request.method} {request.url} - {process_time:.3f}s")
    
    return response


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok"}


@app.options("/{full_path:path}")
async def options_handler(full_path: str, request: Request):
    """Handle OPTIONS requests for CORS preflight."""
    origin = request.headers.get("origin", "")

    # Get allowed origins from CORS configuration
    allowed_origins = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000").split(",")
    if "http://localhost:3000" not in allowed_origins:
        allowed_origins.append("http://localhost:3000")

    # Add both www and non-www versions
    production_origins_to_add = []
    for orig in list(allowed_origins):
        if orig.startswith("https://"):
            if "://www." in orig:
                production_origins_to_add.append(orig.replace("://www.", "://"))
            else:
                domain = orig.replace("https://", "")
                production_origins_to_add.append(f"https://www.{domain}")
    allowed_origins.extend(production_origins_to_add)

    # Check if origin is allowed
    allow_origin = origin if origin in allowed_origins else allowed_origins[0] if allowed_origins else "*"

    headers = {
        "Access-Control-Allow-Origin": allow_origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "3600",
    }

    return FastAPIResponse(status_code=200, headers=headers)