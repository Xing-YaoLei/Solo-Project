import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Review(Base):
    __tablename__ = "review"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    complaint_id = Column(UUID(as_uuid=True), ForeignKey("complaint.id"), nullable=False)
    review_tags = Column(String(200), nullable=False)
    summary = Column(Text, nullable=False)
    improvement_measures = Column(Text, nullable=True)
    reviewer_name = Column(String(100), nullable=False)
    reviewed_at = Column(DateTime, nullable=False)

    complaint = relationship("Complaint", back_populates="reviews")
