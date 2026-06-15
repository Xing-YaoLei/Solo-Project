from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean
from datetime import datetime
from models.database import Base


class AnomalyRecord(Base):
    __tablename__ = "anomaly_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    anomaly_id = Column(String(50), unique=True, nullable=False, index=True, comment="异常编号")
    source_system = Column(String(50), index=True, comment="来源系统")
    anomaly_type = Column(String(100), index=True, comment="异常类型")
    severity = Column(String(20), default="中", comment="严重程度")
    table_name = Column(String(100), comment="相关表")
    record_id = Column(String(100), comment="相关记录ID")
    field_name = Column(String(100), comment="相关字段")
    expected_value = Column(Text, comment="期望值")
    actual_value = Column(Text, comment="实际值")
    description = Column(Text, comment="异常描述")
    status = Column(String(20), default="待处理", index=True, comment="状态")
    assignee = Column(String(50), comment="处理人")
    handled_at = Column(DateTime, comment="处理时间")
    handle_note = Column(String(500), comment="处理说明")
    raw_data = Column(Text, comment="原始数据快照")
    remark = Column(String(500), comment="备注")
    detected_at = Column(DateTime, default=datetime.now, index=True, comment="检测时间")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "anomaly_id": self.anomaly_id,
            "source_system": self.source_system,
            "anomaly_type": self.anomaly_type,
            "severity": self.severity,
            "table_name": self.table_name,
            "description": self.description,
            "status": self.status,
            "assignee": self.assignee,
            "detected_at": self.detected_at.strftime("%Y-%m-%d %H:%M:%S") if self.detected_at else None,
            "remark": self.remark,
        }


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sync_id = Column(String(50), unique=True, nullable=False, index=True, comment="同步编号")
    source_system = Column(String(50), nullable=False, index=True, comment="来源系统")
    sync_type = Column(String(50), comment="同步类型")
    start_time = Column(DateTime, default=datetime.now, comment="开始时间")
    end_time = Column(DateTime, comment="结束时间")
    duration_seconds = Column(Integer, default=0, comment="耗时(秒)")
    total_records = Column(Integer, default=0, comment="总记录数")
    success_count = Column(Integer, default=0, comment="成功数")
    failed_count = Column(Integer, default=0, comment="失败数")
    anomaly_count = Column(Integer, default=0, comment="异常数")
    status = Column(String(20), default="进行中", comment="状态")
    error_message = Column(Text, comment="错误信息")
    operator = Column(String(50), default="system", comment="操作人")
    remark = Column(String(500), comment="备注")
    created_at = Column(DateTime, default=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "sync_id": self.sync_id,
            "source_system": self.source_system,
            "start_time": self.start_time.strftime("%Y-%m-%d %H:%M:%S") if self.start_time else None,
            "end_time": self.end_time.strftime("%Y-%m-%d %H:%M:%S") if self.end_time else None,
            "duration_seconds": self.duration_seconds,
            "total_records": self.total_records,
            "success_count": self.success_count,
            "failed_count": self.failed_count,
            "anomaly_count": self.anomaly_count,
            "status": self.status,
        }
