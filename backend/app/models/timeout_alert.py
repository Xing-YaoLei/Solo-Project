import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class TimeoutAlert(Base):
    __tablename__ = "timeout_alert"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    complaint_id = Column(UUID(as_uuid=True), ForeignKey("complaint.id"), nullable=False)
    timeout_hours = Column(Integer, nullable=False)
    is_resolved = Column(Boolean, default=False)
    triggered_at = Column(DateTime, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    complaint = relationship("Complaint", back_populates="timeout_alerts")
