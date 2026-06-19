from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Boolean, Date, ForeignKey
from sqlalchemy.sql import func

from models.database import Base


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, index=True)
    quote_no = Column(String(50), unique=True, index=True, comment="报价单号")
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=True, comment="关联工单ID")
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True, comment="关联预约ID")
    license_plate = Column(String(20), comment="车牌号")
    customer_name = Column(String(100), comment="客户姓名")
    total_amount = Column(Float, default=0, comment="总金额")
    parts_amount = Column(Float, default=0, comment="配件金额")
    labor_amount = Column(Float, default=0, comment="工时金额")
    discount = Column(Float, default=0, comment="折扣金额")
    status = Column(String(20), default="draft", comment="状态：draft/submitted/approved/rejected/confirmed")
    valid_until = Column(Date, comment="报价有效期")
    created_by = Column(String(50), comment="创建人")
    confirmed_by = Column(String(50), comment="确认人")
    confirmed_at = Column(DateTime, comment="确认时间")
    items_json = Column(Text, comment="报价项目明细JSON")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
