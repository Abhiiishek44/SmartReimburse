import uuid
import os
import shutil
from pathlib import Path
from datetime import datetime, timezone, date
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from app.models import Expense, ExpenseApproval, User, ApprovalRule
from app.schemas.expenses import ApproveRejectRequest

CATEGORIES = ["Travel", "Meals", "Accommodation", "Equipment", "Software", "Training", "Medical", "Other"]
ALLOWED_RECEIPT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "application/pdf": ".pdf",
}
MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024
UPLOAD_SUBDIR = os.path.join("uploads", "receipts")
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
UPLOAD_DIR = os.path.join(BASE_DIR, UPLOAD_SUBDIR)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _enrich_expense(expense: Expense) -> Expense:
    """Attach employee_name and approver_name for response serialization."""
    expense.employee_name = expense.employee.name if expense.employee else None
    for step in expense.approval_steps:
        step.approver_name = step.approver.name if step.approver else None
        step.approver_role = step.approver.role if step.approver else None
    return expense


def _normalize_approval_steps(expense: Expense) -> None:
    if expense.status != "pending" or not expense.approval_steps:
        return

    approval_type = (expense.approval_type or "SEQUENTIAL").upper()
    steps = expense.approval_steps

    if approval_type == "SEQUENTIAL":
        unapproved = [s for s in steps if s.status != "approved"]
        if not unapproved:
            return

        current_order = min(s.step_order for s in unapproved)
        for step in steps:
            if step.status == "approved":
                continue
            step.status = "pending" if step.step_order == current_order else "waiting"
        expense.current_approval_step = current_order
        return

    if approval_type == "SPECIFIC" and expense.specific_approver_id:
        for step in steps:
            if step.status == "approved":
                continue
            step.status = "pending" if step.approver_id == expense.specific_approver_id else "waiting"
        specific_step = next((s for s in steps if s.approver_id == expense.specific_approver_id), None)
        if specific_step:
            expense.current_approval_step = specific_step.step_order
        return

    for step in steps:
        if step.status != "approved":
            step.status = "pending"
    pending_orders = [s.step_order for s in steps if s.status == "pending"]
    if pending_orders:
        expense.current_approval_step = min(pending_orders)


def _get_expense_or_404(db: Session, expense_id: uuid.UUID, company_id: uuid.UUID) -> Expense:
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.company_id == company_id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


def _save_receipt_file(file: UploadFile) -> tuple[str, str]:
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="Receipt file is required")
    if file.content_type not in ALLOWED_RECEIPT_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, or PDF receipts are allowed")

    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > MAX_RECEIPT_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Receipt file must be 5MB or less")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    original_name = file.filename
    suffix = Path(original_name).suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".pdf"}:
        suffix = ALLOWED_RECEIPT_TYPES[file.content_type]
    if suffix == ".jpeg":
        suffix = ".jpg"

    stored_name = f"{uuid.uuid4().hex}{suffix}"
    abs_path = os.path.join(UPLOAD_DIR, stored_name)
    with open(abs_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    relative_path = os.path.join(UPLOAD_SUBDIR, stored_name).replace("\\", "/")
    return relative_path, original_name


# ─── Create ───────────────────────────────────────────────────────────────────

def create_expense(
    db: Session,
    employee_id: uuid.UUID,
    company_id: uuid.UUID,
    original_amount: float,
    currency: str,
    category: str,
    description: str | None,
    expense_date: date,
    receipt_file: UploadFile,
) -> Expense:
    receipt_path, receipt_original_name = _save_receipt_file(receipt_file)
    expense = Expense(
        employee_id=employee_id,
        company_id=company_id,
        amount=original_amount,   # Will be converted on submit
        original_amount=original_amount,
        currency=currency,
        category=category,
        description=description,
        expense_date=expense_date,
        receipt_file=receipt_path,
        receipt_original_name=receipt_original_name,
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
        Expense.company_id == company_id,
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if expense.status != "draft":
        raise HTTPException(status_code=400, detail=f"Cannot submit expense in '{expense.status}' status")

    # Delete any old approval steps
    db.query(ExpenseApproval).filter(ExpenseApproval.expense_id == expense_id).delete(synchronize_session=False)
    expense.status = "pending"

    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if not employee.manager_id:
        managers = db.query(User).filter(
            User.company_id == company_id,
            User.role == "manager",
        ).order_by(User.created_at.asc()).all()
        if len(managers) == 1:
            employee.manager_id = managers[0].id
            db.commit()
            db.refresh(employee)
        else:
            raise HTTPException(status_code=400, detail="Employee must have a manager assigned before submitting")

    rule = (
        db.query(ApprovalRule)
        .filter(ApprovalRule.company_id == company_id)
        .order_by(ApprovalRule.created_at.desc())
        .first()
    )

    approvers = []
    if rule and rule.approvers:
        approvers = sorted(rule.approvers, key=lambda a: a.step_order)
    else:
        finance_user = db.query(User).filter(
            User.company_id == company_id,
            User.role == "finance",
        ).order_by(User.created_at.asc()).first()
        director_user = db.query(User).filter(
            User.company_id == company_id,
            User.role == "director",
        ).order_by(User.created_at.asc()).first()
        if not finance_user or not director_user:
            raise HTTPException(status_code=400, detail="Finance and Director users must exist in this company")

        approvers = [
            type("obj", (), {"approver_id": employee.manager_id, "step_order": 1}),
            type("obj", (), {"approver_id": finance_user.id, "step_order": 2}),
            type("obj", (), {"approver_id": director_user.id, "step_order": 3}),
        ]

    expense.approval_type = rule.approval_type if rule else "SEQUENTIAL"
    expense.percentage_value = rule.percentage_value if rule else None
    expense.specific_approver_id = rule.specific_approver_id if rule else None
    expense.current_approval_step = 0

    for entry in approvers:
        db.add(ExpenseApproval(
            expense_id=expense.id,
            approver_id=entry.approver_id,
            step_order=entry.step_order,
            status="waiting",
        ))

    db.flush()
    _normalize_approval_steps(expense)
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


def get_expense_by_id(db: Session, expense_id: uuid.UUID, company_id: uuid.UUID) -> Expense:
    expense = _get_expense_or_404(db, expense_id, company_id)
    return _enrich_expense(expense)


def get_pending_approvals(db: Session, approver_id: uuid.UUID, company_id: uuid.UUID):
    """Get expenses where this user has the active pending approval step."""
    pending_expenses = db.query(Expense).filter(
        Expense.company_id == company_id,
    ).all()
    for expense in pending_expenses:
        _normalize_approval_steps(expense)
    if pending_expenses:
        db.commit()

    expenses = db.query(Expense).join(
        ExpenseApproval, ExpenseApproval.expense_id == Expense.id
    ).filter(
        ExpenseApproval.approver_id == approver_id,
        ExpenseApproval.status == "pending",
        Expense.company_id == company_id,
    ).order_by(Expense.created_at.desc()).all()

    return [_enrich_expense(exp) for exp in expenses]


def get_approval_history(db: Session, approver_id: uuid.UUID, company_id: uuid.UUID, include_all: bool = False):
    """Get approval history for an approver or entire company when requested."""
    query = db.query(Expense).join(
        ExpenseApproval, ExpenseApproval.expense_id == Expense.id
    ).filter(
        ExpenseApproval.status.in_(["approved", "rejected"]),
        Expense.company_id == company_id,
    )

    if not include_all:
        query = query.filter(ExpenseApproval.approver_id == approver_id)

    expenses = query.order_by(
        ExpenseApproval.approved_at.desc().nullslast(),
        Expense.created_at.desc(),
    ).all()

    return [_enrich_expense(exp) for exp in expenses]


# ─── Approve / Reject ─────────────────────────────────────────────────────────

def approve_expense(db: Session, expense_id: uuid.UUID, approver_id: uuid.UUID, company_id: uuid.UUID, data: ApproveRejectRequest) -> Expense:
    expense = _get_expense_or_404(db, expense_id, company_id)
    if expense.status == "rejected":
        raise HTTPException(status_code=400, detail="Expense is not pending approval")

    _normalize_approval_steps(expense)

    # Find this approver's step
    step = db.query(ExpenseApproval).filter(
        ExpenseApproval.expense_id == expense_id,
        ExpenseApproval.approver_id == approver_id,
        ExpenseApproval.status == "pending",
    ).first()
    if not step:
        raise HTTPException(status_code=403, detail="You are not an approver for this expense or already actioned")

    pending_orders = sorted({s.step_order for s in expense.approval_steps if s.status == "pending"})
    if pending_orders and step.step_order != pending_orders[0]:
        raise HTTPException(status_code=400, detail="Waiting for earlier approvals")

    step.status = "approved"
    step.comment = data.comment
    step.approved_at = datetime.now(timezone.utc)

    approvals = expense.approval_steps
    total = len(approvals)
    approved_count = sum(1 for s in approvals if s.status == "approved")
    percentage = (approved_count / total) * 100 if total else 0
    specific_approved = expense.specific_approver_id and approver_id == expense.specific_approver_id

    should_approve = False
    approval_type = (expense.approval_type or "SEQUENTIAL").upper()

    if approval_type == "SEQUENTIAL":
        should_approve = all(s.status == "approved" for s in approvals)
    elif approval_type == "PERCENTAGE":
        should_approve = expense.percentage_value is not None and percentage >= expense.percentage_value
    elif approval_type == "SPECIFIC":
        should_approve = bool(specific_approved)
    elif approval_type == "HYBRID":
        should_approve = bool(specific_approved) or (
            expense.percentage_value is not None and percentage >= expense.percentage_value
        )

    if should_approve:
        expense.status = "approved"
    else:
        _normalize_approval_steps(expense)

    db.commit()
    db.refresh(expense)
    return _enrich_expense(expense)


def reject_expense(db: Session, expense_id: uuid.UUID, approver_id: uuid.UUID, company_id: uuid.UUID, data: ApproveRejectRequest) -> Expense:
    expense = _get_expense_or_404(db, expense_id, company_id)
    if expense.status == "rejected":
        raise HTTPException(status_code=400, detail="Expense is not pending approval")

    step = db.query(ExpenseApproval).filter(
        ExpenseApproval.expense_id == expense_id,
        ExpenseApproval.approver_id == approver_id,
        ExpenseApproval.status == "pending",
    ).first()
    if not step:
        raise HTTPException(status_code=403, detail="You are not an approver for this expense or already actioned")

    pending_orders = sorted({s.step_order for s in expense.approval_steps if s.status == "pending"})
    if pending_orders and step.step_order != pending_orders[0]:
        raise HTTPException(status_code=400, detail="Waiting for earlier approvals")

    step.status = "rejected"
    step.comment = data.comment
    step.approved_at = datetime.now(timezone.utc)
    expense.status = "rejected"
    db.query(ExpenseApproval).filter(
        ExpenseApproval.expense_id == expense_id,
        ExpenseApproval.id != step.id,
    ).delete(synchronize_session=False)
    db.commit()
    db.refresh(expense)
    return _enrich_expense(expense)
