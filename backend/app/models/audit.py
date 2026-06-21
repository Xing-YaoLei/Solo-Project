from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class InteractionType(str, enum.Enum):
    CLIENT_CALL = "client_call"
    CLIENT_EMAIL = "client_email"
    CLIENT_MEETING = "client_meeting"
    INTERNAL_DISCUSSION = "internal_discussion"
    REVISION_NOTE = "revision_note"
    OTHER = "other"


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    interaction_type = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    participants = Column(JSON, default=list)
    attachments = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    document = relationship("Document", back_populates="interactions")
    user = relationship("User", back_populates="interactions")


class RiskHit(Base):
    __tablename__ = "risk_hits"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    keyword = Column(String(100), nullable=False)
    context = Column(Text)
    position_start = Column(Integer)
    position_end = Column(Integer)
    severity = Column(String(20), default="medium")
    suggestion = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="risk_hits")


class AuditRecord(Base):
    __tablename__ = "audit_records"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    auditor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(50), nullable=False)
    previous_status = Column(String(50))
    new_status = Column(String(50))
    comments = Column(Text)
    material_tags_suggestion = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    document = relationship("Document", back_populates="audit_records")
    auditor = relationship("User", back_populates="audit_records")
