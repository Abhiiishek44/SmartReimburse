from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
from datetime import datetime


class CompanyResponse(BaseModel):
    id: uuid.UUID
    name: str
    country: str
    base_currency: str
    created_at: datetime
    created_by: Optional[uuid.UUID]

    class Config:
        from_attributes = True


class CompanyUpdateRequest(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    base_currency: Optional[str] = None


# ─── User schemas ─────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str  # manager, employee
    manager_id: Optional[uuid.UUID] = None


class UserUpdateRole(BaseModel):
    role: str


class AssignManagerRequest(BaseModel):
    manager_id: uuid.UUID


class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    role: str
    company_id: uuid.UUID
    manager_id: Optional[uuid.UUID]
    created_at: datetime

    class Config:
        from_attributes = True
