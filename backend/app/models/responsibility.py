import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Responsibility(Base):
    __tablename__ = "responsibility"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    complaint_id = Column(UUID(as_uuid=True), ForeignKey("complaint.id"), nullable=False)
    responsible_type = Column(String(20), nullable=False)
    responsible_person = Column(String(100), nullable=False)
    judgment_basis = Column(Text, nullable=True)
    determined_by = Column(String(100), nullable=False)
    determined_at = Column(DateTime, nullable=False)

    complaint = relationship("Complaint", back_populates="responsibilities")
