from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Doctor, Invoice, Appointment
from app.schemas import InvoiceOut
from app.security import get_current_user
router=APIRouter()
@router.get("/me",response_model=list[InvoiceOut])
def my_invoices(db:Session=Depends(get_db),user:User=Depends(get_current_user)):
    stmt=select(Invoice).order_by(Invoice.created_at.desc())
    if user.role=="patient": stmt=stmt.where(Invoice.patient_id==user.id)
    elif user.role=="doctor":
        doc=db.query(Doctor).filter(Doctor.user_id==user.id).first()
        if not doc: return []
        stmt=stmt.join(Appointment).where(Appointment.doctor_id==doc.id)
    return db.scalars(stmt).all()
