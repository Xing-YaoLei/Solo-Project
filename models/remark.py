from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func

from models.database import Base


class Remark(Base):
    __tablename__ = "remarks"

    id = Column(Integer, primary_key=True, index=True)
    related_type = Column(String(50), index=True, comment="关联类型：work_order/appointment/part/insurance/quote")
    related_id = Column(Integer, index=True, comment="关联记录ID")
    related_no = Column(String(50), comment="关联单据号")
    content = Column(Text, comment="备注内容")
    author = Column(String(50), comment="备注人")
    is_pinned = Column(Boolean, default=False, comment="是否置顶")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
