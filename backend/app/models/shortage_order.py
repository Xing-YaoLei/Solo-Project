import uuid
from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class ShortageOrder(Base):
    __tablename__ = "shortage_orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id = Column(String(36), ForeignKey("material_batches.id"), index=True)
    material_name = Column(String(200), nullable=False, index=True)
    shortage_quantity = Column(Float, nullable=False)
    unit = Column(String(50))
    responsible_person = Column(String(100), index=True)
    priority = Column(String(50), default="medium", index=True)
    status = Column(String(50), default="pending", index=True)
    deadline = Column(Date)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    batch = relationship("MaterialBatch", back_populates="shortage_orders")
    action_logs = relationship("ShortageActionLog", back_populates="shortage_order", cascade="all, delete-orphan")
