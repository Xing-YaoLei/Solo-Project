import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class HandlingRecord(Base):
    __tablename__ = "handling_record"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    complaint_id = Column(UUID(as_uuid=True), ForeignKey("complaint.id"), nullable=False)
    handler_id = Column(UUID(as_uuid=True), ForeignKey("handler.id"), nullable=True)
    action = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    complaint = relationship("Complaint", back_populates="handling_records")
