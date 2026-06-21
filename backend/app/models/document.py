from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Enum, JSON
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class DocumentStatus(str, enum.Enum):
    DRAFT = "draft"
    INTERACTING = "interacting"
    RISK_CHECKED = "risk_checked"
    VERSION_VERIFIED = "version_verified"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class DocumentType(str, enum.Enum):
    CONTRACT = "contract"
    NOTICE = "notice"
    AGREEMENT = "agreement"
    LEGAL_OPINION = "legal_opinion"
    POWER_OF_ATTORNEY = "power_of_attorney"
    OTHER = "other"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False, index=True)
    document_no = Column(String(100), unique=True, index=True)
    document_type = Column(Enum(DocumentType), default=DocumentType.OTHER, nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.DRAFT, nullable=False, index=True)
    content = Column(Text, nullable=False)
    summary = Column(Text)
    client_name = Column(String(200), index=True)
    case_no = Column(String(100), index=True)

    creator_id = Column(Integer, ForeignKey("users.id"))
    assignee_id = Column(Integer, ForeignKey("users.id"), index=True)
    current_version = Column(Integer, default=1)
    is_version_verified = Column(Boolean, default=False)
    risk_level = Column(String(50))
    material_tags = Column(JSON, default=list)
    review_comments = Column(Text)
    rejection_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    archived_at = Column(DateTime)
    approved_at = Column(DateTime)

    creator = relationship("User", foreign_keys=[creator_id], back_populates="created_documents")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_documents")
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")
    interactions = relationship("Interaction", back_populates="document", cascade="all, delete-orphan")
    risk_hits = relationship("RiskHit", back_populates="document", cascade="all, delete-orphan")
    audit_records = relationship("AuditRecord", back_populates="document", cascade="all, delete-orphan")


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    title = Column(String(300), nullable=False)
    change_summary = Column(String(500))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="versions")
