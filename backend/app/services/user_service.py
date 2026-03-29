import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import User
from app.schemas.company import UserCreate, UserUpdateRole, AssignManagerRequest
from app.utils.security import hash_password


def get_all_users(db: Session, company_id: uuid.UUID):
    return db.query(User).filter(User.company_id == company_id).order_by(User.created_at.desc()).all()


def get_user_by_id(db: Session, user_id: uuid.UUID, company_id: uuid.UUID) -> User:
    user = db.query(User).filter(User.id == user_id, User.company_id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def create_user(db: Session, company_id: uuid.UUID, data: UserCreate) -> User:
    # Check email uniqueness
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if data.role not in ("manager", "employee", "finance", "director"):
        raise HTTPException(status_code=400, detail="Role must be 'manager', 'employee', 'finance', or 'director'")

    # If employee, require manager_id and validate
    if data.role == "employee":
        if not data.manager_id:
            raise HTTPException(status_code=400, detail="Employee must have a manager assigned")
        manager = db.query(User).filter(User.id == data.manager_id, User.company_id == company_id, User.role == "manager").first()
        if not manager:
            raise HTTPException(status_code=400, detail="Manager not found in your company")

    new_user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role=data.role,
        company_id=company_id,
        manager_id=data.manager_id if data.role == "employee" else None,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def update_user_role(db: Session, user_id: uuid.UUID, company_id: uuid.UUID, data: UserUpdateRole) -> User:
    user = get_user_by_id(db, user_id, company_id)
    if data.role not in ("admin", "manager", "employee", "finance", "director"):
        raise HTTPException(status_code=400, detail="Invalid role")
    user.role = data.role
    if data.role in ("admin", "manager", "finance", "director"):
        user.manager_id = None
    db.commit()
    db.refresh(user)
    return user


def assign_manager(db: Session, user_id: uuid.UUID, company_id: uuid.UUID, data: AssignManagerRequest) -> User:
    user = get_user_by_id(db, user_id, company_id)
    if user.role != "employee":
        raise HTTPException(status_code=400, detail="Only employees can be assigned a manager")
    manager = db.query(User).filter(User.id == data.manager_id, User.company_id == company_id, User.role == "manager").first()
    if not manager:
        raise HTTPException(status_code=400, detail="Manager not found in your company")
    if manager.id == user.id:
        raise HTTPException(status_code=400, detail="Employee cannot be their own manager")
    user.manager_id = data.manager_id
    db.commit()
    db.refresh(user)
    return user


def reset_password(db: Session, user_id: uuid.UUID, company_id: uuid.UUID, new_password: str) -> User:
    user = get_user_by_id(db, user_id, company_id)
    user.password = hash_password(new_password)
    db.commit()
    db.refresh(user)
    return user
