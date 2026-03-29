from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import User, Company
from app.schemas.auth import AdminSignupRequest
from app.utils.security import hash_password

def create_admin_and_company(db: Session, request: AdminSignupRequest):
    new_company = Company(
        name=request.company_name,
        country=request.country,
        base_currency=request.base_currency
    )
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    
    hashed_pwd = hash_password(request.password)
    new_user = User(
        name=request.user_name,
        email=request.email,
        password=hashed_pwd,
        role="admin",
        company_id=new_company.id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: str):
    return db.query(User).filter(User.id == user_id).first()
