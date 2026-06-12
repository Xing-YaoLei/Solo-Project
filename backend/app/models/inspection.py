from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, JSON, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class InspectionTemplate(Base):
    __tablename__ = "inspection_templates"

    id = Column(Integer, primary_key=True, index=True)
    template_code = Column(String(100), unique=True, index=True, nullable=False)
    template_name = Column(String(200), nullable=False)
    equipment_type = Column(String(100), nullable=False)
    version = Column(String(50))
    items = Column(JSON, default=[])
    scoring_rules = Column(JSON, default={})
    pass_threshold = Column(Float, default=80.0)
    is_active = Column(Boolean, default=True)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class InspectionRecord(Base):
    __tablename__ = "inspection_records"

    id = Column(Integer, primary_key=True, index=True)
    inspection_code = Column(String(100), unique=True, index=True, nullable=False)
    equipment_id = Column(Integer, ForeignKey("equipments.id"), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("inspection_templates.id"))
    inspection_type = Column(String(100), nullable=False, index=True)
    inspection_time = Column(DateTime, nullable=False, index=True)
    inspector = Column(String(100))
    score = Column(Float)
    max_score = Column(Float, default=100.0)
    is_pass = Column(Boolean)
    pass_threshold = Column(Float, default=80.0)
    item_results = Column(JSON, default=[])
    issue_items = Column(JSON, default=[])
    clean_score = Column(Float)
    overall_rating = Column(String(50))
    notes = Column(Text)
    photos = Column(JSON, default=[])
    weather = Column(String(100))
    is_comparison = Column(Boolean, default=False)
    comparison_with = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    equipment = relationship("Equipment", back_populates="inspections")
    tasks = relationship("RectificationTask", back_populates="inspection")

class InspectionTrend(Base):
    __tablename__ = "inspection_trends"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    period_type = Column(String(50), nullable=False)
    period_start = Column(DateTime, nullable=False, index=True)
    period_end = Column(DateTime, nullable=False)
    total_inspections = Column(Integer, default=0)
    pass_count = Column(Integer, default=0)
    fail_count = Column(Integer, default=0)
    pass_rate = Column(Float, default=0.0)
    avg_score = Column(Float, default=0.0)
    avg_clean_score = Column(Float, default=0.0)
    improvement_rate = Column(Float, default=0.0)
    previous_period_rate = Column(Float, default=0.0)
    top_issues = Column(JSON, default=[])
    metrics_detail = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
