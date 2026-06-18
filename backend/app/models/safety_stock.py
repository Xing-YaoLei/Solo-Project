import uuid
from sqlalchemy import Column, String, Float, DateTime, UniqueConstraint, func

from app.core.database import Base


class SafetyStockConfig(Base):
    __tablename__ = "safety_stock_configs"
    __table_args__ = (
        UniqueConstraint("material_name", "region", name="uix_material_region"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    material_name = Column(String(200), nullable=False, index=True)
    category = Column(String(100))
    unit = Column(String(50))
    region = Column(String(100), nullable=False, index=True)
    min_stock = Column(Float, default=0.0)
    warning_stock = Column(Float, default=0.0)
    max_stock = Column(Float, default=0.0)
    current_stock = Column(Float, default=0.0)
    daily_consumption_rate = Column(Float, default=0.0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
