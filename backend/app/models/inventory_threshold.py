import uuid
from sqlalchemy import Column, String, Float, Text, DateTime, func

from app.core.database import Base


class InventoryThreshold(Base):
    __tablename__ = "inventory_thresholds"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    material_category = Column(String(100), unique=True, nullable=False, index=True)
    allowed_error_rate = Column(Float, default=0.05)
    overstock_warning_threshold = Column(Float, default=1.5)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
