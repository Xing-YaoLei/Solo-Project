from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.database import Base
import enum


class NoteStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class NotePriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class NoteSource(str, enum.Enum):
    EXPIRY_WARNING = "expiry_warning"
    REFUND = "refund"
    LOW_ACTIVITY = "low_activity"
    MANUAL = "manual"
    ANALYSIS = "analysis"


class RenewalNote(Base):
    __tablename__ = "renewal_notes"

    id = Column(Integer, primary_key=True, index=True)
    note_no = Column(String(50), unique=True, index=True, nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False, index=True)
    membership_id = Column(Integer, ForeignKey("memberships.id"), index=True)
    source = Column(Enum(NoteSource), default=NoteSource.EXPIRY_WARNING, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    conclusion = Column(Text)
    status = Column(Enum(NoteStatus), default=NoteStatus.PENDING, index=True)
    priority = Column(Enum(NotePriority), default=NotePriority.MEDIUM)
    due_date = Column(Date)
    assignee_id = Column(Integer)
    assignee_name = Column(String(100))
    created_by_id = Column(Integer)
    created_by_name = Column(String(100))
    resolved_by_id = Column(Integer)
    resolved_by_name = Column(String(100))
    resolved_at = Column(DateTime)
    related_funnel_stage = Column(String(100))
    related_metric = Column(String(100))
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    member = relationship("Member", backref="renewal_notes")
    membership = relationship("Membership", backref="renewal_notes")
