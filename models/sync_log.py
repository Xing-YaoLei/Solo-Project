from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func

from models.database import Base


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    task_name = Column(String(100), index=True, comment="任务名称")
    source_system = Column(String(50), comment="源系统")
    sync_type = Column(String(20), default="incremental", comment="同步类型：full/incremental")
    status = Column(String(20), comment="状态：running/success/failed")
    records_count = Column(Integer, default=0, comment="同步记录数")
    error_count = Column(Integer, default=0, comment="错误数")
    error_message = Column(Text, comment="错误信息")
    started_at = Column(DateTime, comment="开始时间")
    finished_at = Column(DateTime, comment="结束时间")
    duration_seconds = Column(Integer, default=0, comment="耗时(秒)")
    created_at = Column(DateTime, server_default=func.now())
