from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Literal

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=160)
    phone: str | None = None
class StaffUserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=160)
    phone: str | None = None
    role: Literal["doctor", "receptionist"]
class LoginInput(BaseModel):
    email: EmailStr
    password: str
class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int; email: EmailStr; full_name: str; phone: str | None; role: str
class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
class SpecialtyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = None
class SpecialtyOut(SpecialtyCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
class DoctorCreate(BaseModel):
    user_id: int
    specialty_id: int
    license_number: str | None = None
    biography: str | None = None
    consultation_fee: float = Field(ge=0)
class DoctorOut(BaseModel):
    id: int; user_id: int; specialty_id: int; license_number: str | None; biography: str | None; consultation_fee: float
    full_name: str; specialty_name: str
class ScheduleCreate(BaseModel):
    starts_at: datetime
    ends_at: datetime
    slot_minutes: int = Field(default=30, ge=10, le=180)
class ScheduleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int; doctor_id: int; starts_at: datetime; ends_at: datetime; slot_minutes: int; is_active: bool
class AppointmentCreate(BaseModel):
    doctor_id: int
    starts_at: datetime
    reason: str | None = Field(default=None, max_length=500)
class AppointmentOut(BaseModel):
    id: int; patient_id: int; doctor_id: int; starts_at: datetime; ends_at: datetime; status: str; reason: str | None
    patient_name: str; doctor_name: str; diagnosis: str | None = None; doctor_notes: str | None = None
class MedicalRecordUpdate(BaseModel):
    diagnosis: str = Field(min_length=1)
    doctor_notes: str | None = None
    service_ids: list[int] = Field(default_factory=list)
class ServiceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    description: str | None = None
    price: float = Field(ge=0)
class ServiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int; name: str; description: str | None; price: float; is_active: bool
class InvoiceOut(BaseModel):
    id: int; appointment_id: int; patient_id: int; amount: float; status: str; created_at: datetime
