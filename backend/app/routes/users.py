from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.dependencies import get_admin_user
from app.models import User
from app.schemas.company import UserCreate, UserUpdateRole, AssignManagerRequest, UserResponse
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[UserResponse])
def get_users(current_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return user_service.get_all_users(db, current_user.company_id)


@router.post("", response_model=UserResponse, status_code=201)
def create_user(data: UserCreate, current_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return user_service.create_user(db, current_user.company_id, data)


@router.put("/{user_id}", response_model=UserResponse)
def update_role(user_id: str, data: UserUpdateRole, current_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return user_service.update_user_role(db, user_id, current_user.company_id, data)


@router.put("/{user_id}/assign-manager", response_model=UserResponse)
def assign_manager(user_id: str, data: AssignManagerRequest, current_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return user_service.assign_manager(db, user_id, current_user.company_id, data)


@router.put("/{user_id}/reset-password", response_model=UserResponse)
def reset_password(user_id: str, data: dict, current_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    new_password = data.get("password")
    if not new_password:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Password is required")
    return user_service.reset_password(db, user_id, current_user.company_id, new_password)
