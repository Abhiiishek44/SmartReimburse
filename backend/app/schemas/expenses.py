from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime, date


class ExpenseCreate(BaseModel):
    original_amount: float
    currency: str
    category: str
    description: Optional[str] = None
    expense_date: date
    receipt_url: Optional[str] = None


class ExpenseApprovalResponse(BaseModel):
    id: uuid.UUID
    approver_id: uuid.UUID
    step_order: int
    status: str
    comment: Optional[str]
    approved_at: Optional[datetime]
    approver_name: Optional[str] = None

    class Config:
        from_attributes = True


class ExpenseResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    company_id: uuid.UUID
    amount: float
    original_amount: float
    currency: str
    category: str
    description: Optional[str]
    expense_date: date
    receipt_url: Optional[str]
    status: str
    created_at: datetime
    employee_name: Optional[str] = None
    approval_steps: List[ExpenseApprovalResponse] = []

    class Config:
        from_attributes = True


class ApproveRejectRequest(BaseModel):
    comment: Optional[str] = None
