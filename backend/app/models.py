from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, Numeric, Text, UniqueConstraint, CheckConstraint, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

appointment_services = Table(
    "appointment_services", Base.metadata,
    Column("appointment_id", ForeignKey("appointments.id", ondelete="CASCADE"), primary_key=True),
    Column("service_id", ForeignKey("services.id", ondelete="RESTRICT"), primary_key=True),
    Column("quantity", Integer, nullable=False, default=1),
)

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(160))
    phone: Mapped[str | None] = mapped_column(String(30))
    role: Mapped[str] = mapped_column(String(20), default="patient", index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    doctor: Mapped["Doctor | None"] = relationship(back_populates="user", uselist=False)

class Specialty(Base):
    __tablename__ = "specialties"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    doctors: Mapped[list["Doctor"]] = relationship(back_populates="specialty")

class Doctor(Base):
    __tablename__ = "doctors"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    specialty_id: Mapped[int] = mapped_column(ForeignKey("specialties.id", ondelete="RESTRICT"))
    license_number: Mapped[str | None] = mapped_column(String(80), unique=True)
    biography: Mapped[str | None] = mapped_column(Text)
    consultation_fee: Mapped[float] = mapped_column(Numeric(12,2), default=0)
    user: Mapped[User] = relationship(back_populates="doctor")
    specialty: Mapped[Specialty] = relationship(back_populates="doctors")
    schedules: Mapped[list["Schedule"]] = relationship(back_populates="doctor", cascade="all, delete-orphan")

class Schedule(Base):
    __tablename__ = "schedules"
    __table_args__ = (CheckConstraint("ends_at > starts_at", name="ck_schedule_time"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), index=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    ends_at: Mapped[datetime] = mapped_column(DateTime)
    slot_minutes: Mapped[int] = mapped_column(Integer, default=30)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    doctor: Mapped[Doctor] = relationship(back_populates="schedules")

class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (CheckConstraint("ends_at > starts_at", name="ck_appointment_time"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="RESTRICT"), index=True)
    schedule_id: Mapped[int | None] = mapped_column(ForeignKey("schedules.id", ondelete="SET NULL"))
    starts_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    ends_at: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(24), default="pending", index=True)
    reason: Mapped[str | None] = mapped_column(String(500))
    diagnosis: Mapped[str | None] = mapped_column(Text)
    doctor_notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    patient: Mapped[User] = relationship(foreign_keys=[patient_id])
    doctor: Mapped[Doctor] = relationship()
    services: Mapped[list["Service"]] = relationship(secondary=appointment_services)

class Service(Base):
    __tablename__ = "services"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Numeric(12,2))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class Invoice(Base):
    __tablename__ = "invoices"
    id: Mapped[int] = mapped_column(primary_key=True)
    appointment_id: Mapped[int] = mapped_column(ForeignKey("appointments.id", ondelete="RESTRICT"), unique=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    amount: Mapped[float] = mapped_column(Numeric(12,2))
    status: Mapped[str] = mapped_column(String(20), default="unpaid")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    appointment: Mapped[Appointment] = relationship()
