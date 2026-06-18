import uuid
from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class InventoryRecord(Base):
    __tablename__ = "inventory_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id = Column(String(36), ForeignKey("material_batches.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    operator_id = Column(String(36), ForeignKey("users.id"))
    operator = Column(String(100))
    region = Column(String(100))
    remark = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())

    batch = relationship("MaterialBatch", back_populates="inventory_records")
    operator_user = relationship("User", back_populates="inventory_records", foreign_keys=[operator_id])
