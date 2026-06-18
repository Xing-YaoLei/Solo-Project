import uuid
from sqlalchemy import Column, String, Float, Integer, Date, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class MaterialBatch(Base):
    __tablename__ = "material_batches"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_no = Column(String(100), unique=True, nullable=False, index=True)
    material_name = Column(String(200), nullable=False, index=True)
    category = Column(String(100), index=True)
    specification = Column(String(200))
    unit = Column(String(50))
    quantity = Column(Float, default=0.0)
    supplier_id = Column(String(36), ForeignKey("suppliers.id"))
    supplier_name = Column(String(200))
    region = Column(String(100), index=True)
    responsible_person = Column(String(100), index=True)
    status = Column(String(50), default="pending", index=True)
    in_date = Column(Date)
    expected_turnover_days = Column(Integer, default=30)
    actual_turnover_days = Column(Integer)
    remark = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    supplier = relationship("Supplier", back_populates="material_batches")
    inventory_records = relationship("InventoryRecord", back_populates="batch", cascade="all, delete-orphan")
    shortage_orders = relationship("ShortageOrder", back_populates="batch", cascade="all, delete-orphan")
