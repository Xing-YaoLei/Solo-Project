from sqlalchemy import Column, String, Integer, Text, DateTime
from models.base import BaseModel


class StatusLog(BaseModel):
    __tablename__ = "status_logs"

    related_type = Column(String(32), index=True, comment="关联类型: group_batch/arrival_list/pickup_code/after_sale/exception_order")
    related_id = Column(Integer, index=True, comment="关联ID")
    old_status = Column(String(64), comment="原状态")
    new_status = Column(String(64), comment="新状态")
    change_reason = Column(Text, comment="变更原因")
    operator = Column(String(32), comment="操作人")
    operation_time = Column(DateTime, comment="操作时间")
    extra_info = Column(Text, comment="扩展信息(JSON)")
