from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Date, Time, Text

from models.database import Base


class CapacityRule(Base):
    __tablename__ = "capacity_rules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    effective_date = Column(Date, nullable=False, index=True, comment="生效日期")
    zone = Column(String(64), nullable=False, index=True)
    time_slot = Column(String(16), nullable=False, index=True)
    max_capacity = Column(Integer, nullable=False, comment="最大容量")
    warning_threshold = Column(Integer, nullable=True, comment="预警阈值(人数)")
    rule_type = Column(String(16), default="normal", comment="normal/holiday/weather/emergency")
    reason = Column(Text, nullable=True, comment="变更原因")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    created_by = Column(String(64), nullable=True)
