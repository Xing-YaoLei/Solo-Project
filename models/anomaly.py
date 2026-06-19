from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.sql import func

from models.database import Base


class AnomalyRecord(Base):
    __tablename__ = "anomaly_records"

    id = Column(Integer, primary_key=True, index=True)
    anomaly_no = Column(String(50), unique=True, index=True, comment="异常编号")
    anomaly_type = Column(String(50), index=True, comment="异常类型：parts_shortage/data_error/review_flag/insurance_issue")
    severity = Column(String(20), default="medium", comment="严重程度：low/medium/high/critical")
    status = Column(String(20), default="open", comment="状态：open/in_progress/resolved/closed")
    source = Column(String(50), comment="数据来源：sync/manual/detection")
    related_table = Column(String(50), comment="关联表名")
    related_id = Column(Integer, comment="关联记录ID")
    related_no = Column(String(50), comment="关联单据号")
    title = Column(String(200), comment="异常标题")
    description = Column(Text, comment="异常描述")
    detected_at = Column(DateTime, comment="发现时间")
    handled_by = Column(String(50), comment="处理人")
    handled_at = Column(DateTime, comment="处理时间")
    handle_result = Column(Text, comment="处理结果")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
