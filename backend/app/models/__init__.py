import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean, Float, Integer, Date, func, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    country = Column(String, nullable=False)
    base_currency = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)

    users = relationship("User", back_populates="company")
    approval_rules = relationship("ApprovalRule", back_populates="company")
    expenses = relationship("Expense", back_populates="company")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # admin, manager, employee
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="users")
    manager = relationship("User", remote_side="User.id", backref="subordinates")
    approver_entries = relationship("ApprovalRuleApprover", back_populates="approver", foreign_keys="ApprovalRuleApprover.approver_id")
    expenses = relationship("Expense", back_populates="employee", foreign_keys="Expense.employee_id")
    approval_actions = relationship("ExpenseApproval", back_populates="approver", foreign_keys="ExpenseApproval.approver_id")


class ApprovalRule(Base):
    __tablename__ = "approval_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    rule_name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_manager_approver = Column(Boolean, default=False)
    is_sequential = Column(Boolean, default=True)
    min_approval_percentage = Column(Float, default=100.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="approval_rules")
    approvers = relationship("ApprovalRuleApprover", back_populates="rule", cascade="all, delete-orphan", order_by="ApprovalRuleApprover.step_order")


class ApprovalRuleApprover(Base):
    __tablename__ = "approval_rule_approvers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_id = Column(UUID(as_uuid=True), ForeignKey("approval_rules.id"), nullable=False)
    approver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    step_order = Column(Integer, default=1)

    rule = relationship("ApprovalRule", back_populates="approvers")
    approver = relationship("User", back_populates="approver_entries", foreign_keys=[approver_id])


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    amount = Column(Float, nullable=False)           # converted to base currency
    original_amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    expense_date = Column(Date, nullable=False)
    receipt_url = Column(String, nullable=True)
    status = Column(String, nullable=False, default="draft")  # draft, submitted, pending, approved, rejected, reimbursed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("User", back_populates="expenses", foreign_keys=[employee_id])
    company = relationship("Company", back_populates="expenses")
    approval_steps = relationship("ExpenseApproval", back_populates="expense", cascade="all, delete-orphan", order_by="ExpenseApproval.step_order")


class ExpenseApproval(Base):
    __tablename__ = "expense_approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    expense_id = Column(UUID(as_uuid=True), ForeignKey("expenses.id"), nullable=False)
    approver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    step_order = Column(Integer, default=1)
    status = Column(String, nullable=False, default="pending")  # pending, approved, rejected
    comment = Column(Text, nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)

    expense = relationship("Expense", back_populates="approval_steps")
    approver = relationship("User", back_populates="approval_actions", foreign_keys=[approver_id])
