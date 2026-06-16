from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Date, Float
from sqlalchemy.orm import relationship

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(Integer, nullable=False)
    action = Column(String(50), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    field_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    remark = Column(String(500), nullable=True)

    user = relationship("User", back_populates="audit_logs")
