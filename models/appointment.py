from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Boolean, Date
from sqlalchemy.sql import func

from models.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    appointment_no = Column(String(50), unique=True, index=True, comment="预约单号")
    customer_name = Column(String(100), comment="客户姓名")
    phone = Column(String(20), comment="联系电话")
    license_plate = Column(String(20), index=True, comment="车牌号")
    vehicle_model = Column(String(100), comment="车型")
    appointment_time = Column(DateTime, index=True, comment="预约时间")
    actual_arrival_time = Column(DateTime, comment="实际到店时间")
    service_type = Column(String(50), comment="服务类型")
    description = Column(Text, comment="故障描述")
    status = Column(String(20), default="pending", comment="状态：pending/arrived/cancelled/completed")
    risk_level = Column(String(20), default="low", comment="风险等级：low/medium/high")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
