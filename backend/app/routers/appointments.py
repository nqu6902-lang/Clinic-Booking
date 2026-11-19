from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Doctor, Schedule, Appointment, Service, Invoice
from app.schemas import AppointmentCreate, AppointmentOut, MedicalRecordUpdate, InvoiceOut
from app.security import get_current_user, require_roles
router=APIRouter()
ACTIVE=("pending","confirmed","checked_in","completed")
def view(a): return {"id":a.id,"patient_id":a.patient_id,"doctor_id":a.doctor_id,"starts_at":a.starts_at,"ends_at":a.ends_at,"status":a.status,"reason":a.reason,"patient_name":a.patient.full_name,"doctor_name":a.doctor.user.full_name,"diagnosis":a.diagnosis,"doctor_notes":a.doctor_notes}
@router.post("",response_model=AppointmentOut,status_code=201)
def book(data: AppointmentCreate, db: Session=Depends(get_db), user: User=Depends(require_roles("patient"))):
    now=datetime.now()
    if data.starts_at<=now: raise HTTPException(422,"Appointment must be in the future")
    doctor=db.get(Doctor,data.doctor_id)
    if not doctor: raise HTTPException(404,"Doctor not found")
    slots=db.scalars(select(Schedule).where(Schedule.doctor_id==doctor.id,Schedule.is_active.is_(True),Schedule.starts_at<=data.starts_at,Schedule.ends_at>data.starts_at).order_by(Schedule.starts_at).with_for_update()).all()
    schedule=next((s for s in slots if (data.starts_at-s.starts_at).total_seconds()% (s.slot_minutes*60)==0 and data.starts_at+timedelta(minutes=s.slot_minutes)<=s.ends_at),None)
    if not schedule: raise HTTPException(422,"Requested time is outside an available schedule slot")
    conflict=db.scalar(select(Appointment.id).where(Appointment.doctor_id==doctor.id,Appointment.starts_at==data.starts_at,Appointment.status.in_(ACTIVE)))
    if conflict: raise HTTPException(409,"This time slot is already booked")
    item=Appointment(patient_id=user.id,doctor_id=doctor.id,schedule_id=schedule.id,starts_at=data.starts_at,ends_at=data.starts_at+timedelta(minutes=schedule.slot_minutes),reason=data.reason)
    db.add(item)
    try: db.commit()
    except Exception: db.rollback(); raise HTTPException(409,"This time slot was booked by another patient")
    db.refresh(item); return view(item)
@router.get("/me",response_model=list[AppointmentOut])
def my_appointments(db: Session=Depends(get_db),user: User=Depends(get_current_user)):
    stmt=select(Appointment).order_by(Appointment.starts_at.desc())
    if user.role=="patient": stmt=stmt.where(Appointment.patient_id==user.id)
    elif user.role=="doctor":
        doctor=db.query(Doctor).filter(Doctor.user_id==user.id).first()
        if not doctor: return []
        stmt=stmt.where(Appointment.doctor_id==doctor.id)
    return [view(a) for a in db.scalars(stmt).all()]
@router.get("/{appointment_id}",response_model=AppointmentOut)
def get_appointment(appointment_id:int,db:Session=Depends(get_db),user:User=Depends(get_current_user)):
    a=db.get(Appointment,appointment_id)
    if not a: raise HTTPException(404,"Appointment not found")
    own_doctor=a.doctor.user_id==user.id
    if user.role=="patient" and a.patient_id!=user.id: raise HTTPException(403,"You can only view your own appointment")
    if user.role=="doctor" and not own_doctor: raise HTTPException(403,"You can only view appointments assigned to you")
    return view(a)
@router.patch("/{appointment_id}/cancel",response_model=AppointmentOut)
def cancel(appointment_id:int,db:Session=Depends(get_db),user:User=Depends(get_current_user)):
    a=db.get(Appointment,appointment_id)
    if not a: raise HTTPException(404,"Appointment not found")
    if user.role not in ("patient","receptionist","admin") or (user.role=="patient" and a.patient_id!=user.id): raise HTTPException(403,"Not allowed")
    if a.starts_at-datetime.now()<timedelta(hours=2): raise HTTPException(422,"Appointments can only be cancelled at least 2 hours in advance")
    if a.status in ("cancelled","completed"): raise HTTPException(409,"Appointment cannot be cancelled in its current state")
    a.status="cancelled"; db.commit(); db.refresh(a); return view(a)
@router.patch("/{appointment_id}/reschedule",response_model=AppointmentOut)
def reschedule(appointment_id:int,new_starts_at:datetime=Query(...),db:Session=Depends(get_db),user:User=Depends(get_current_user)):
    a=db.get(Appointment,appointment_id)
    if not a: raise HTTPException(404,"Appointment not found")
    if user.role!="patient" or a.patient_id!=user.id: raise HTTPException(403,"Only the patient can reschedule their own appointment")
    if a.starts_at-datetime.now()<timedelta(hours=2): raise HTTPException(422,"Appointments can only be changed at least 2 hours in advance")
    if new_starts_at==a.starts_at: raise HTTPException(422,"Choose a different appointment time")
    replacement=book(AppointmentCreate(doctor_id=a.doctor_id,starts_at=new_starts_at,reason=a.reason),db,user)
    a.status="cancelled"; db.commit()
    return replacement
@router.patch("/{appointment_id}/confirm",response_model=AppointmentOut)
def confirm(appointment_id:int,db:Session=Depends(get_db),_:User=Depends(require_roles("receptionist","admin"))):
    a=db.get(Appointment,appointment_id)
    if not a: raise HTTPException(404,"Appointment not found")
    if a.status!="pending": raise HTTPException(409,"Only pending appointments can be confirmed")
    a.status="confirmed"; db.commit(); db.refresh(a); return view(a)
@router.patch("/{appointment_id}/check-in",response_model=AppointmentOut)
def checkin(appointment_id:int,db:Session=Depends(get_db),_:User=Depends(require_roles("receptionist","admin"))):
    a=db.get(Appointment,appointment_id)
    if not a: raise HTTPException(404,"Appointment not found")
    if a.status!="confirmed": raise HTTPException(409,"Only confirmed appointments can check in")
    a.status="checked_in"; db.commit(); db.refresh(a); return view(a)
@router.put("/{appointment_id}/medical-record",response_model=AppointmentOut)
def medical_record(appointment_id:int,data:MedicalRecordUpdate,db:Session=Depends(get_db),user:User=Depends(require_roles("doctor"))):
    doctor=db.query(Doctor).filter(Doctor.user_id==user.id).first(); a=db.get(Appointment,appointment_id)
    if not a: raise HTTPException(404,"Appointment not found")
    if not doctor or a.doctor_id!=doctor.id: raise HTTPException(403,"This appointment is assigned to another doctor")
    if a.status!="checked_in": raise HTTPException(409,"Patient must be checked in first")
    services=[]
    if data.service_ids:
        services=db.scalars(select(Service).where(Service.id.in_(data.service_ids),Service.is_active.is_(True))).all()
        if len(services)!=len(set(data.service_ids)): raise HTTPException(422,"One or more services are invalid")
    a.diagnosis=data.diagnosis; a.doctor_notes=data.doctor_notes; a.services=services; a.status="completed"
    db.commit(); db.refresh(a); return view(a)
@router.post("/{appointment_id}/invoice",response_model=InvoiceOut,status_code=201)
def create_invoice(appointment_id:int,db:Session=Depends(get_db),_:User=Depends(require_roles("doctor","receptionist","admin"))):
    a=db.get(Appointment,appointment_id)
    if not a: raise HTTPException(404,"Appointment not found")
    if a.status!="completed": raise HTTPException(409,"Invoice can only be created for a completed visit")
    if db.query(Invoice).filter(Invoice.appointment_id==a.id).first(): raise HTTPException(409,"Invoice already exists")
    amount=float(a.doctor.consultation_fee)+sum(float(s.price) for s in a.services)
    invoice=Invoice(appointment_id=a.id,patient_id=a.patient_id,amount=amount); db.add(invoice); db.commit(); db.refresh(invoice); return invoice
