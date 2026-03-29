from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.database import get_db
from app.dependencies import get_current_user, get_manager_user
from app.models import User
from app.schemas.expenses import ExpenseResponse, ApproveRejectRequest
from app.services import expense_service

router = APIRouter(tags=["expenses"])


# ─── Expense CRUD ─────────────────────────────────────────────────────────────

@router.post("/expenses", response_model=ExpenseResponse, status_code=201)
def create_expense(
    original_amount: float = Form(...),
    currency: str = Form(...),
    category: str = Form(...),
    description: str | None = Form(None),
    expense_date: date = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return expense_service.create_expense(
        db,
        current_user.id,
        current_user.company_id,
        original_amount,
        currency,
        category,
        description,
        expense_date,
        file,
    )


@router.get("/expenses/my", response_model=List[ExpenseResponse])
def my_expenses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return expense_service.get_my_expenses(db, current_user.id, current_user.company_id)


@router.get("/expenses/team", response_model=List[ExpenseResponse])
def team_expenses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return expense_service.get_team_expenses(db, current_user.id, current_user.company_id)


@router.get("/expenses/all", response_model=List[ExpenseResponse])
def all_expenses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin only")
    return expense_service.get_all_expenses(db, current_user.company_id)


@router.get("/expenses/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return expense_service.get_expense_by_id(db, expense_id, current_user.company_id)


@router.post("/expenses/{expense_id}/submit", response_model=ExpenseResponse)
def submit_expense(expense_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return expense_service.submit_expense(db, expense_id, current_user.id, current_user.company_id)


# ─── Approvals ────────────────────────────────────────────────────────────────

@router.get("/approvals/pending", response_model=List[ExpenseResponse])
def pending_approvals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return expense_service.get_pending_approvals(db, current_user.id, current_user.company_id)


@router.get("/approvals/history", response_model=List[ExpenseResponse])
def approval_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    include_all = current_user.role in {"finance", "director"}
    return expense_service.get_approval_history(db, current_user.id, current_user.company_id, include_all=include_all)


@router.post("/approvals/{expense_id}/approve", response_model=ExpenseResponse)
def approve_expense(expense_id: str, data: ApproveRejectRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return expense_service.approve_expense(db, expense_id, current_user.id, current_user.company_id, data)


@router.post("/approvals/{expense_id}/reject", response_model=ExpenseResponse)
def reject_expense(expense_id: str, data: ApproveRejectRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return expense_service.reject_expense(db, expense_id, current_user.id, current_user.company_id, data)


# ─── Manager Approvals ───────────────────────────────────────────────────────

@router.get("/manager/approvals/pending", response_model=List[ExpenseResponse])
def manager_pending_approvals(current_user: User = Depends(get_manager_user), db: Session = Depends(get_db)):
    return expense_service.get_pending_approvals(db, current_user.id, current_user.company_id)


@router.post("/manager/approvals/{expense_id}/approve", response_model=ExpenseResponse)
def manager_approve_expense(expense_id: str, current_user: User = Depends(get_manager_user), db: Session = Depends(get_db)):
    data = ApproveRejectRequest(comment=None)
    return expense_service.approve_expense(db, expense_id, current_user.id, current_user.company_id, data)


@router.post("/manager/approvals/{expense_id}/reject", response_model=ExpenseResponse)
def manager_reject_expense(expense_id: str, current_user: User = Depends(get_manager_user), db: Session = Depends(get_db)):
    data = ApproveRejectRequest(comment=None)
    return expense_service.reject_expense(db, expense_id, current_user.id, current_user.company_id, data)
