from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Date, Time, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    elder_id = Column(Integer, ForeignKey("elders.id"), nullable=False, index=True)
    drug_name = Column(String(200), nullable=False)
    generic_name = Column(String(200), nullable=True)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    route = Column(String(50), nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    prescribing_doctor = Column(String(100), nullable=True)
    pharmacy = Column(String(200), nullable=True)
    purpose = Column(Text, nullable=True)
    side_effects = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    elder = relationship("Elder", back_populates="medications")
