from sqlalchemy import (
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    Boolean,
    func,
    Index
)

from app.core.database import Base


class UsageRule(Base):
    __tablename__ = "usage_rules"

    id = Column(Integer, primary_key=True, index=True)
    material_category = Column(String(100), unique=True, index=True, nullable=False)
    max_daily_usage = Column(Float, nullable=False)
    requires_approval = Column(Boolean, default=False, nullable=False)
    approval_level = Column(Integer, default=1)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_usage_rules_material_category", "material_category"),
        Index("ix_usage_rules_requires_approval", "requires_approval"),
    )
