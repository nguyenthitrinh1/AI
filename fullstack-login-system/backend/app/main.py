"""
FastAPI application entry point.
Sets up CORS, exception handlers, and registers all routers.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import jwt

from app.api.auth import router as auth_router
from app.chat.router import router as chat_router
from app.core.config import settings
from app.db.session import Base, engine

# ---------------------------------------------------------------------------
# Create all DB tables on startup (for SQLite / development)
# ---------------------------------------------------------------------------
Base.metadata.create_all(bind=engine)

# ---------------------------------------------------------------------------
# FastAPI app instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Full-stack Login System – FastAPI backend",
)

# ---------------------------------------------------------------------------
# CORS middleware – allow the Next.js dev server
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global exception handlers
# ---------------------------------------------------------------------------

@app.exception_handler(jwt.ExpiredSignatureError)
async def expired_token_handler(request: Request, exc: jwt.ExpiredSignatureError) -> JSONResponse:
    return JSONResponse(
        status_code=401,
        content={"detail": "Token has expired. Please log in again."},
    )


@app.exception_handler(jwt.InvalidTokenError)
async def invalid_token_handler(request: Request, exc: jwt.InvalidTokenError) -> JSONResponse:
    return JSONResponse(
        status_code=401,
        content={"detail": "Invalid authentication token."},
    )


# ---------------------------------------------------------------------------
# Register routers
# ---------------------------------------------------------------------------
app.include_router(auth_router)
app.include_router(chat_router)


@app.get("/", tags=["health"])
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "app": settings.APP_NAME}
