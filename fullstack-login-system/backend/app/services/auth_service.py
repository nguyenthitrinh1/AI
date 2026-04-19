"""
Authentication business logic.
Validates credentials and issues JWT tokens.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.repositories.user_repository import UserRepository
from app.schemas.user import LoginRequest, LoginResponse, TokenResponse, UserPublic


class AuthService:
    """Handles authentication operations."""

    def __init__(self, db: Session) -> None:
        self.repo = UserRepository(db)

    def login(self, payload: LoginRequest) -> LoginResponse:
        """
        Validate credentials and return a JWT access token.

        Raises:
            HTTPException 401: if the email doesn't exist or the password is wrong.
        """
        # 1. Look up the user by email
        user = self.repo.get_by_email(payload.email)

        # 2. Verify password – use a constant-time comparison via passlib
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 3. Issue JWT – subject is the user's primary key
        access_token = create_access_token(subject=user.id)

        return LoginResponse(
            token=TokenResponse(access_token=access_token),
            user=UserPublic.model_validate(user),
        )
