import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Date,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
    Index
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class MaterialBatchStatus(str, enum.Enum):
    PENDING = "pending"
    IN_STOCK = "in_stock"
    IN_USE = "in_use"
    SHORTAGE = "shortage"
    COMPLETED = "completed"


class MaterialBatch(Base):
    __tablename__ = "material_batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_no = Column(String(50), unique=True, index=True, nullable=False)
    material_name = Column(String(200), nullable=False, index=True)
    category = Column(String(100), index=True, nullable=False)
    specification = Column(String(200))
    unit = Column(String(20))
    quantity = Column(Float, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    supplier_name = Column(String(200))
    region = Column(String(100), index=True)
    responsible_person = Column(String(100))
    status = Column(
        Enum(MaterialBatchStatus),
        default=MaterialBatchStatus.PENDING,
        nullable=False,
        index=True
    )
    in_date = Column(Date)
    expected_turnover_days = Column(Integer)
    actual_turnover_days = Column(Integer)
    remark = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    supplier = relationship("Supplier", back_populates="material_batches")
    inventory_records = relationship(
        "InventoryRecord", back_populates="batch", cascade="all, delete-orphan"
    )
    shortage_orders = relationship(
        "ShortageOrder", back_populates="batch", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_material_batches_category_region", "category", "region"),
        Index("ix_material_batches_status_region", "status", "region"),
        Index("ix_material_batches_supplier_id", "supplier_id"),
    )
