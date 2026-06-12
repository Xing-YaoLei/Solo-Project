from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class EquipmentRemark(Base):
    __tablename__ = "equipment_remarks"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipments.id"))
    store_id = Column(Integer, ForeignKey("stores.id"))
    remark_type = Column(String(50))
    content = Column(Text)
    operator = Column(String(100))
    related_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    equipment = relationship("Equipment", back_populates="remarks")
