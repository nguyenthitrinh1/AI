"""
Application configuration loaded from environment variables.
Uses pydantic-settings for type-safe configuration management.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # App info
    APP_NAME: str = "Fullstack Login System"
    DEBUG: bool = False

    # Database – defaults to local SQLite file
    DATABASE_URL: str = "sqlite:///./app.db"

    # JWT
    JWT_SECRET: str = "change-me-in-production"  # Override via .env
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS – list of allowed origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # OpenAI – Chat & Embeddings
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Chat memory – max tokens to keep in history before truncation
    MAX_HISTORY_TOKENS: int = 3000


# Singleton settings instance used across the application
settings = Settings()
