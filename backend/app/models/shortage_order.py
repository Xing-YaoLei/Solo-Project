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
    func,
    Index
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class ShortagePriority(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ShortageOrderStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUPPLEMENTED = "supplemented"
    RETRIED = "retried"
    CLOSED = "closed"


class ShortageOrder(Base):
    __tablename__ = "shortage_orders"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("material_batches.id"), nullable=False)
    material_name = Column(String(200), nullable=False, index=True)
    shortage_quantity = Column(Float, nullable=False)
    unit = Column(String(20))
    responsible_person = Column(String(100), index=True)
    priority = Column(
        Enum(ShortagePriority), default=ShortagePriority.MEDIUM, nullable=False, index=True
    )
    status = Column(
        Enum(ShortageOrderStatus),
        default=ShortageOrderStatus.PENDING,
        nullable=False,
        index=True
    )
    deadline = Column(Date)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    batch = relationship("MaterialBatch", back_populates="shortage_orders")
    action_logs = relationship(
        "ShortageActionLog", back_populates="shortage_order", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_shortage_orders_status_priority", "status", "priority"),
        Index("ix_shortage_orders_responsible_person", "responsible_person"),
        Index("ix_shortage_orders_deadline", "deadline"),
    )
