from sqlalchemy import Column, String, Integer, Numeric, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from models.base import BaseModel


class ExceptionOrderType:
    SHORTAGE = "shortage"
    QUALITY = "quality"
    DAMAGE = "damage"
    DELAY = "delay"
    OTHER = "other"

    CHOICES = [
        (SHORTAGE, "到货短少"),
        (QUALITY, "质量问题"),
        (DAMAGE, "破损"),
        (DELAY, "配送延迟"),
        (OTHER, "其他"),
    ]


class ExceptionOrderStatus:
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CLOSED = "closed"

    CHOICES = [
        (PENDING, "待处理"),
        (PROCESSING, "处理中"),
        (COMPLETED, "已处理"),
        (CLOSED, "已结案"),
    ]


class ResponsibilityParty:
    SUPPLIER = "supplier"
    WAREHOUSE = "warehouse"
    LOGISTICS = "logistics"
    PLATFORM = "platform"
    CUSTOMER = "customer"
    UNKNOWN = "unknown"

    CHOICES = [
        (SUPPLIER, "供应商"),
        (WAREHOUSE, "仓库"),
        (LOGISTICS, "物流"),
        (PLATFORM, "平台"),
        (CUSTOMER, "客户"),
        (UNKNOWN, "待确认"),
    ]


class ExceptionOrder(BaseModel):
    __tablename__ = "exception_orders"

    group_batch_id = Column(Integer, ForeignKey("group_batches.id"), nullable=False, index=True, comment="团单ID")
    arrival_list_id = Column(Integer, ForeignKey("arrival_lists.id"), index=True, comment="到货清单ID")
    exception_no = Column(String(32), unique=True, index=True, nullable=False, comment="异常单号")
    type = Column(String(32), default=ExceptionOrderType.SHORTAGE, index=True, comment="异常类型")
    title = Column(String(256), comment="异常标题")
    description = Column(Text, comment="异常描述")
    product_info = Column(Text, comment="涉及商品信息(JSON)")
    affected_quantity = Column(Integer, default=0, comment="影响数量")
    affected_customers = Column(Integer, default=0, comment="影响客户数")
    estimated_loss = Column(Numeric(12, 2), default=0, comment="预估损失")
    responsibility_party = Column(String(32), default=ResponsibilityParty.UNKNOWN, index=True, comment="责任归属")
    responsibility_detail = Column(Text, comment="责任判定说明")
    status = Column(String(32), default=ExceptionOrderStatus.PENDING, index=True, comment="状态")
    reported_by = Column(String(32), comment="上报人")
    reported_time = Column(DateTime, comment="上报时间")
    processor = Column(String(32), comment="处理人")
    process_result = Column(Text, comment="处理结果")
    process_time = Column(DateTime, comment="处理时间")
    compensation_amount = Column(Numeric(12, 2), default=0, comment="赔付金额")
    evidence_images = Column(Text, comment="凭证图片(JSON数组)")
    remark = Column(Text, comment="备注")

    group_batch = relationship("GroupBatch", back_populates="exception_orders")
    arrival_list = relationship("ArrivalList")
