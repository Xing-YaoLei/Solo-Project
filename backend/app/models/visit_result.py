import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class VisitResult(Base):
    __tablename__ = "visit_result"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    complaint_id = Column(UUID(as_uuid=True), ForeignKey("complaint.id"), nullable=False)
    visit_method = Column(String(20), nullable=False)
    visitor_name = Column(String(100), nullable=False)
    satisfaction = Column(String(20), nullable=False)
    feedback = Column(Text, nullable=True)
    visit_at = Column(DateTime, nullable=False)

    complaint = relationship("Complaint", back_populates="visit_results")
