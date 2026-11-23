from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import get_db
from app.models import User, Specialty, Doctor, Schedule, Appointment, Service
from app.schemas import SpecialtyCreate, SpecialtyOut, DoctorCreate, DoctorOut, ScheduleCreate, ScheduleOut, ServiceCreate, ServiceOut
from app.security import require_roles, get_current_user
router = APIRouter()
@router.get("/specialties", response_model=list[SpecialtyOut])
def specialties(db: Session=Depends(get_db)):
    return db.scalars(select(Specialty).order_by(Specialty.name)).all()
@router.post("/specialties", response_model=SpecialtyOut, status_code=201)
def add_specialty(data: SpecialtyCreate, db: Session=Depends(get_db), _: User=Depends(require_roles("admin"))):
    item=Specialty(**data.model_dump()); db.add(item)
    try: db.commit()
    except Exception: db.rollback(); raise HTTPException(409,"Specialty already exists")
    db.refresh(item); return item
@router.get("/doctors", response_model=list[DoctorOut])
def doctors(specialty_id: int|None=None, q: str|None=None, limit: int=50, offset: int=0, db: Session=Depends(get_db)):
    stmt=select(Doctor,User.full_name,Specialty.name).join(User,Doctor.user_id==User.id).join(Specialty)
    if specialty_id: stmt=stmt.where(Doctor.specialty_id==specialty_id)
    if limit < 1 or limit > 100 or offset < 0: raise HTTPException(422,"limit must be 1..100 and offset must be non-negative")
    if q: stmt=stmt.where(User.full_name.ilike(f"%{q}%"))
    stmt=stmt.order_by(User.full_name).limit(limit).offset(offset)
    return [{"id":d.id,"user_id":d.user_id,"specialty_id":d.specialty_id,"license_number":d.license_number,"biography":d.biography,"consultation_fee":d.consultation_fee,"full_name":name,"specialty_name":spec} for d,name,spec in db.execute(stmt).all()]
@router.post("/doctors", response_model=DoctorOut, status_code=201)
def add_doctor(data: DoctorCreate, db: Session=Depends(get_db), _: User=Depends(require_roles("admin"))):
    user=db.get(User,data.user_id)
    if not user or user.role!="doctor": raise HTTPException(422,"user_id must belong to a doctor account")
    if not db.get(Specialty,data.specialty_id): raise HTTPException(404,"Specialty not found")
    if db.query(Doctor).filter(Doctor.user_id==data.user_id).first(): raise HTTPException(409,"Doctor profile already exists")
    d=Doctor(**data.model_dump()); db.add(d); db.commit(); db.refresh(d)
    return {"id":d.id,"user_id":d.user_id,"specialty_id":d.specialty_id,"license_number":d.license_number,"biography":d.biography,"consultation_fee":d.consultation_fee,"full_name":user.full_name,"specialty_name":d.specialty.name}
@router.get("/doctors/{doctor_id}/schedules", response_model=list[ScheduleOut])
def schedules(doctor_id: int, date: str|None=None, db: Session=Depends(get_db)):
    from datetime import date as Date
    if not db.get(Doctor,doctor_id): raise HTTPException(404,"Doctor not found")
    stmt=select(Schedule).where(Schedule.doctor_id==doctor_id,Schedule.is_active.is_(True)).order_by(Schedule.starts_at)
    if date:
        try: day=Date.fromisoformat(date)
        except ValueError: raise HTTPException(422,"date must use YYYY-MM-DD")
        stmt=stmt.where(Schedule.starts_at>=day,Schedule.starts_at<day.fromordinal(day.toordinal()+1))
    return db.scalars(stmt).all()
@router.get("/doctors/{doctor_id}/slots")
def available_slots(doctor_id: int, date: str, db: Session=Depends(get_db)):
    from datetime import date as Date, datetime, time, timedelta
    if not db.get(Doctor,doctor_id): raise HTTPException(404,"Doctor not found")
    try: day=Date.fromisoformat(date)
    except ValueError: raise HTTPException(422,"date must use YYYY-MM-DD")
    start=datetime.combine(day,time.min); finish=start+timedelta(days=1)
    schedules=db.scalars(select(Schedule).where(Schedule.doctor_id==doctor_id,Schedule.is_active.is_(True),Schedule.starts_at<finish,Schedule.ends_at>start).order_by(Schedule.starts_at)).all()
    booked=set(db.scalars(select(Appointment.starts_at).where(Appointment.doctor_id==doctor_id,Appointment.status.in_(("pending","confirmed","checked_in","completed")),Appointment.starts_at>=start,Appointment.starts_at<finish)).all())
    result=[]
    for schedule in schedules:
        slot=schedule.starts_at
        while slot+timedelta(minutes=schedule.slot_minutes)<=schedule.ends_at:
            if slot>=start and slot<finish:
                result.append({"starts_at":slot,"ends_at":slot+timedelta(minutes=schedule.slot_minutes),"available":slot not in booked})
            slot+=timedelta(minutes=schedule.slot_minutes)
    return result
@router.post("/schedules", response_model=ScheduleOut, status_code=201)
def add_schedule(data: ScheduleCreate, doctor_id: int|None=None, db: Session=Depends(get_db), user: User=Depends(require_roles("doctor","admin"))):
    doctor=db.query(Doctor).filter(Doctor.user_id==user.id).first() if user.role=="doctor" else None
    if user.role=="doctor":
        if not doctor: raise HTTPException(404,"Doctor profile not found")
        doctor_id=doctor.id
    else:
        if doctor_id is None or not db.get(Doctor,doctor_id): raise HTTPException(404,"Provide a valid doctor_id")

    if data.ends_at<=data.starts_at: raise HTTPException(422,"ends_at must be after starts_at")
    item=Schedule(doctor_id=doctor_id,**data.model_dump()); db.add(item); db.commit(); db.refresh(item); return item
@router.post("/services", response_model=ServiceOut, status_code=201)
def add_service(data: ServiceCreate, db: Session=Depends(get_db), _: User=Depends(require_roles("admin"))):
    item=Service(**data.model_dump()); db.add(item); db.commit(); db.refresh(item); return item
@router.get("/services", response_model=list[ServiceOut])
def services(db: Session=Depends(get_db)):
    return db.scalars(select(Service).where(Service.is_active.is_(True)).order_by(Service.name)).all()
