from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime


# ─── Approver schemas ────────────────────────────────────────────────────────

class ApproverInfo(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True


class ApprovalRuleApproverResponse(BaseModel):
    id: uuid.UUID
    approver_id: uuid.UUID
    step_order: int
    approver: ApproverInfo

    class Config:
        from_attributes = True


# ─── Rule schemas ─────────────────────────────────────────────────────────────

class ApprovalRuleCreate(BaseModel):
    rule_name: str
    description: Optional[str] = None
    is_manager_approver: bool = False
    is_sequential: bool = True
    min_approval_percentage: float = 100.0
    approval_type: str = "SEQUENTIAL"
    percentage_value: Optional[float] = None
    specific_approver_id: Optional[uuid.UUID] = None


class ApprovalRuleUpdate(BaseModel):
    rule_name: Optional[str] = None
    description: Optional[str] = None
    is_manager_approver: Optional[bool] = None
    is_sequential: Optional[bool] = None
    min_approval_percentage: Optional[float] = None
    approval_type: Optional[str] = None
    percentage_value: Optional[float] = None
    specific_approver_id: Optional[uuid.UUID] = None


class ApprovalRuleResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    rule_name: str
    description: Optional[str]
    is_manager_approver: bool
    is_sequential: bool
    min_approval_percentage: float
    approval_type: str
    percentage_value: Optional[float] = None
    specific_approver_id: Optional[uuid.UUID] = None
    created_at: datetime
    approvers: List[ApprovalRuleApproverResponse] = []

    class Config:
        from_attributes = True


# ─── Add approvers request ────────────────────────────────────────────────────

class ApproverEntry(BaseModel):
    approver_id: uuid.UUID
    step_order: int = 1


class AddApproversRequest(BaseModel):
    approvers: List[ApproverEntry]


class ApprovalConfigUpdate(BaseModel):
    approval_type: str
    percentage_value: Optional[float] = None
    specific_approver_id: Optional[uuid.UUID] = None
    approvers: List[ApproverEntry]


class ApprovalConfigResponse(BaseModel):
    rule_id: uuid.UUID
    approval_type: str
    percentage_value: Optional[float] = None
    specific_approver_id: Optional[uuid.UUID] = None
    approvers: List[ApprovalRuleApproverResponse] = []

    class Config:
        from_attributes = True


# ─── User list schema ─────────────────────────────────────────────────────────

class UserListItem(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    role: str
    manager_id: Optional[uuid.UUID]

    class Config:
        from_attributes = True


# ─── Dashboard stats ──────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_employees: int
    total_managers: int
    total_rules: int
