"""
Database session configuration using SQLAlchemy.
Uses SQLite for local development (easily switchable to PostgreSQL).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

# Create SQLAlchemy engine
# connect_args is needed only for SQLite
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


def get_db() -> Session:
    """
    FastAPI dependency that provides a database session.
    Ensures the session is closed after each request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
