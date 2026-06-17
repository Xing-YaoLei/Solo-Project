import enum

from sqlalchemy import (
    Column,
    DateTime,
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


class InventoryRecordType(str, enum.Enum):
    IN = "in"
    OUT = "out"
    TRANSFER = "transfer"
    ADJUST = "adjust"


class InventoryRecord(Base):
    __tablename__ = "inventory_records"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("material_batches.id"), nullable=False)
    type = Column(Enum(InventoryRecordType), nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    operator_id = Column(Integer, ForeignKey("users.id"))
    operator = Column(String(100))
    region = Column(String(100), index=True)
    remark = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)

    batch = relationship("MaterialBatch", back_populates="inventory_records")
    operator_user = relationship("User", back_populates="inventory_records")

    __table_args__ = (
        Index("ix_inventory_records_batch_id_type", "batch_id", "type"),
        Index("ix_inventory_records_type_region", "type", "region"),
        Index("ix_inventory_records_created_at", "created_at"),
    )
