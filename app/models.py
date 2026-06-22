from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Boolean, DECIMAL, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Department(Base):
    __tablename__ = 'department'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, default=func.now())
    
    employees = relationship('Employee', back_populates='department')
    issues = relationship('AuditIssue', back_populates='department')
    transactions = relationship('ERPTransaction', back_populates='department')


class Employee(Base):
    __tablename__ = 'employee'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    employee_no = Column(String(50), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey('department.id'))
    email = Column(String(100))
    created_at = Column(DateTime, default=func.now())
    
    department = relationship('Department', back_populates='employees')
    permission_logs = relationship('PermissionLog', back_populates='employee')
    assigned_issues = relationship('AuditIssue', foreign_keys='AuditIssue.assignee_id', back_populates='assignee')
    note_tasks = relationship('NoteTask', foreign_keys='NoteTask.assignee_id', back_populates='assignee')
    created_tasks = relationship('NoteTask', foreign_keys='NoteTask.created_by', back_populates='creator')
    owned_plans = relationship('RectificationPlan', back_populates='owner')
    sampling_records = relationship('SamplingRecord', back_populates='sampler')
    uploaded_evidences = relationship('Evidence', back_populates='uploader')


class PermissionLog(Base):
    __tablename__ = 'permission_log'
    
    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey('employee.id'))
    action = Column(String(50), nullable=False)
    resource = Column(String(200), nullable=False)
    ip_address = Column(String(50))
    log_time = Column(DateTime, nullable=False)
    raw_data = Column(JSON)
    imported_at = Column(DateTime, default=func.now())
    
    employee = relationship('Employee', back_populates='permission_logs')
    sampling_records = relationship('SamplingRecord', back_populates='permission_log')
    evidences = relationship('Evidence', back_populates='permission_log')
    
    __table_args__ = (
        Index('idx_permission_time', 'log_time'),
        Index('idx_permission_employee', 'employee_id'),
    )


class Supplier(Base):
    __tablename__ = 'supplier'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    tax_no = Column(String(50), unique=True)
    contact_person = Column(String(100))
    risk_level = Column(String(20), default='normal')
    created_at = Column(DateTime, default=func.now())
    
    transactions = relationship('ERPTransaction', back_populates='supplier')


class ERPTransaction(Base):
    __tablename__ = 'erp_transaction'
    
    id = Column(Integer, primary_key=True)
    transaction_no = Column(String(50), unique=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey('supplier.id'))
    amount = Column(DECIMAL(15, 2), nullable=False)
    transaction_date = Column(Date, nullable=False)
    transaction_type = Column(String(50))
    department_id = Column(Integer, ForeignKey('department.id'))
    raw_data = Column(JSON)
    imported_at = Column(DateTime, default=func.now())
    
    supplier = relationship('Supplier', back_populates='transactions')
    department = relationship('Department', back_populates='transactions')
    sampling_records = relationship('SamplingRecord', back_populates='transaction')
    evidences = relationship('Evidence', back_populates='transaction')
    
    __table_args__ = (
        Index('idx_erp_date', 'transaction_date'),
        Index('idx_erp_supplier', 'supplier_id'),
    )


class ChecklistCategory(Base):
    __tablename__ = 'checklist_category'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    parent_id = Column(Integer, ForeignKey('checklist_category.id'))
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
    
    parent = relationship('ChecklistCategory', remote_side=[id], back_populates='children')
    children = relationship('ChecklistCategory', back_populates='parent')
    items = relationship('ChecklistItem', back_populates='category')


class ChecklistItem(Base):
    __tablename__ = 'checklist_item'
    
    id = Column(Integer, primary_key=True)
    category_id = Column(Integer, ForeignKey('checklist_category.id'))
    item_code = Column(String(50), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    risk_level = Column(String(20), default='medium')
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
    
    category = relationship('ChecklistCategory', back_populates='items')
    subitems = relationship('ChecklistSubitem', back_populates='item')
    issues = relationship('AuditIssue', back_populates='checklist_item')


class ChecklistSubitem(Base):
    __tablename__ = 'checklist_subitem'
    
    id = Column(Integer, primary_key=True)
    item_id = Column(Integer, ForeignKey('checklist_item.id'))
    title = Column(String(200), nullable=False)
    check_method = Column(Text)
    evidence_requirement = Column(Text)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
    
    item = relationship('ChecklistItem', back_populates='subitems')


class AuditIssue(Base):
    __tablename__ = 'audit_issue'
    
    id = Column(Integer, primary_key=True)
    checklist_item_id = Column(Integer, ForeignKey('checklist_item.id'))
    title = Column(String(200), nullable=False)
    description = Column(Text)
    risk_level = Column(String(20), nullable=False)
    status = Column(String(20), default='pending')
    department_id = Column(Integer, ForeignKey('department.id'))
    discovered_date = Column(Date, nullable=False)
    assignee_id = Column(Integer, ForeignKey('employee.id'))
    conclusion = Column(Text)
    has_evidence = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    
    checklist_item = relationship('ChecklistItem', back_populates='issues')
    department = relationship('Department', back_populates='issues')
    assignee = relationship('Employee', foreign_keys=[assignee_id], back_populates='assigned_issues')
    sampling_records = relationship('SamplingRecord', back_populates='issue')
    note_tasks = relationship('NoteTask', back_populates='issue')
    rectification_plan = relationship('RectificationPlan', back_populates='issue', uselist=False)
    evidences = relationship('Evidence', back_populates='issue')
    
    __table_args__ = (
        Index('idx_issue_status', 'status'),
        Index('idx_issue_risk', 'risk_level'),
        Index('idx_issue_date', 'discovered_date'),
    )


class SamplingRecord(Base):
    __tablename__ = 'sampling_record'
    
    id = Column(Integer, primary_key=True)
    issue_id = Column(Integer, ForeignKey('audit_issue.id'))
    sample_no = Column(String(50), unique=True, nullable=False)
    transaction_id = Column(Integer, ForeignKey('erp_transaction.id'))
    permission_log_id = Column(Integer, ForeignKey('permission_log.id'))
    sampled_by = Column(Integer, ForeignKey('employee.id'))
    sampled_at = Column(DateTime, default=func.now())
    result = Column(String(20))
    notes = Column(Text)
    
    issue = relationship('AuditIssue', back_populates='sampling_records')
    transaction = relationship('ERPTransaction', back_populates='sampling_records')
    permission_log = relationship('PermissionLog', back_populates='sampling_records')
    sampler = relationship('Employee', back_populates='sampling_records')
    
    __table_args__ = (
        Index('idx_sampling_issue', 'issue_id'),
    )


class NoteTask(Base):
    __tablename__ = 'note_task'
    
    id = Column(Integer, primary_key=True)
    issue_id = Column(Integer, ForeignKey('audit_issue.id'))
    title = Column(String(200), nullable=False)
    description = Column(Text)
    assignee_id = Column(Integer, ForeignKey('employee.id'))
    due_date = Column(Date)
    status = Column(String(20), default='pending')
    created_by = Column(Integer, ForeignKey('employee.id'))
    created_at = Column(DateTime, default=func.now())
    
    issue = relationship('AuditIssue', back_populates='note_tasks')
    assignee = relationship('Employee', foreign_keys=[assignee_id], back_populates='note_tasks')
    creator = relationship('Employee', foreign_keys=[created_by], back_populates='created_tasks')
    
    __table_args__ = (
        Index('idx_task_status', 'status'),
        Index('idx_task_due', 'due_date'),
    )


class RectificationPlan(Base):
    __tablename__ = 'rectification_plan'
    
    id = Column(Integer, primary_key=True)
    issue_id = Column(Integer, ForeignKey('audit_issue.id'), unique=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    start_date = Column(Date)
    end_date = Column(Date)
    actual_end_date = Column(Date)
    progress = Column(Integer, default=0)
    owner_id = Column(Integer, ForeignKey('employee.id'))
    status = Column(String(20), default='pending')
    created_at = Column(DateTime, default=func.now())
    
    issue = relationship('AuditIssue', back_populates='rectification_plan')
    owner = relationship('Employee', back_populates='owned_plans')
    
    __table_args__ = (
        Index('idx_plan_status', 'status'),
        Index('idx_plan_dates', 'start_date', 'end_date'),
    )


class Evidence(Base):
    __tablename__ = 'evidence'
    
    id = Column(Integer, primary_key=True)
    issue_id = Column(Integer, ForeignKey('audit_issue.id'))
    transaction_id = Column(Integer, ForeignKey('erp_transaction.id'))
    permission_log_id = Column(Integer, ForeignKey('permission_log.id'))
    type = Column(String(50), nullable=False)
    description = Column(Text)
    file_path = Column(String(500))
    uploaded_by = Column(Integer, ForeignKey('employee.id'))
    created_at = Column(DateTime, default=func.now())
    
    issue = relationship('AuditIssue', back_populates='evidences')
    uploader = relationship('Employee', back_populates='uploaded_evidences')
    email_record = relationship('EmailRecord', back_populates='evidence', uselist=False)
    transaction = relationship('ERPTransaction', back_populates='evidences')
    permission_log = relationship('PermissionLog', back_populates='evidences')


class EmailRecord(Base):
    __tablename__ = 'email_record'
    
    id = Column(Integer, primary_key=True)
    evidence_id = Column(Integer, ForeignKey('evidence.id'))
    message_id = Column(String(200), unique=True)
    sender = Column(String(100), nullable=False)
    recipients = Column(Text)
    subject = Column(String(500))
    body = Column(Text)
    sent_at = Column(DateTime, nullable=False)
    raw_headers = Column(JSON)
    
    evidence = relationship('Evidence', back_populates='email_record')
    
    __table_args__ = (
        Index('idx_email_subject', 'subject'),
        Index('idx_email_date', 'sent_at'),
    )


class CeleryTask(Base):
    __tablename__ = 'celery_task'
    
    id = Column(Integer, primary_key=True)
    task_id = Column(String(100), unique=True, nullable=False)
    task_type = Column(String(50), nullable=False)
    status = Column(String(20), default='pending')
    result = Column(JSON)
    error_message = Column(Text)
    created_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime)
