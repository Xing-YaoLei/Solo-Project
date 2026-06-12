from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, JSON, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class FaultRecord(Base):
    __tablename__ = "fault_records"

    id = Column(Integer, primary_key=True, index=True)
    fault_code = Column(String(100), unique=True, index=True, nullable=False)
    equipment_id = Column(Integer, ForeignKey("equipments.id"), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    fault_type = Column(String(100), nullable=False, index=True)
    fault_category = Column(String(100))
    severity = Column(String(50), default="medium")
    fault_time = Column(DateTime, nullable=False, index=True)
    detected_by = Column(String(100))
    description = Column(Text)
    root_cause = Column(Text)
    impact_assessment = Column(String(500))
    is_cleaning_related = Column(Boolean, default=False)
    status = Column(String(50), default="pending")
    resolved_time = Column(DateTime)
    resolved_by = Column(String(100))
    resolution = Column(Text)
    downtime_minutes = Column(Integer, default=0)
    maintenance_cost = Column(Float, default=0.0)
    related_data = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    equipment = relationship("Equipment", back_populates="faults")
    tasks = relationship("RectificationTask", back_populates="fault")

class RectificationTask(Base):
    __tablename__ = "rectification_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_code = Column(String(100), unique=True, index=True, nullable=False)
    fault_id = Column(Integer, ForeignKey("fault_records.id"))
    equipment_id = Column(Integer, ForeignKey("equipments.id"), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    inspection_id = Column(Integer, ForeignKey("inspection_records.id"))
    task_type = Column(String(100), nullable=False, index=True)
    priority = Column(String(50), default="medium")
    title = Column(String(500), nullable=False)
    description = Column(Text)
    requirement = Column(Text)
    deadline = Column(DateTime, nullable=False)
    assignee = Column(String(100))
    assignor = Column(String(100))
    status = Column(String(50), default="pending")
    status_reason = Column(String(500))
    progress = Column(Integer, default=0)
    start_time = Column(DateTime)
    complete_time = Column(DateTime)
    actual_result = Column(Text)
    attachments = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    equipment = relationship("Equipment", back_populates="tasks")
    fault = relationship("FaultRecord", back_populates="tasks")
    rechecks = relationship("RecheckResult", back_populates="task")
    inspection = relationship("InspectionRecord", back_populates="tasks")

class RecheckResult(Base):
    __tablename__ = "recheck_results"

    id = Column(Integer, primary_key=True, index=True)
    recheck_code = Column(String(100), unique=True, index=True, nullable=False)
    task_id = Column(Integer, ForeignKey("rectification_tasks.id"), nullable=False)
    recheck_time = Column(DateTime, nullable=False, index=True)
    rechecker = Column(String(100))
    result = Column(String(50), nullable=False)
    score = Column(Float)
    items = Column(JSON, default=[])
    issues_found = Column(JSON, default=[])
    description = Column(Text)
    evidence_photos = Column(JSON, default=[])
    pass_threshold = Column(Float, default=80.0)
    conclusion = Column(Text)
    next_action = Column(String(500))
    next_recheck_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("RectificationTask", back_populates="rechecks")
