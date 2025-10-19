"""Centralized configuration for TherapyBro backend."""
import os
from decimal import Decimal
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )
    
    # Database Configuration
    database_url: str = Field(default="sqlite:///./chat.db", alias="DATABASE_URL")
    
    # JWT Configuration
    jwt_secret: str = Field(default="dev-secret-change", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALG")
    jwt_expire_minutes: int = Field(default=1440, alias="JWT_EXPIRE_MIN")  # 24h
    
    # LLM Provider Configuration
    llm_provider: str = Field(default="anthropic", alias="LLM_PROVIDER")
    
    # OpenAI Configuration
    openai_api_key: Optional[str] = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")
    
    # Anthropic Configuration
    anthropic_api_key: Optional[str] = Field(default=None, alias="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(default="claude-3-5-sonnet-20241022", alias="ANTHROPIC_MODEL")
    anthropic_max_tokens: int = Field(default=1024, alias="ANTHROPIC_MAX_TOKENS")
    anthropic_temperature: float = Field(default=0.5, alias="ANTHROPIC_TEMPERATURE")
    
    # Together AI Configuration
    together_api_key: Optional[str] = Field(default=None, alias="TOGETHER_API_KEY")
    together_model: str = Field(default="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", alias="TOGETHER_MODEL")
    
    # Frontend Configuration
    frontend_origin: str = Field(default="http://localhost:3000", alias="FRONTEND_ORIGIN")
    
    # Google OAuth Configuration
    google_client_id: Optional[str] = Field(default=None, alias="GOOGLE_CLIENT_ID")
    google_client_secret: Optional[str] = Field(default=None, alias="GOOGLE_CLIENT_SECRET")
    
    # Wallet Configuration
    initial_wallet_balance: Decimal = Field(default=Decimal("200.0000"))
    wallet_currency: str = Field(default="INR")
    
    # Logging Configuration
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    log_file: str = Field(default="app.log", alias="LOG_FILE")
    
    # Application Configuration
    app_title: str = Field(default="TherapyBro API")
    app_version: str = Field(default="1.0.0")
    debug: bool = Field(default=False, alias="DEBUG")


class SettingsFactory:
    """Factory for creating Settings instances with lazy initialization."""
    
    _instance: Optional[Settings] = None
    
    @classmethod
    def create_settings(cls) -> Settings:
        """Create or return existing Settings instance."""
        if cls._instance is None:
            cls._instance = Settings()
        return cls._instance
    
    @classmethod
    def reset_instance(cls) -> None:
        """Reset the singleton instance (useful for testing)."""
        cls._instance = None


# Factory function for backward compatibility
def get_settings() -> Settings:
    """Get the global settings instance."""
    return SettingsFactory.create_settings()
