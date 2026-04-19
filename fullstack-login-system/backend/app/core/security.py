"""
Security utilities:
  - Password hashing using bcrypt via passlib
  - JWT token creation and verification
"""

from datetime import UTC, datetime, timedelta

import jwt
from passlib.context import CryptContext

from app.core.config import settings

# Bcrypt password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------------------------------------------------------------------------
# Password utilities
# ---------------------------------------------------------------------------

def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a stored bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ---------------------------------------------------------------------------
# JWT utilities
# ---------------------------------------------------------------------------

def create_access_token(subject: str | int, expires_delta: timedelta | None = None) -> str:
    """
    Create a signed JWT access token.

    Args:
        subject: The unique identifier stored in the token (e.g. user id or email).
        expires_delta: Optional custom expiry; uses the configured default if None.

    Returns:
        Encoded JWT string.
    """
    expire = datetime.now(UTC) + (
        expires_delta
        if expires_delta
        else timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.now(UTC),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT access token.

    Raises:
        jwt.ExpiredSignatureError: if the token has expired.
        jwt.InvalidTokenError: for any other JWT error.
    """
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
