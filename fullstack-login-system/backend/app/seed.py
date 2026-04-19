"""
Seed script – creates an initial test user in the database.

Usage:
    cd backend
    python -m app.seed
"""

from app.core.security import hash_password
from app.db.session import Base, SessionLocal, engine
from app.models.user import User  # noqa: F401 – ensures model is registered


def seed() -> None:
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Avoid duplicate seeds
        existing = db.query(User).filter(User.email == "test@example.com").first()
        if existing:
            print("⚡ Seed user already exists – skipping.")
            return

        user = User(
            email="test@example.com",
            hashed_password=hash_password("password123"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"✅ Seed user created: id={user.id} email={user.email}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
