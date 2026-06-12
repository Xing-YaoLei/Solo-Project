from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class InspectionRecord(Base):
    __tablename__ = "inspection_records"

    id = Column(Integer, primary_key=True, index=True)
    record_code = Column(String(50), unique=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipments.id"))
    store_id = Column(Integer, ForeignKey("stores.id"))
    inspection_date = Column(DateTime)
    inspector = Column(String(100))
    inspection_type = Column(String(50))
    passed = Column(Boolean, default=True)
    score = Column(Float)
    issues_found = Column(Text)
    improvement_suggestions = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    equipment = relationship("Equipment", back_populates="inspection_records")
