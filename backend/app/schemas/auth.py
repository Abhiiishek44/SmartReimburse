from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
from datetime import datetime

class CompanyCreate(BaseModel):
    name: str
    country: str
    base_currency: str

class AdminSignupRequest(BaseModel):
    user_name: str
    email: EmailStr
    password: str
    company_name: str
    country: str
    base_currency: str

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str # admin, manager, employee
    manager_id: Optional[uuid.UUID] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    role: str
    company_id: uuid.UUID
    manager_id: Optional[uuid.UUID]
    created_at: datetime

    class Config:
        from_attributes = True

class CompanyResponse(BaseModel):
    id: uuid.UUID
    name: str
    country: str
    base_currency: str
    created_at: datetime

    class Config:
        from_attributes = True
