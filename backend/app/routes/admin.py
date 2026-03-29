from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.dependencies import get_admin_user
from app.models import User
from app.schemas.admin import (
    ApprovalRuleCreate, ApprovalRuleUpdate, ApprovalRuleResponse,
    AddApproversRequest, UserListItem, DashboardStats, ApprovalConfigUpdate, ApprovalConfigResponse
)
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Admin dashboard statistics."""
    return admin_service.get_dashboard_stats(db, current_user.company_id)


@router.get("/approval-config", response_model=ApprovalConfigResponse)
def get_approval_config(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    rule = admin_service.get_approval_config(db, current_user.company_id)
    return {
        "rule_id": rule.id,
        "approval_type": rule.approval_type,
        "percentage_value": rule.percentage_value,
        "specific_approver_id": rule.specific_approver_id,
        "approvers": rule.approvers,
    }


@router.put("/approval-config", response_model=ApprovalConfigResponse)
def update_approval_config(
    data: ApprovalConfigUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    rule = admin_service.update_approval_config(db, current_user.company_id, data)
    return {
        "rule_id": rule.id,
        "approval_type": rule.approval_type,
        "percentage_value": rule.percentage_value,
        "specific_approver_id": rule.specific_approver_id,
        "approvers": rule.approvers,
    }


@router.get("/users", response_model=List[UserListItem])
def get_users(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users in company (for dynamic dropdowns)."""
    return admin_service.get_company_users(db, current_user.company_id)


@router.post("/rules", response_model=ApprovalRuleResponse, status_code=201)
def create_rule(
    data: ApprovalRuleCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new approval rule."""
    return admin_service.create_rule(db, current_user.company_id, data)


@router.get("/rules", response_model=List[ApprovalRuleResponse])
def get_rules(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all approval rules for this company."""
    return admin_service.get_rules(db, current_user.company_id)


@router.put("/rules/{rule_id}", response_model=ApprovalRuleResponse)
def update_rule(
    rule_id: str,
    data: ApprovalRuleUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update an existing approval rule."""
    return admin_service.update_rule(db, rule_id, current_user.company_id, data)


@router.delete("/rules/{rule_id}", status_code=204)
def delete_rule(
    rule_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete an approval rule."""
    admin_service.delete_rule(db, rule_id, current_user.company_id)


@router.post("/rules/{rule_id}/approvers", response_model=ApprovalRuleResponse)
def add_approvers(
    rule_id: str,
    data: AddApproversRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Set approvers for a rule (replaces existing approvers)."""
    return admin_service.add_approvers(db, rule_id, current_user.company_id, data)
