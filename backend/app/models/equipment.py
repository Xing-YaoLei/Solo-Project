from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Equipment(Base):
    __tablename__ = "equipments"

    id = Column(Integer, primary_key=True, index=True)
    equipment_code = Column(String(50), unique=True, index=True)
    equipment_name = Column(String(200))
    equipment_type = Column(String(50))
    store_id = Column(Integer, ForeignKey("stores.id"))
    brand = Column(String(100))
    model = Column(String(100))
    install_date = Column(DateTime)
    status = Column(String(20), default="normal")
    last_cleaning_date = Column(DateTime)
    next_cleaning_date = Column(DateTime)
    cleaning_cycle_days = Column(Integer, default=7)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    store = relationship("Store", back_populates="equipments")
    cleaning_records = relationship("CleaningRecord", back_populates="equipment")
    inspection_records = relationship("InspectionRecord", back_populates="equipment")
    remarks = relationship("EquipmentRemark", back_populates="equipment")
