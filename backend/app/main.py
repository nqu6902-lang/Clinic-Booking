import os

from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine, text

app = FastAPI(
    title="Clinic Booking API",
    description="API kiểm tra hạ tầng hệ thống đặt lịch khám",
    version="1.0.0",
    root_path="/api"
)

engine = create_engine(
    os.environ["DATABASE_URL"],
    pool_pre_ping=True
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/db")
def health_db():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        return {"database": "ok"}

    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Database unavailable"
        )