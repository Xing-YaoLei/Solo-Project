from sqlalchemy import (
    Column,
    DateTime,
    Float,
    Integer,
    String,
    func,
    Index
)

from app.core.database import Base


class SafetyStockConfig(Base):
    __tablename__ = "safety_stock_configs"

    id = Column(Integer, primary_key=True, index=True)
    material_name = Column(String(200), nullable=False, index=True)
    category = Column(String(100), index=True, nullable=False)
    unit = Column(String(20))
    region = Column(String(100), index=True, nullable=False)
    min_stock = Column(Float, nullable=False)
    warning_stock = Column(Float, nullable=False)
    max_stock = Column(Float, nullable=False)
    current_stock = Column(Float, default=0.0)
    daily_consumption_rate = Column(Float, default=0.0)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        Index(
            "ix_safety_stock_configs_material_region",
            "material_name",
            "region",
            unique=True
        ),
        Index("ix_safety_stock_configs_category_region", "category", "region"),
    )
