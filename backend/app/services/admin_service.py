from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import ApprovalRule, ApprovalRuleApprover, User
from app.schemas.admin import ApprovalRuleCreate, ApprovalRuleUpdate, AddApproversRequest, ApprovalConfigUpdate
import uuid


# ─── Dashboard stats ──────────────────────────────────────────────────────────

def get_dashboard_stats(db: Session, company_id: uuid.UUID) -> dict:
    total_employees = db.query(User).filter(User.company_id == company_id, User.role == "employee").count()
    total_managers = db.query(User).filter(User.company_id == company_id, User.role == "manager").count()
    total_rules = db.query(ApprovalRule).filter(ApprovalRule.company_id == company_id).count()
    return {
        "total_employees": total_employees,
        "total_managers": total_managers,
        "total_rules": total_rules,
    }


def get_approval_config(db: Session, company_id: uuid.UUID):
    rule = (
        db.query(ApprovalRule)
        .filter(ApprovalRule.company_id == company_id)
        .order_by(ApprovalRule.created_at.desc())
        .first()
    )
    if not rule:
        rule = ApprovalRule(
            company_id=company_id,
            rule_name="Default Approval Flow",
            description="Default approval configuration",
            approval_type="SEQUENTIAL",
            percentage_value=None,
            specific_approver_id=None,
        )
        db.add(rule)
        db.commit()
        db.refresh(rule)
    return rule


def update_approval_config(db: Session, company_id: uuid.UUID, data: ApprovalConfigUpdate):
    rule = get_approval_config(db, company_id)
    rule.rule_name = "Default Approval Flow"
    rule.description = "Default approval configuration"
    rule.approval_type = data.approval_type
    rule.percentage_value = data.percentage_value
    rule.specific_approver_id = data.specific_approver_id

    db.query(ApprovalRuleApprover).filter(ApprovalRuleApprover.rule_id == rule.id).delete()

    approver_ids = [entry.approver_id for entry in data.approvers]
    if len(approver_ids) != len(set(approver_ids)):
        raise HTTPException(status_code=400, detail="Each approval step must use a different approver")

    for entry in data.approvers:
        user = db.query(User).filter(
            User.id == entry.approver_id,
            User.company_id == company_id,
        ).first()
        if not user:
            raise HTTPException(status_code=400, detail=f"User {entry.approver_id} not found in your company")

        approver = ApprovalRuleApprover(
            rule_id=rule.id,
            approver_id=entry.approver_id,
            step_order=entry.step_order,
        )
        db.add(approver)

    db.commit()
    db.refresh(rule)
    return rule


# ─── Users ────────────────────────────────────────────────────────────────────

def get_company_users(db: Session, company_id: uuid.UUID) -> list:
    return db.query(User).filter(User.company_id == company_id).all()


# ─── Rules ────────────────────────────────────────────────────────────────────

def create_rule(db: Session, company_id: uuid.UUID, data: ApprovalRuleCreate) -> ApprovalRule:
    rule = ApprovalRule(
        company_id=company_id,
        rule_name=data.rule_name,
        description=data.description,
        is_manager_approver=data.is_manager_approver,
        is_sequential=data.is_sequential,
        min_approval_percentage=data.min_approval_percentage,
        approval_type=data.approval_type,
        percentage_value=data.percentage_value,
        specific_approver_id=data.specific_approver_id,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


def get_rules(db: Session, company_id: uuid.UUID) -> list:
    return (
        db.query(ApprovalRule)
        .filter(ApprovalRule.company_id == company_id)
        .order_by(ApprovalRule.created_at.desc())
        .all()
    )


def get_rule_by_id(db: Session, rule_id: uuid.UUID, company_id: uuid.UUID) -> ApprovalRule:
    rule = db.query(ApprovalRule).filter(
        ApprovalRule.id == rule_id,
        ApprovalRule.company_id == company_id,
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Approval rule not found")
    return rule


def update_rule(db: Session, rule_id: uuid.UUID, company_id: uuid.UUID, data: ApprovalRuleUpdate) -> ApprovalRule:
    rule = get_rule_by_id(db, rule_id, company_id)
    if data.rule_name is not None:
        rule.rule_name = data.rule_name
    if data.description is not None:
        rule.description = data.description
    if data.is_manager_approver is not None:
        rule.is_manager_approver = data.is_manager_approver
    if data.is_sequential is not None:
        rule.is_sequential = data.is_sequential
    if data.min_approval_percentage is not None:
        rule.min_approval_percentage = data.min_approval_percentage
    if data.approval_type is not None:
        rule.approval_type = data.approval_type
    if data.percentage_value is not None:
        rule.percentage_value = data.percentage_value
    if data.specific_approver_id is not None:
        rule.specific_approver_id = data.specific_approver_id
    db.commit()
    db.refresh(rule)
    return rule


def delete_rule(db: Session, rule_id: uuid.UUID, company_id: uuid.UUID):
    rule = get_rule_by_id(db, rule_id, company_id)
    db.delete(rule)
    db.commit()


# ─── Approvers ───────────────────────────────────────────────────────────────

def add_approvers(db: Session, rule_id: uuid.UUID, company_id: uuid.UUID, data: AddApproversRequest) -> ApprovalRule:
    rule = get_rule_by_id(db, rule_id, company_id)

    # Clear existing approvers and replace
    db.query(ApprovalRuleApprover).filter(ApprovalRuleApprover.rule_id == rule_id).delete()

    for entry in data.approvers:
        # Validate approver belongs to same company
        user = db.query(User).filter(
            User.id == entry.approver_id,
            User.company_id == company_id,
        ).first()
        if not user:
            raise HTTPException(status_code=400, detail=f"User {entry.approver_id} not found in your company")

        approver = ApprovalRuleApprover(
            rule_id=rule_id,
            approver_id=entry.approver_id,
            step_order=entry.step_order,
        )
        db.add(approver)

    db.commit()
    db.refresh(rule)
    return rule
