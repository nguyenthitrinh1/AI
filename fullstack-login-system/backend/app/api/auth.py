"""
Authentication endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import LoginRequest, LoginResponse, UserPublic
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse, summary="Login with email and password")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    """
    Authenticate a user and return a JWT access token.

    - **email**: registered user email
    - **password**: plain-text password (min 6 characters)
    """
    return AuthService(db).login(payload)


@router.get("/me", response_model=UserPublic, summary="Get current authenticated user")
def get_me(current_user: User = Depends(get_current_user)) -> UserPublic:
    """
    Return the profile of the currently authenticated user.
    Requires a valid Bearer token in the Authorization header.
    """
    return UserPublic.model_validate(current_user)
