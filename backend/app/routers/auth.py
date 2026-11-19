from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, StaffUserCreate, LoginInput, UserOut, TokenOut
from app.security import hash_password, verify_password, create_access_token, get_current_user, require_roles
router = APIRouter()
@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first(): raise HTTPException(409, "Email already registered")
    user = User(email=email, password_hash=hash_password(payload.password), full_name=payload.full_name, phone=payload.phone, role="patient")
    db.add(user); db.commit(); db.refresh(user); return user
@router.post("/login", response_model=TokenOut)
def login(payload: LoginInput, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash) or not user.is_active: raise HTTPException(401, "Email or password is incorrect", headers={"WWW-Authenticate":"Bearer"})
    return {"access_token":create_access_token(user), "user":user}
@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)): return user

@router.post("/admin/users", response_model=UserOut, status_code=201)
def create_staff(payload: StaffUserCreate, db: Session = Depends(get_db), _: User = Depends(require_roles("admin"))):
    email=payload.email.lower()
    if db.query(User).filter(User.email==email).first(): raise HTTPException(409, "Email already registered")
    user=User(email=email,password_hash=hash_password(payload.password),full_name=payload.full_name,phone=payload.phone,role=payload.role)
    db.add(user); db.commit(); db.refresh(user); return user
