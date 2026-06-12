from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class CleaningRecord(Base):
    __tablename__ = "cleaning_records"

    id = Column(Integer, primary_key=True, index=True)
    record_code = Column(String(50), unique=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipments.id"))
    store_id = Column(Integer, ForeignKey("stores.id"))
    cleaning_date = Column(DateTime)
    cleaning_type = Column(String(50))
    operator = Column(String(100))
    cleaning_items = Column(Text)
    cleaning_result = Column(String(20), default="passed")
    remark = Column(Text)
    source = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    equipment = relationship("Equipment", back_populates="cleaning_records")
