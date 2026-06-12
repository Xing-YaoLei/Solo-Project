from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class InventoryVersion(Base):
    __tablename__ = "inventory_versions"

    id = Column(Integer, primary_key=True, index=True)
    version_number = Column(Integer, nullable=False)
    batch_id = Column(String(100), unique=True, index=True, nullable=False)
    snapshot_date = Column(DateTime, nullable=False, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    source_system = Column(String(100))
    sync_timestamp = Column(DateTime)
    sync_delay_minutes = Column(Integer, default=0)
    record_count = Column(Integer, default=0)
    total_value = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("InventoryItem", back_populates="version")

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    version_id = Column(Integer, ForeignKey("inventory_versions.id"), nullable=False)
    sku_code = Column(String(100), nullable=False, index=True)
    sku_name = Column(String(300), nullable=False)
    category = Column(String(100))
    quantity = Column(Float, nullable=False)
    unit = Column(String(50))
    unit_price = Column(Float)
    total_price = Column(Float)
    expiry_date = Column(DateTime)
    batch_number = Column(String(100))
    warehouse_location = Column(String(200))
    cleaning_item_flag = Column(Boolean, default=False)
    extra_data = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)

    version = relationship("InventoryVersion", back_populates="items")
