from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app import models  # register models with SQLAlchemy metadata
from app.routers import auth, catalog, appointments, invoices

app = FastAPI(title="Clinic Booking API", description="API đặt lịch khám phòng khám", version="1.0.0", root_path="/api")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["Authorization","Content-Type"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(catalog.router, tags=["Catalog"])
app.include_router(appointments.router, prefix="/appointments", tags=["Appointments and medical records"])
app.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])
@app.get("/health", tags=["Health"])
def health(): return {"status":"ok"}
@app.get("/health/db", tags=["Health"])
def health_db():
    from sqlalchemy import text
    with engine.connect() as conn: conn.execute(text("SELECT 1"))
    return {"database":"ok"}
