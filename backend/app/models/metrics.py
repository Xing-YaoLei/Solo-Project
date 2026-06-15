from sqlalchemy import Column, Integer, Numeric, String, DateTime, Date, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class CaliberVersion(Base):
    __tablename__ = "caliber_versions"

    version = Column(String(20), primary_key=True, index=True)
    effective_date = Column(Date, nullable=False)
    formula = Column(Text, nullable=False)
    description = Column(Text)
    change_reason = Column(Text)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    metrics = relationship("MetricsSummary", back_populates="caliber")


class MetricsSummary(Base):
    __tablename__ = "metrics_summary"

    id = Column(Integer, primary_key=True, index=True)
    summary_date = Column(Date, nullable=False)
    caliber_version = Column(String(20), ForeignKey("caliber_versions.version"))
    total_completion_rate = Column(Numeric(5, 2))
    total_students = Column(Integer)
    active_users = Column(Integer)
    avg_duration = Column(Integer)
    batch_id = Column(String(50), ForeignKey("batch_import.batch_id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    caliber = relationship("CaliberVersion", back_populates="metrics")
    batch = relationship("BatchImport", back_populates="metrics")


class ProgressNote(Base):
    __tablename__ = "progress_notes"

    id = Column(Integer, primary_key=True, index=True)
    note_date = Column(Date, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"))
    class_id = Column(String(50))
    note = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="notes")
    creator = relationship("User", back_populates="notes")
