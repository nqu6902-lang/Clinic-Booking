from app.database import Base, engine, SessionLocal
from app import models
from app.models import User, Specialty, Doctor, Service
from app.security import hash_password
Base.metadata.create_all(engine)
db=SessionLocal()
try:
    people=[("admin@clinic.local","Admin Demo","admin"),("reception@clinic.local","Le Tan Demo","receptionist"),("doctor@clinic.local","Bac si Demo","doctor"),("patient@clinic.local","Benh nhan Demo","patient")]
    users={}
    for email,name,role in people:
        user=db.query(User).filter_by(email=email).first()
        if not user:
            user=User(email=email,full_name=name,role=role,password_hash=hash_password("Clinic123!")); db.add(user); db.flush()
        users[role]=user
    specialty=db.query(Specialty).filter_by(name="Nha khoa tong quat").first()
    if not specialty:
        specialty=Specialty(name="Nha khoa tong quat",description="Kham va tu van rang mieng"); db.add(specialty); db.flush()
    doctor=db.query(Doctor).filter_by(user_id=users["doctor"].id).first()
    if not doctor:
        doctor=Doctor(user_id=users["doctor"].id,specialty_id=specialty.id,license_number="HP-DEMO-001",biography="Bac si phong kham demo",consultation_fee=150000); db.add(doctor)
    for name,price in [("Kham tong quat",150000),("Chup X-quang",100000),("Lay cao rang",250000)]:
        if not db.query(Service).filter_by(name=name).first(): db.add(Service(name=name,price=price))
    db.commit()
finally: db.close()
print("Seed complete. Demo password: Clinic123!")
