"""Logging configuration for TherapyBro backend.

Environment Variables:
    LOG_LEVEL: Set the logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
               Default: INFO
               
Examples:
    LOG_LEVEL=DEBUG python main.py    # Show all logs including DEBUG
    LOG_LEVEL=INFO python main.py     # Show INFO and above (default)
    LOG_LEVEL=WARNING python main.py  # Show only WARNING and ERROR
"""
import logging
import os


def configure_logging():
    """Configure application logging."""
    # Get log level from environment
    log_level_str = os.getenv("LOG_LEVEL", "INFO").upper()
    log_level = getattr(logging, log_level_str, logging.INFO)
    
    # Configure basic logging
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        handlers=[
            logging.FileHandler('app.log'),
            logging.StreamHandler()
        ]
    )
    
    # Set specific logger levels
    loggers_config = {
        'auth_router': logging.DEBUG,
        'UserService': logging.DEBUG,
        'SessionService': logging.DEBUG,
        'WalletService': logging.DEBUG,
        'MessageService': logging.DEBUG,
        'app.middleware.error_handler': logging.DEBUG,
        'app.db': logging.DEBUG,
        'app.utils': logging.DEBUG,
        'llm.anthropic': logging.DEBUG,
        'llm.openai': logging.DEBUG,
        'llm.together': logging.DEBUG,
    }
    
    # Only set DEBUG level for specific loggers if LOG_LEVEL is DEBUG or lower
    if log_level <= logging.DEBUG:
        for logger_name, level in loggers_config.items():
            logging.getLogger(logger_name).setLevel(level)
    
    # Optionally, set specific log levels for noisy libraries
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    
    logger = logging.getLogger(__name__)
    logger.info("Logging configured successfully")
    return logger


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the given name."""
    return logging.getLogger(name)
