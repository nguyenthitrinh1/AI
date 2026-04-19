"""
Repository layer for User database operations.
Keeps all DB queries in one place, separate from business logic.
"""

from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    """Data access object for the User table."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        """Return the User with the given email, or None if not found."""
        return self.db.query(User).filter(User.email == email).first()

    def get_by_id(self, user_id: int) -> User | None:
        """Return the User with the given primary key, or None."""
        return self.db.query(User).filter(User.id == user_id).first()

    def create(self, email: str, hashed_password: str) -> User:
        """Persist a new User record and return it."""
        user = User(email=email, hashed_password=hashed_password)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
