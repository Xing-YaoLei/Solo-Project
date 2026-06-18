import uuid
from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class ShortageActionLog(Base):
    __tablename__ = "shortage_action_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    shortage_order_id = Column(String(36), ForeignKey("shortage_orders.id"), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)
    operator_id = Column(String(36), ForeignKey("users.id"))
    operator = Column(String(100))
    remark = Column(Text)
    supplement_quantity = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    shortage_order = relationship("ShortageOrder", back_populates="action_logs")
    operator_user = relationship("User", back_populates="shortage_action_logs", foreign_keys=[operator_id])
