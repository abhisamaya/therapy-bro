"""Error handling middleware for TherapyBro backend."""
import logging
from typing import Union
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from pydantic import ValidationError as PydanticValidationError

from app.exceptions import TherapyBroError
from app.logging_config import get_logger

logger = get_logger(__name__)


def create_error_response(
    status_code: int,
    error_code: str,
    message: str,
    details: dict = None,
    request: Request = None
) -> JSONResponse:
    """Create a standardized error response."""
    error_response = {
        "error": {
            "code": error_code,
            "message": message,
            "details": details or {}
        }
    }
    
    # Add request context if available
    if request:
        error_response["error"]["request"] = {
            "method": request.method,
            "url": str(request.url),
            "path": request.url.path
        }
    
    return JSONResponse(
        status_code=status_code,
        content=error_response
    )


async def therapy_bro_error_handler(request: Request, exc: TherapyBroError) -> JSONResponse:
    """Handle custom TherapyBro exceptions."""
    logger.error(f"TherapyBro error: {exc.error_code} - {exc.message}", extra={
        "error_code": exc.error_code,
        "details": exc.details,
        "path": request.url.path,
        "method": request.method
    })
    
    # Map error codes to HTTP status codes
    status_code_map = {
        "USER_NOT_FOUND": 404,
        "SESSION_NOT_FOUND": 404,
        "WALLET_ERROR": 400,
        "INSUFFICIENT_FUNDS": 400,
        "AUTHENTICATION_ERROR": 401,
        "AUTHORIZATION_ERROR": 403,
        "VALIDATION_ERROR": 400,
        "DUPLICATE_RESOURCE": 409,
        "LLM_ERROR": 500,
        "DATABASE_ERROR": 500,
    }
    
    status_code = status_code_map.get(exc.error_code, 500)
    
    return create_error_response(
        status_code=status_code,
        error_code=exc.error_code,
        message=exc.message,
        details=exc.details,
        request=request
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTP exceptions."""
    logger.warning(f"HTTP exception: {exc.status_code} - {exc.detail}", extra={
        "status_code": exc.status_code,
        "path": request.url.path,
        "method": request.method
    })
    
    return create_error_response(
        status_code=exc.status_code,
        error_code=f"HTTP_{exc.status_code}",
        message=str(exc.detail),
        request=request
    )


async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle Starlette HTTP exceptions."""
    logger.warning(f"Starlette HTTP exception: {exc.status_code} - {exc.detail}", extra={
        "status_code": exc.status_code,
        "path": request.url.path,
        "method": request.method
    })
    
    return create_error_response(
        status_code=exc.status_code,
        error_code=f"HTTP_{exc.status_code}",
        message=str(exc.detail),
        request=request
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle request validation errors."""
    logger.warning(f"Validation error: {exc.errors()}", extra={
        "errors": exc.errors(),
        "path": request.url.path,
        "method": request.method
    })
    
    # Format validation errors for better readability
    formatted_errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        formatted_errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })
    
    return create_error_response(
        status_code=422,
        error_code="VALIDATION_ERROR",
        message="Request validation failed",
        details={"validation_errors": formatted_errors},
        request=request
    )


async def pydantic_validation_exception_handler(request: Request, exc: PydanticValidationError) -> JSONResponse:
    """Handle Pydantic validation errors."""
    logger.warning(f"Pydantic validation error: {exc.errors()}", extra={
        "errors": exc.errors(),
        "path": request.url.path,
        "method": request.method
    })
    
    formatted_errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        formatted_errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })
    
    return create_error_response(
        status_code=422,
        error_code="VALIDATION_ERROR",
        message="Data validation failed",
        details={"validation_errors": formatted_errors},
        request=request
    )


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """Handle SQLAlchemy database errors."""
    logger.error(f"Database error: {str(exc)}", extra={
        "error_type": type(exc).__name__,
        "path": request.url.path,
        "method": request.method
    })
    
    # Handle specific SQLAlchemy errors
    if isinstance(exc, IntegrityError):
        return create_error_response(
            status_code=409,
            error_code="DATABASE_CONSTRAINT_ERROR",
            message="Database constraint violation",
            details={"constraint": str(exc.orig) if hasattr(exc, 'orig') else str(exc)},
            request=request
        )
    
    return create_error_response(
        status_code=500,
        error_code="DATABASE_ERROR",
        message="Database operation failed",
        details={"error": str(exc)},
        request=request
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    logger.error(f"Unexpected error: {str(exc)}", extra={
        "error_type": type(exc).__name__,
        "path": request.url.path,
        "method": request.method
    }, exc_info=True)
    
    return create_error_response(
        status_code=500,
        error_code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred",
        request=request
    )


def register_error_handlers(app):
    """Register all error handlers with the FastAPI app."""
    # Custom exceptions
    app.add_exception_handler(TherapyBroError, therapy_bro_error_handler)
    
    # HTTP exceptions
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(StarletteHTTPException, starlette_http_exception_handler)
    
    # Validation exceptions
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(PydanticValidationError, pydantic_validation_exception_handler)
    
    # Database exceptions
    app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
    
    # General exception handler (should be last)
    app.add_exception_handler(Exception, general_exception_handler)
    
    logger.info("Error handlers registered successfully")
