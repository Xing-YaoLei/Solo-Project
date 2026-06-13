from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.database import Base
import enum


class ThresholdType(str, enum.Enum):
    RENEWAL_WARNING_DAYS = "renewal_warning_days"
    LOW_RENEWAL_RATE = "low_renewal_rate"
    INACTIVE_DAYS = "inactive_days"
    EXPIRING_SOON = "expiring_soon"
    LOW_SESSIONS_REMAINING = "low_sessions_remaining"


class WarningThreshold(Base):
    __tablename__ = "warning_thresholds"

    id = Column(Integer, primary_key=True, index=True)
    threshold_type = Column(Enum(ThresholdType), unique=True, nullable=False, index=True)
    threshold_name = Column(String(200), nullable=False)
    threshold_value = Column(Float, nullable=False)
    threshold_unit = Column(String(20), default="天")
    description = Column(Text)
    is_enabled = Column(Integer, default=1)
    created_by = Column(String(100))
    updated_by = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ThresholdAuditLog(Base):
    __tablename__ = "threshold_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    threshold_id = Column(Integer, ForeignKey("warning_thresholds.id"), index=True)
    threshold_type = Column(Enum(ThresholdType), index=True)
    old_value = Column(Float)
    new_value = Column(Float)
    old_name = Column(String(200))
    new_name = Column(String(200))
    operator_id = Column(Integer)
    operator_name = Column(String(100), nullable=False)
    operation_type = Column(String(50), nullable=False)
    remark = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    threshold = relationship("WarningThreshold", backref="audit_logs")
