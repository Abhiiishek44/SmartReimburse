import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import Expense, ExpenseApproval, ApprovalRule, User
from app.schemas.expenses import ExpenseCreate, ApproveRejectRequest

CATEGORIES = ["Travel", "Meals", "Accommodation", "Equipment", "Software", "Training", "Medical", "Other"]


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _enrich_expense(expense: Expense) -> Expense:
    """Attach employee_name and approver_name for response serialization."""
    expense.employee_name = expense.employee.name if expense.employee else None
    for step in expense.approval_steps:
        step.approver_name = step.approver.name if step.approver else None
    return expense


def _get_expense_or_404(db: Session, expense_id: uuid.UUID, company_id: uuid.UUID) -> Expense:
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.company_id == company_id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


# ─── Create ───────────────────────────────────────────────────────────────────

def create_expense(db: Session, employee_id: uuid.UUID, company_id: uuid.UUID, data: ExpenseCreate) -> Expense:
    expense = Expense(
        employee_id=employee_id,
        company_id=company_id,
        amount=data.original_amount,   # Will be converted on submit
        original_amount=data.original_amount,
        currency=data.currency,
        category=data.category,
        description=data.description,
        expense_date=data.expense_date,
        receipt_url=data.receipt_url,
        status="draft",
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return _enrich_expense(expense)


# ─── Submit ───────────────────────────────────────────────────────────────────

def submit_expense(db: Session, expense_id: uuid.UUID, employee_id: uuid.UUID, company_id: uuid.UUID) -> Expense:
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.employee_id == employee_id,
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if expense.status != "draft":
        raise HTTPException(status_code=400, detail=f"Cannot submit expense in '{expense.status}' status")

    # Find applicable approval rule for company
    rule: Optional[ApprovalRule] = db.query(ApprovalRule).filter(
        ApprovalRule.company_id == company_id
    ).first()

    # Delete any old approval steps
    db.query(ExpenseApproval).filter(ExpenseApproval.expense_id == expense_id).delete()

    if not rule:
        # No rules configured — auto approve
        expense.status = "approved"
        db.commit()
        db.refresh(expense)
        return _enrich_expense(expense)

    steps = []

    # If manager is approver, add manager as step 0
    if rule.is_manager_approver:
        employee = db.query(User).filter(User.id == employee_id).first()
        if employee and employee.manager_id:
            steps.append({"approver_id": employee.manager_id, "step_order": 1})

    # Add rule approvers
    base_order = len(steps) + 1
    for ra in sorted(rule.approvers, key=lambda x: x.step_order):
        step_order = (base_order + ra.step_order - 1) if rule.is_sequential else 1
        steps.append({"approver_id": ra.approver_id, "step_order": step_order})

    if not steps:
        expense.status = "approved"
        db.commit()
        db.refresh(expense)
        return _enrich_expense(expense)

    for s in steps:
        db.add(ExpenseApproval(
            expense_id=expense_id,
            approver_id=s["approver_id"],
            step_order=s["step_order"],
            status="pending",
        ))

    expense.status = "pending"
    db.commit()
    db.refresh(expense)
    return _enrich_expense(expense)


# ─── Queries ─────────────────────────────────────────────────────────────────

def get_my_expenses(db: Session, employee_id: uuid.UUID, company_id: uuid.UUID):
    expenses = db.query(Expense).filter(
        Expense.employee_id == employee_id,
        Expense.company_id == company_id,
    ).order_by(Expense.created_at.desc()).all()
    return [_enrich_expense(e) for e in expenses]


def get_team_expenses(db: Session, manager_id: uuid.UUID, company_id: uuid.UUID):
    # Get employees whose manager is this user
    subordinate_ids = [
        u.id for u in db.query(User).filter(
            User.manager_id == manager_id,
            User.company_id == company_id,
        ).all()
    ]
    if not subordinate_ids:
        return []
    expenses = db.query(Expense).filter(
        Expense.employee_id.in_(subordinate_ids),
        Expense.company_id == company_id,
    ).order_by(Expense.created_at.desc()).all()
    return [_enrich_expense(e) for e in expenses]


def get_all_expenses(db: Session, company_id: uuid.UUID):
    expenses = db.query(Expense).filter(
        Expense.company_id == company_id,
    ).order_by(Expense.created_at.desc()).all()
    return [_enrich_expense(e) for e in expenses]


def get_pending_approvals(db: Session, approver_id: uuid.UUID, company_id: uuid.UUID):
    """Get expenses where this user has a pending approval step."""
    pending_steps = db.query(ExpenseApproval).filter(
        ExpenseApproval.approver_id == approver_id,
        ExpenseApproval.status == "pending",
    ).all()

    result = []
    for step in pending_steps:
        exp = db.query(Expense).filter(
            Expense.id == step.expense_id,
            Expense.company_id == company_id,
            Expense.status == "pending",
        ).first()
        if exp:
            # For sequential: only include if this is the current active step
            step_orders = sorted(
                [s.step_order for s in exp.approval_steps if s.status == "pending"]
            )
            min_pending_order = step_orders[0] if step_orders else None
            if min_pending_order is None or step.step_order == min_pending_order:
                result.append(_enrich_expense(exp))
    return result


# ─── Approve / Reject ─────────────────────────────────────────────────────────

def approve_expense(db: Session, expense_id: uuid.UUID, approver_id: uuid.UUID, company_id: uuid.UUID, data: ApproveRejectRequest) -> Expense:
    expense = _get_expense_or_404(db, expense_id, company_id)
    if expense.status != "pending":
        raise HTTPException(status_code=400, detail="Expense is not pending approval")

    # Find this approver's step
    step = db.query(ExpenseApproval).filter(
        ExpenseApproval.expense_id == expense_id,
        ExpenseApproval.approver_id == approver_id,
        ExpenseApproval.status == "pending",
    ).first()
    if not step:
        raise HTTPException(status_code=403, detail="You are not an approver for this expense or already actioned")

    step.status = "approved"
    step.comment = data.comment
    step.approved_at = datetime.now(timezone.utc)
    db.commit()

    # Check if all steps approved (or parallel threshold met)
    all_steps = db.query(ExpenseApproval).filter(ExpenseApproval.expense_id == expense_id).all()
    total = len(all_steps)
    approved_count = sum(1 for s in all_steps if s.status == "approved")
    pending_count = sum(1 for s in all_steps if s.status == "pending")

    # Are all steps done?
    if pending_count == 0:
        expense.status = "approved"
    else:
        # Check if min percentage met (parallel mode)
        pct = (approved_count / total) * 100
        rule = db.query(ApprovalRule).filter(ApprovalRule.company_id == company_id).first()
        if rule and not rule.is_sequential and pct >= rule.min_approval_percentage:
            expense.status = "approved"

    db.commit()
    db.refresh(expense)
    return _enrich_expense(expense)


def reject_expense(db: Session, expense_id: uuid.UUID, approver_id: uuid.UUID, company_id: uuid.UUID, data: ApproveRejectRequest) -> Expense:
    expense = _get_expense_or_404(db, expense_id, company_id)
    if expense.status != "pending":
        raise HTTPException(status_code=400, detail="Expense is not pending approval")

    step = db.query(ExpenseApproval).filter(
        ExpenseApproval.expense_id == expense_id,
        ExpenseApproval.approver_id == approver_id,
        ExpenseApproval.status == "pending",
    ).first()
    if not step:
        raise HTTPException(status_code=403, detail="You are not an approver for this expense or already actioned")

    step.status = "rejected"
    step.comment = data.comment
    step.approved_at = datetime.now(timezone.utc)
    expense.status = "rejected"
    db.commit()
    db.refresh(expense)
    return _enrich_expense(expense)
