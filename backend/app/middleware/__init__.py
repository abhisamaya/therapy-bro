"""Middleware module for TherapyBro backend."""
from .error_handler import register_error_handlers

__all__ = ["register_error_handlers"]
