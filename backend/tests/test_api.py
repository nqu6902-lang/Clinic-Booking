from datetime import timedelta

def login(client, role):
    response=client.post("/auth/login",json={"email":f"{role}@example.test","password":"Clinic123!"})
    assert response.status_code==200
    return {"Authorization":f"Bearer {response.json()['access_token']}"}

def test_health(ctx):
    assert ctx["client"].get("/health").json()=={"status":"ok"}

def test_register_patient(ctx):
    r=ctx["client"].post("/auth/register",json={"email":"new@example.test","password":"LongPassword1!","full_name":"New patient"})
    assert r.status_code==201 and r.json()["role"]=="patient"

def test_duplicate_register_returns_conflict(ctx):
    payload={"email":"patient@example.test","password":"LongPassword1!","full_name":"Duplicate"}
    assert ctx["client"].post("/auth/register",json=payload).status_code==409

def test_login_invalid_credentials(ctx):
    assert ctx["client"].post("/auth/login",json={"email":"patient@example.test","password":"wrong-password"}).status_code==401

def test_private_endpoint_requires_token(ctx):
    assert ctx["client"].get("/auth/me").status_code==401

def test_patient_cannot_create_service(ctx):
    headers=login(ctx["client"],"patient")
    assert ctx["client"].post("/services",headers=headers,json={"name":"Xray","price":100}).status_code==403

def test_public_doctor_catalog(ctx):
    response=ctx["client"].get("/doctors")
    assert response.status_code==200 and response.json()[0]["full_name"]=="Test doctor"

def test_patient_can_book_available_slot(ctx):
    headers=login(ctx["client"],"patient")
    response=ctx["client"].post("/appointments",headers=headers,json={"doctor_id":ctx["doctor"].id,"starts_at":(ctx["start"]+timedelta(minutes=30)).isoformat(),"reason":"Checkup"})
    assert response.status_code==201 and response.json()["status"]=="pending"

def test_duplicate_booking_returns_conflict(ctx):
    headers=login(ctx["client"],"patient")
    body={"doctor_id":ctx["doctor"].id,"starts_at":(ctx["start"]+timedelta(minutes=30)).isoformat()}
    assert ctx["client"].post("/appointments",headers=headers,json=body).status_code==201
    assert ctx["client"].post("/appointments",headers=headers,json=body).status_code==409

def test_patient_cannot_view_another_patients_appointment(ctx):
    from app.models import Appointment
    # Add a second patient and an appointment owned by that account.
    from app.models import User
    other=User(email="other@example.test",password_hash="unused",full_name="Other",role="patient")
    ctx["db"].add(other); ctx["db"].flush()
    appointment=Appointment(patient_id=other.id,doctor_id=ctx["doctor"].id,starts_at=ctx["start"],ends_at=ctx["start"]+timedelta(minutes=30),status="pending")
    ctx["db"].add(appointment); ctx["db"].commit()
    headers=login(ctx["client"],"patient")
    assert ctx["client"].get(f"/appointments/{appointment.id}",headers=headers).status_code==403
