# Backend – FastAPI

## Tech Stack

- **FastAPI** – high-performance Python web framework
- **SQLAlchemy 2.0** – ORM for database access
- **SQLite** – default database (easily swappable with PostgreSQL)
- **Passlib (bcrypt)** – password hashing
- **PyJWT** – JSON Web Token creation & verification
- **Pydantic v2** – request/response validation
- **Ruff + Black + isort** – linting and formatting

---

## Prerequisites

- Python 3.11+

---

## Installation

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

## Environment Variables

Copy `.env` and adjust values:

```bash
cp .env .env.local   # (optional, .env is already read)
```

Key variables:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./app.db` | SQLAlchemy database URL |
| `JWT_SECRET` | _(see .env)_ | Secret key for signing JWTs – **change in production** |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Token validity in minutes |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed frontend origins |

---

## Run Dev Server

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**  
Interactive docs: **http://localhost:8000/docs**

---

## Seed Database

Creates a test user `test@example.com` / `password123`:

```bash
python -m app.seed
```

---

## Test API

### Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

Expected response:
```json
{
  "token": {
    "access_token": "<jwt>",
    "token_type": "bearer"
  },
  "user": {
    "id": 1,
    "email": "test@example.com",
    "created_at": "..."
  }
}
```

### Get Current User (protected)

```bash
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

---

## Code Quality

```bash
# Lint
ruff check .

# Format
black .
isort .
```

---

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── auth.py          # Login & /me endpoints
│   │   └── deps.py          # JWT dependency injection
│   ├── core/
│   │   ├── config.py        # App settings (env-based)
│   │   └── security.py      # Password hashing + JWT
│   ├── db/
│   │   └── session.py       # SQLAlchemy engine & session
│   ├── models/
│   │   └── user.py          # User ORM model
│   ├── repositories/
│   │   └── user_repository.py
│   ├── schemas/
│   │   └── user.py          # Pydantic request/response models
│   ├── services/
│   │   └── auth_service.py  # Business logic
│   ├── main.py              # FastAPI app entry point
│   └── seed.py              # DB seed script
├── .env                     # Environment variables
├── pyproject.toml           # Project config + linting
└── requirements.txt
```
