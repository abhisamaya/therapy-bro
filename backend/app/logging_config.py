"""Logging configuration for TherapyBro backend."""
import logging
import os


def configure_logging():
    """Configure application logging."""
    # Configure basic logging
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
    
    # Set log levels based on environment
    if os.getenv("DEBUG", "false").lower() == "true":
        logging.getLogger().setLevel(logging.DEBUG)
        logger.info("Debug logging enabled")
    else:
        logging.getLogger().setLevel(logging.INFO)
    
    logger.info("Logging configured successfully")
    return logger


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance."""
    return logging.getLogger(name)
