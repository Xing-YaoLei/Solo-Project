from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Enum, JSON
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    LAWYER = "lawyer"
    ASSISTANT = "assistant"
    AUDITOR = "auditor"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(Enum(UserRole), default=UserRole.ASSISTANT, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assigned_documents = relationship("Document", foreign_keys="Document.assignee_id", back_populates="assignee")
    created_documents = relationship("Document", foreign_keys="Document.creator_id", back_populates="creator")
    interactions = relationship("Interaction", back_populates="user")
    audit_records = relationship("AuditRecord", back_populates="auditor")
