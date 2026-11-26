import os
from datetime import datetime, timedelta

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("JWT_SECRET", "test-secret-long-enough-for-tests")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import User, Specialty, Doctor, Schedule
from app.security import hash_password


@pytest.fixture
def ctx():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
    )

    Base.metadata.create_all(engine)
    db = TestingSession()

    specialty = Specialty(name="Dentistry")
    db.add(specialty)
    db.flush()

    accounts = {}
    for role in ("admin", "receptionist", "doctor", "patient"):
        user = User(
            email=f"{role}@clinic.com",
            password_hash=hash_password("Clinic123!"),
            full_name=f"Test {role}",
            role=role,
            is_active=True,
        )
        db.add(user)
        db.flush()
        accounts[role] = user

    doctor = Doctor(
        user_id=accounts["doctor"].id,
        specialty_id=specialty.id,
        consultation_fee=100,
    )
    db.add(doctor)
    db.flush()

    start = (datetime.now() + timedelta(days=2)).replace(
        hour=9, minute=0, second=0, microsecond=0
    )
    schedule = Schedule(
        doctor_id=doctor.id,
        starts_at=start,
        ends_at=start + timedelta(hours=2),
        slot_minutes=30,
        is_active=True,
    )
    db.add(schedule)
    db.commit()

    def override_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_db

    try:
        with TestClient(app) as client:
            yield {
                "client": client,
                "db": db,
                "accounts": accounts,
                "doctor": doctor,
                "schedule": schedule,
                "start": start,
            }
    finally:
        app.dependency_overrides.clear()
        db.close()
        Base.metadata.drop_all(engine)
        engine.dispose()