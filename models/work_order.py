from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from models.database import Base


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True, comment="工单号")
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True, comment="关联预约ID")
    license_plate = Column(String(20), index=True, comment="车牌号")
    vehicle_model = Column(String(100), comment="车型")
    customer_name = Column(String(100), comment="客户姓名")
    phone = Column(String(20), comment="联系电话")
    mileage = Column(Float, comment="里程数")
    repair_type = Column(String(50), comment="维修类型")
    fault_description = Column(Text, comment="故障描述")
    status = Column(String(20), default="pending", comment="状态：pending/in_progress/parts_pending/completed/cancelled")
    priority = Column(String(20), default="normal", comment="优先级：low/normal/high/urgent")
    technician = Column(String(50), comment="技师")
    advisor = Column(String(50), comment="服务顾问")
    start_time = Column(DateTime, comment="开工时间")
    complete_time = Column(DateTime, comment="完工时间")
    total_amount = Column(Float, default=0, comment="总金额")
    is_rework = Column(Boolean, default=False, comment="是否返修")
    rework_count = Column(Integer, default=0, comment="返修次数")
    original_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=True, comment="原始工单ID")
    has_parts_shortage = Column(Boolean, default=False, comment="是否有配件缺货")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    items = relationship("WorkOrderItem", back_populates="work_order", cascade="all, delete-orphan")


class WorkOrderItem(Base):
    __tablename__ = "work_order_items"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), index=True, comment="工单ID")
    item_type = Column(String(20), comment="项目类型：labor/part/other")
    item_code = Column(String(50), comment="项目编码")
    item_name = Column(String(200), comment="项目名称")
    quantity = Column(Float, default=1, comment="数量")
    unit_price = Column(Float, default=0, comment="单价")
    amount = Column(Float, default=0, comment="金额")
    technician = Column(String(50), comment="施工技师")
    status = Column(String(20), default="pending", comment="状态")
    part_id = Column(Integer, ForeignKey("parts.id"), nullable=True, comment="关联配件ID")
    created_at = Column(DateTime, server_default=func.now())

    work_order = relationship("WorkOrder", back_populates="items")
