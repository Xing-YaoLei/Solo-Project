import uuid

from sqlalchemy import Column, Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Complaint(Base):
    __tablename__ = "complaint"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    source_channel = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    priority = Column(String(10), nullable=False)
    complainant_name = Column(String(100), nullable=False)
    complainant_contact = Column(String(100), nullable=False)
    homestay_name = Column(String(200), nullable=False)
    room_number = Column(String(50), nullable=True)
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=True)
    handler_id = Column(UUID(as_uuid=True), ForeignKey("handler.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    closed_at = Column(DateTime, nullable=True)

    visit_results = relationship("VisitResult", back_populates="complaint")
    responsibilities = relationship("Responsibility", back_populates="complaint")
    tags = relationship("ComplaintTag", back_populates="complaint")
    handling_records = relationship("HandlingRecord", back_populates="complaint")
    reviews = relationship("Review", back_populates="complaint")
    timeout_alerts = relationship("TimeoutAlert", back_populates="complaint")
