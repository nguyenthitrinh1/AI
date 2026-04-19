"""
Pydantic schemas for authentication-related request/response bodies.
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    """Payload expected by POST /api/auth/login."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="Plain-text password (min 6 chars)")


# ---------------------------------------------------------------------------
# Response schemas  – never expose the hashed password
# ---------------------------------------------------------------------------

class TokenResponse(BaseModel):
    """JWT token returned after successful login."""

    access_token: str
    token_type: str = "bearer"


class UserPublic(BaseModel):
    """Public-safe representation of a User (no password field)."""

    id: int
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    """Complete response for a successful login."""

    token: TokenResponse
    user: UserPublic
