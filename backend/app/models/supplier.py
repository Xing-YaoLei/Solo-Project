import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    Integer,
    String,
    func,
    Index
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class CreditRating(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"


class SupplierStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    contact_person = Column(String(50))
    phone = Column(String(20))
    email = Column(String(100))
    address = Column(String(500))
    credit_rating = Column(Enum(CreditRating), default=CreditRating.B, nullable=False)
    on_time_rate = Column(Float, default=0.0)
    quality_score = Column(Float, default=0.0)
    status = Column(
        Enum(SupplierStatus), default=SupplierStatus.ACTIVE, nullable=False
    )
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    material_batches = relationship("MaterialBatch", back_populates="supplier")

    __table_args__ = (
        Index("ix_suppliers_credit_rating", "credit_rating"),
        Index("ix_suppliers_status", "status"),
        Index("ix_suppliers_name", "name"),
    )
