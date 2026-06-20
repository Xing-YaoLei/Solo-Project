from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text

from models.database import Base


class DataBatch(Base):
    __tablename__ = "data_batches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_no = Column(String(64), unique=True, nullable=False, index=True)
    source = Column(String(32), nullable=False, comment="数据来源: camera/gate/merchant/manual")
    record_count = Column(Integer, default=0, comment="导入记录数")
    status = Column(String(16), default="pending", comment="pending/processing/completed/failed")
    remark = Column(Text, nullable=True, comment="备注")
    started_at = Column(DateTime, default=datetime.now)
    completed_at = Column(DateTime, nullable=True)
    refresh_time = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="刷新时间")
    created_by = Column(String(64), nullable=True)
