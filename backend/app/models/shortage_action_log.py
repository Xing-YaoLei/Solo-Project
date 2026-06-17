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


class ShortageAction(str, enum.Enum):
    CREATE = "create"
    ASSIGN = "assign"
    SUPPLEMENT = "supplement"
    RETRY = "retry"
    CLOSE = "close"


class ShortageActionLog(Base):
    __tablename__ = "shortage_action_logs"

    id = Column(Integer, primary_key=True, index=True)
    shortage_order_id = Column(
        Integer, ForeignKey("shortage_orders.id"), nullable=False
    )
    action = Column(Enum(ShortageAction), nullable=False, index=True)
    operator_id = Column(Integer, ForeignKey("users.id"))
    operator = Column(String(100))
    remark = Column(Text)
    supplement_quantity = Column(Float)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)

    shortage_order = relationship("ShortageOrder", back_populates="action_logs")
    operator_user = relationship("User", back_populates="shortage_action_logs")

    __table_args__ = (
        Index("ix_shortage_action_logs_order_id_action", "shortage_order_id", "action"),
        Index("ix_shortage_action_logs_created_at", "created_at"),
    )
