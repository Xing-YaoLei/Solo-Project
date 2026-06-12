from sqlalchemy import Column, String, DateTime, Integer, Numeric, Text
from sqlalchemy.orm import relationship
from models.base import BaseModel


class GroupBatchStatus:
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    ARRIVED = "arrived"
    PICKING = "picking"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

    CHOICES = [
        (PENDING, "待开团"),
        (IN_PROGRESS, "开团中"),
        (ARRIVED, "已到货"),
        (PICKING, "提货中"),
        (COMPLETED, "已完成"),
        (CANCELLED, "已取消"),
    ]


class GroupBatch(BaseModel):
    __tablename__ = "group_batches"

    batch_no = Column(String(32), unique=True, index=True, nullable=False, comment="团单号")
    name = Column(String(128), nullable=False, comment="团单名称")
    status = Column(String(32), default=GroupBatchStatus.PENDING, index=True, comment="状态")
    group_start_time = Column(DateTime, comment="开团时间")
    group_end_time = Column(DateTime, comment="截团时间")
    expected_arrival_time = Column(DateTime, comment="预计到货时间")
    actual_arrival_time = Column(DateTime, comment="实际到货时间")
    pickup_deadline = Column(DateTime, comment="提货截止时间")
    total_orders = Column(Integer, default=0, comment="订单总数")
    total_items = Column(Integer, default=0, comment="商品总件数")
    total_amount = Column(Numeric(12, 2), default=0, comment="总金额")
    pickup_point = Column(String(128), comment="提货点")
    contact_person = Column(String(32), comment="联系人")
    contact_phone = Column(String(16), comment="联系电话")
    remark = Column(Text, comment="备注")
    operator = Column(String(32), comment="操作人")

    arrival_lists = relationship("ArrivalList", back_populates="group_batch", cascade="all, delete-orphan")
    pickup_codes = relationship("PickupCode", back_populates="group_batch", cascade="all, delete-orphan")
    exception_orders = relationship("ExceptionOrder", back_populates="group_batch", cascade="all, delete-orphan")
    status_logs = relationship("StatusLog", primaryjoin="and_(StatusLog.related_type=='group_batch', foreign(StatusLog.related_id)==GroupBatch.id)")
