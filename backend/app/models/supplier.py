import uuid
from sqlalchemy import Column, String, Float, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False, index=True)
    contact_person = Column(String(100))
    phone = Column(String(50))
    email = Column(String(200))
    address = Column(String(500))
    credit_rating = Column(String(50), default="B")
    on_time_rate = Column(Float, default=0.9)
    quality_score = Column(Float, default=85.0)
    status = Column(String(50), default="active")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    material_batches = relationship("MaterialBatch", back_populates="supplier")
