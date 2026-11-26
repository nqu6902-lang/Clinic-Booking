from datetime import timedelta

from app.models import Appointment, User


def login(client, role):
    response = client.post(
        "/auth/login",
        json={
            "email": f"{role}@clinic.com",
            "password": "Clinic123!",
        },
    )
    assert response.status_code == 200

    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health(ctx):
    response = ctx["client"].get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_register_patient(ctx):
    response = ctx["client"].post(
        "/auth/register",
        json={
            "email": "new@clinic.com",
            "password": "LongPassword1!",
            "full_name": "New patient",
        },
    )

    assert response.status_code == 201
    assert response.json()["role"] == "patient"


def test_duplicate_register_returns_conflict(ctx):
    payload = {
        "email": "patient@clinic.com",
        "password": "LongPassword1!",
        "full_name": "Duplicate",
    }

    response = ctx["client"].post("/auth/register", json=payload)

    assert response.status_code == 409


def test_login_invalid_credentials(ctx):
    response = ctx["client"].post(
        "/auth/login",
        json={
            "email": "patient@clinic.com",
            "password": "wrong-password",
        },
    )

    assert response.status_code == 401


def test_private_endpoint_requires_token(ctx):
    response = ctx["client"].get("/auth/me")

    assert response.status_code == 401


def test_patient_cannot_create_service(ctx):
    headers = login(ctx["client"], "patient")

    response = ctx["client"].post(
        "/services",
        headers=headers,
        json={"name": "Xray", "price": 100},
    )

    assert response.status_code == 403


def test_public_doctor_catalog(ctx):
    response = ctx["client"].get("/doctors")

    assert response.status_code == 200
    assert response.json()[0]["full_name"] == "Test doctor"


def test_patient_can_book_available_slot(ctx):
    headers = login(ctx["client"], "patient")
    start_time = ctx["start"] + timedelta(minutes=30)

    response = ctx["client"].post(
        "/appointments",
        headers=headers,
        json={
            "doctor_id": ctx["doctor"].id,
            "starts_at": start_time.isoformat(),
            "reason": "Checkup",
        },
    )

    assert response.status_code == 201
    assert response.json()["status"] == "pending"


def test_duplicate_booking_returns_conflict(ctx):
    headers = login(ctx["client"], "patient")
    body = {
        "doctor_id": ctx["doctor"].id,
        "starts_at": (ctx["start"] + timedelta(minutes=30)).isoformat(),
    }

    first_response = ctx["client"].post(
        "/appointments",
        headers=headers,
        json=body,
    )
    second_response = ctx["client"].post(
        "/appointments",
        headers=headers,
        json=body,
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409


def test_patient_cannot_view_another_patients_appointment(ctx):
    other_patient = User(
        email="other@clinic.com",
        password_hash="unused",
        full_name="Other",
        role="patient",
    )
    ctx["db"].add(other_patient)
    ctx["db"].flush()

    appointment = Appointment(
        patient_id=other_patient.id,
        doctor_id=ctx["doctor"].id,
        starts_at=ctx["start"],
        ends_at=ctx["start"] + timedelta(minutes=30),
        status="pending",
    )
    ctx["db"].add(appointment)
    ctx["db"].commit()

    headers = login(ctx["client"], "patient")
    response = ctx["client"].get(
        f"/appointments/{appointment.id}",
        headers=headers,
    )

    assert response.status_code == 403