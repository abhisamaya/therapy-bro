"""Custom exceptions for TherapyBro backend."""
from typing import Optional, Dict, Any


class TherapyBroError(Exception):
    """Base exception class for TherapyBro application."""
    
    def __init__(self, message: str, error_code: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)


class UserNotFoundError(TherapyBroError):
    """Raised when a user is not found."""
    
    def __init__(self, user_id: Optional[int] = None, login_id: Optional[str] = None, google_id: Optional[str] = None):
        if user_id:
            message = f"User with ID {user_id} not found"
            details = {"user_id": user_id}
        elif login_id:
            message = f"User with login_id '{login_id}' not found"
            details = {"login_id": login_id}
        elif google_id:
            message = f"User with Google ID '{google_id}' not found"
            details = {"google_id": google_id}
        else:
            message = "User not found"
            details = {}
        
        super().__init__(message, "USER_NOT_FOUND", details)


class SessionNotFoundError(TherapyBroError):
    """Raised when a session is not found."""
    
    def __init__(self, session_id: str, user_id: Optional[int] = None):
        message = f"Session '{session_id}' not found"
        details = {"session_id": session_id}
        if user_id:
            details["user_id"] = user_id
            message += f" for user {user_id}"
        
        super().__init__(message, "SESSION_NOT_FOUND", details)


class WalletError(TherapyBroError):
    """Raised when wallet operations fail."""
    
    def __init__(self, message: str, wallet_id: Optional[int] = None, user_id: Optional[int] = None):
        details = {}
        if wallet_id:
            details["wallet_id"] = wallet_id
        if user_id:
            details["user_id"] = user_id
        
        super().__init__(message, "WALLET_ERROR", details)


class InsufficientFundsError(WalletError):
    """Raised when wallet has insufficient funds."""
    
    def __init__(self, required_amount: float, available_amount: float, wallet_id: Optional[int] = None):
        message = f"Insufficient funds: required {required_amount}, available {available_amount}"
        details = {
            "required_amount": required_amount,
            "available_amount": available_amount
        }
        if wallet_id:
            details["wallet_id"] = wallet_id
        
        super().__init__(message, "INSUFFICIENT_FUNDS", details)


class AuthenticationError(TherapyBroError):
    """Raised when authentication fails."""
    
    def __init__(self, message: str = "Authentication failed", login_id: Optional[str] = None):
        details = {}
        if login_id:
            details["login_id"] = login_id
        
        super().__init__(message, "AUTHENTICATION_ERROR", details)


class AuthorizationError(TherapyBroError):
    """Raised when user is not authorized to perform an action."""
    
    def __init__(self, message: str = "Not authorized", user_id: Optional[int] = None, resource: Optional[str] = None):
        details = {}
        if user_id:
            details["user_id"] = user_id
        if resource:
            details["resource"] = resource
        
        super().__init__(message, "AUTHORIZATION_ERROR", details)


class ValidationError(TherapyBroError):
    """Raised when validation fails."""
    
    def __init__(self, message: str, field: Optional[str] = None, value: Optional[Any] = None):
        details = {}
        if field:
            details["field"] = field
        if value is not None:
            details["value"] = value
        
        super().__init__(message, "VALIDATION_ERROR", details)


class DuplicateResourceError(TherapyBroError):
    """Raised when trying to create a resource that already exists."""
    
    def __init__(self, resource_type: str, identifier: str, value: Any):
        message = f"{resource_type} with {identifier} '{value}' already exists"
        details = {
            "resource_type": resource_type,
            "identifier": identifier,
            "value": value
        }
        
        super().__init__(message, "DUPLICATE_RESOURCE", details)


class LLMError(TherapyBroError):
    """Raised when LLM operations fail."""
    
    def __init__(self, message: str, provider: Optional[str] = None, session_id: Optional[str] = None):
        details = {}
        if provider:
            details["provider"] = provider
        if session_id:
            details["session_id"] = session_id
        
        super().__init__(message, "LLM_ERROR", details)


class DatabaseError(TherapyBroError):
    """Raised when database operations fail."""
    
    def __init__(self, message: str, operation: Optional[str] = None, table: Optional[str] = None):
        details = {}
        if operation:
            details["operation"] = operation
        if table:
            details["table"] = table
        
        super().__init__(message, "DATABASE_ERROR", details)
