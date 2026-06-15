from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean, Date, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship

from .database import Base
from .enums import (
    TicketStatus, TicketSource, ReviewTag,
    TransactionType, PlagiarismStatus, PlagiarismSeverity, MemberLevel
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), default="operator")
    hashed_password = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    created_tickets = relationship("CommunityTicket", back_populates="creator", foreign_keys="CommunityTicket.creator_id")
    assigned_tickets = relationship("CommunityTicket", back_populates="responsible", foreign_keys="CommunityTicket.responsible_id")
    audit_logs = relationship("AuditLog", back_populates="operator")
    review_records = relationship("ReviewRecord", back_populates="reviewer")
    plagiarism_handled = relationship("PlagiarismCase", back_populates="handler", foreign_keys="PlagiarismCase.handler_id")


class MemberProfile(Base):
    __tablename__ = "member_profiles"

    id = Column(Integer, primary_key=True, index=True)
    member_no = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), index=True)
    email = Column(String(100))
    id_card = Column(String(20))
    level = Column(SQLEnum(MemberLevel), default=MemberLevel.BASIC)
    source_channel = Column(SQLEnum(TicketSource), default=TicketSource.OTHER)
    join_date = Column(Date, default=datetime.utcnow)
    exam_score = Column(Float)
    exam_pass_status = Column(Boolean)
    exam_date = Column(Date)
    total_learning_hours = Column(Float, default=0.0)
    community_group = Column(String(100))
    tags = Column(JSON, default=list)
    remark = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tickets = relationship("CommunityTicket", back_populates="member")
    transactions = relationship("AccountTransaction", back_populates="member")
    benefit_mappings = relationship("MemberBenefitMapping", back_populates="member")
    plagiarism_cases = relationship("PlagiarismCase", back_populates="member")


class BenefitRule(Base):
    __tablename__ = "benefit_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_code = Column(String(50), unique=True, index=True, nullable=False)
    rule_name = Column(String(200), nullable=False)
    description = Column(Text)
    benefit_type = Column(String(50))
    applicable_levels = Column(JSON, default=list)
    discount_rate = Column(Float, default=0)
    bonus_points = Column(Integer, default=0)
    cash_value = Column(Float, default=0.0)
    valid_from = Column(Date)
    valid_until = Column(Date)
    is_active = Column(Boolean, default=True)
    conditions = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    member_mappings = relationship("MemberBenefitMapping", back_populates="benefit")
    ticket_benefits = relationship("TicketBenefitReference", back_populates="benefit")


class MemberBenefitMapping(Base):
    __tablename__ = "member_benefit_mappings"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("member_profiles.id"), nullable=False)
    benefit_id = Column(Integer, ForeignKey("benefit_rules.id"), nullable=False)
    granted_date = Column(Date, default=datetime.utcnow)
    used_count = Column(Integer, default=0)
    max_usage = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    remark = Column(Text)

    member = relationship("MemberProfile", back_populates="benefit_mappings")
    benefit = relationship("BenefitRule", back_populates="member_mappings")


class AccountTransaction(Base):
    __tablename__ = "account_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_no = Column(String(50), unique=True, index=True, nullable=False)
    member_id = Column(Integer, ForeignKey("member_profiles.id"), nullable=False)
    ticket_id = Column(Integer, ForeignKey("community_tickets.id"))
    type = Column(SQLEnum(TransactionType), nullable=False)
    amount = Column(Float, nullable=False)
    balance_after = Column(Float)
    payment_method = Column(String(50))
    related_order_no = Column(String(100))
    description = Column(Text)
    evidence_urls = Column(JSON, default=list)
    transaction_date = Column(DateTime, default=datetime.utcnow)
    operator_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    member = relationship("MemberProfile", back_populates="transactions")
    ticket = relationship("CommunityTicket", back_populates="transactions")


class CommunityTicket(Base):
    __tablename__ = "community_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_no = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    member_id = Column(Integer, ForeignKey("member_profiles.id"), nullable=False)
    source = Column(SQLEnum(TicketSource), default=TicketSource.OTHER)
    status = Column(SQLEnum(TicketStatus), default=TicketStatus.DRAFT)
    creator_id = Column(Integer, ForeignKey("users.id"))
    responsible_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String(100))
    priority = Column(Integer, default=3)
    description = Column(Text)
    evidence_urls = Column(JSON, default=list)
    supplement_requirements = Column(Text)
    closed_at = Column(DateTime)
    close_remark = Column(Text)
    review_tag = Column(SQLEnum(ReviewTag))
    review_score = Column(Integer)
    review_remark = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    member = relationship("MemberProfile", back_populates="tickets")
    creator = relationship("User", back_populates="created_tickets", foreign_keys=[creator_id])
    responsible = relationship("User", back_populates="assigned_tickets", foreign_keys=[responsible_id])
    audit_logs = relationship("AuditLog", back_populates="ticket", cascade="all, delete-orphan")
    review_records = relationship("ReviewRecord", back_populates="ticket", cascade="all, delete-orphan")
    transactions = relationship("AccountTransaction", back_populates="ticket")
    benefit_references = relationship("TicketBenefitReference", back_populates="ticket", cascade="all, delete-orphan")


class TicketBenefitReference(Base):
    __tablename__ = "ticket_benefit_references"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("community_tickets.id"), nullable=False)
    benefit_id = Column(Integer, ForeignKey("benefit_rules.id"), nullable=False)
    applied_date = Column(DateTime, default=datetime.utcnow)
    applied_value = Column(Float, default=0.0)
    remark = Column(Text)

    ticket = relationship("CommunityTicket", back_populates="benefit_references")
    benefit = relationship("BenefitRule", back_populates="ticket_benefits")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("community_tickets.id"), nullable=False)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    old_status = Column(String(50))
    new_status = Column(String(50))
    comment = Column(Text)
    evidence_urls = Column(JSON, default=list)
    reference_ids = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("CommunityTicket", back_populates="audit_logs")
    operator = relationship("User", back_populates="audit_logs")


class ReviewRecord(Base):
    __tablename__ = "review_records"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("community_tickets.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    round = Column(Integer, default=1)
    is_escalated = Column(Boolean, default=False)
    review_tag = Column(SQLEnum(ReviewTag))
    score = Column(Integer)
    summary = Column(Text)
    evidence_urls = Column(JSON, default=list)
    cited_transaction_ids = Column(JSON, default=list)
    cited_benefit_ids = Column(JSON, default=list)
    follow_up_actions = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ticket = relationship("CommunityTicket", back_populates="review_records")
    reviewer = relationship("User", back_populates="review_records")


class PlagiarismCase(Base):
    __tablename__ = "plagiarism_cases"

    id = Column(Integer, primary_key=True, index=True)
    case_no = Column(String(50), unique=True, index=True, nullable=False)
    member_id = Column(Integer, ForeignKey("member_profiles.id"), nullable=False)
    ticket_id = Column(Integer, ForeignKey("community_tickets.id"))
    reporter_id = Column(Integer, ForeignKey("users.id"))
    handler_id = Column(Integer, ForeignKey("users.id"))
    status = Column(SQLEnum(PlagiarismStatus), default=PlagiarismStatus.REPORTED)
    severity = Column(SQLEnum(PlagiarismSeverity), default=PlagiarismSeverity.MODERATE)
    assignment_name = Column(String(200), nullable=False)
    course_name = Column(String(200))
    similarity_score = Column(Float)
    original_author = Column(String(100))
    description = Column(Text)
    evidence_urls = Column(JSON, default=list)
    investigation_notes = Column(Text)
    resolution = Column(Text)
    punishment = Column(String(500))
    appeal_deadline = Column(Date)
    resolved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    member = relationship("MemberProfile", back_populates="plagiarism_cases")
    handler = relationship("User", back_populates="plagiarism_handled", foreign_keys=[handler_id])
