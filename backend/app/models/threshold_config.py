from sqlalchemy import Column, Integer, String, DateTime, Float, Text
from datetime import datetime

from app.database import Base


class ThresholdConfig(Base):
    __tablename__ = "threshold_configs"

    id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String(100), unique=True, index=True)
    config_name = Column(String(200))
    config_value = Column(Float)
    config_unit = Column(String(20))
    description = Column(Text)
    category = Column(String(50))
    updated_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
