from sqlalchemy import (
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    func,
    Index
)

from app.core.database import Base


class InventoryThreshold(Base):
    __tablename__ = "inventory_thresholds"

    id = Column(Integer, primary_key=True, index=True)
    material_category = Column(String(100), unique=True, index=True, nullable=False)
    allowed_error_rate = Column(Float, default=0.05, nullable=False)
    overstock_warning_threshold = Column(Float, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_inventory_thresholds_material_category", "material_category"),
    )
