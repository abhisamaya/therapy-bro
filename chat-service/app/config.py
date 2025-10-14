import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "chat-service"
    JWT_SECRET: str
    MONGO_URI: str = "mongodb://mongo:27017"
    MONGO_DB: str = "chatdb"
    REDIS_URL: str = "redis://redis:6379/0"
    SOCKET_PATH: str = "/socket.io"
    ALLOWED_ORIGINS: list[str] = ["*"]
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


class Config:
    env_file = ".env"


settings = Settings()