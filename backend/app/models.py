from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.orm import DeclarativeBase, relationship
from datetime import datetime
import enum


class Base(DeclarativeBase):
    pass


class ComplaintStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    resolved = "resolved"
    closed = "closed"


class FlagType(str, enum.Enum):
    door_lock_delay = "door_lock_delay"
    payment_gap = "payment_gap"
    cs_message_change = "cs_message_change"


class ViewType(str, enum.Enum):
    revisit_result = "revisit_result"
    responsibility = "responsibility"
    problem_tag = "problem_tag"


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, autoincrement=True)
    guest_name = Column(String(100), nullable=False)
    room_no = Column(String(20), nullable=False)
    check_in_date = Column(DateTime, nullable=False)
    check_out_date = Column(DateTime, nullable=False)
    complaint_type = Column(String(50), nullable=False)
    complaint_content = Column(Text, nullable=False)
    status = Column(SAEnum(ComplaintStatus), default=ComplaintStatus.pending, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    assigned_to = Column(String(100), nullable=True)
    revisit_result = Column(String(200), nullable=True)
    responsibility = Column(String(200), nullable=True)
    problem_tag = Column(String(200), nullable=True)

    anomaly_flags = relationship("AnomalyFlag", back_populates="complaint")
    review_notes = relationship("ReviewNote", back_populates="complaint")


class AnomalyFlag(Base):
    __tablename__ = "anomaly_flags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    flag_type = Column(SAEnum(FlagType), nullable=False)
    description = Column(Text, nullable=False)
    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    severity = Column(String(20), nullable=False)

    complaint = relationship("Complaint", back_populates="anomaly_flags")
    review_notes = relationship("ReviewNote", back_populates="anomaly_flag")


class ReviewNote(Base):
    __tablename__ = "review_notes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    anomaly_flag_id = Column(Integer, ForeignKey("anomaly_flags.id"), nullable=True)
    content = Column(Text, nullable=False)
    author = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    complaint = relationship("Complaint", back_populates="review_notes")
    anomaly_flag = relationship("AnomalyFlag", back_populates="review_notes")


class FunnelStage(Base):
    __tablename__ = "funnel_stages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    stage_name = Column(String(50), nullable=False)
    stage_order = Column(Integer, nullable=False)
    complaint_count = Column(Integer, default=0, nullable=False)
    avg_duration_hours = Column(Integer, default=0, nullable=False)
    date_recorded = Column(DateTime, nullable=False)


class SavedView(Base):
    __tablename__ = "saved_views"

    id = Column(Integer, primary_key=True, autoincrement=True)
    view_name = Column(String(100), nullable=False)
    view_type = Column(SAEnum(ViewType), nullable=False)
    filters_json = Column(Text, nullable=False)
    created_by = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
