import uuid
from sqlalchemy import Column, String, Float, Boolean, Integer, Text, DateTime, func

from app.core.database import Base


class UsageRule(Base):
    __tablename__ = "usage_rules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    material_category = Column(String(100), unique=True, nullable=False, index=True)
    max_daily_usage = Column(Float, default=1000.0)
    requires_approval = Column(Boolean, default=False)
    approval_level = Column(Integer, default=0)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
