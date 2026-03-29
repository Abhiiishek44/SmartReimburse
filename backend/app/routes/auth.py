from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import AdminSignupRequest, LoginRequest, Token, UserResponse, RefreshTokenRequest, UserCreate
from app.models import User
from app.utils.security import verify_password, hash_password
from app.utils.jwt import create_access_token, create_refresh_token, decode_token
from app.dependencies import get_current_user, get_admin_user
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=UserResponse)
def admin_signup(request: AdminSignupRequest, db: Session = Depends(get_db)):
    existing_user = auth_service.get_user_by_email(db, request.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    return auth_service.create_admin_and_company(db, request)

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = auth_service.get_user_by_email(db, request.email)
    if not user or not verify_password(request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    payload = {
        "user_id": str(user.id),
        "role": user.role,
        "company_id": str(user.company_id)
    }
    
    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(request.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    user_id = payload.get("user_id")
    user = auth_service.get_user_by_id(db, user_id)
    if not user:
         raise HTTPException(status_code=401, detail="User not found")
         
    new_payload = {
        "user_id": str(user.id),
        "role": user.role,
        "company_id": str(user.company_id)
    }
    access_token = create_access_token(new_payload)
    new_refresh_token = create_refresh_token(new_payload)
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Example of an endpoint that only admin can access
@router.post("/users", response_model=UserResponse, dependencies=[Depends(get_admin_user)])
def create_user(request: UserCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing_user = auth_service.get_user_by_email(db, request.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = hash_password(request.password)
    new_user = User(
        name=request.name,
        email=request.email,
        password=hashed_pwd,
        role=request.role,
        company_id=current_user.company_id, # User belongs to the same company
        manager_id=request.manager_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user
