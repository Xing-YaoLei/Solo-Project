from sqlalchemy import Column, String, Integer, Numeric, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from models.base import BaseModel


class PickupCodeStatus:
    UNUSED = "unused"
    USED = "used"
    EXPIRED = "expired"
    REFUNDED = "refunded"

    CHOICES = [
        (UNUSED, "待提货"),
        (USED, "已提货"),
        (EXPIRED, "已过期"),
        (REFUNDED, "已退款"),
    ]


class PickupCode(BaseModel):
    __tablename__ = "pickup_codes"

    group_batch_id = Column(Integer, ForeignKey("group_batches.id"), nullable=False, index=True, comment="团单ID")
    code = Column(String(32), unique=True, index=True, nullable=False, comment="自提码")
    qr_code = Column(String(512), comment="二维码链接")
    customer_name = Column(String(32), comment="客户姓名")
    customer_phone = Column(String(16), index=True, comment="客户手机号")
    order_no = Column(String(64), index=True, comment="订单号")
    product_info = Column(Text, comment="商品信息(JSON)")
    total_items = Column(Integer, default=0, comment="商品件数")
    total_amount = Column(Numeric(12, 2), default=0, comment="订单金额")
    status = Column(String(32), default=PickupCodeStatus.UNUSED, index=True, comment="状态")
    pickup_time = Column(DateTime, comment="提货时间")
    pickup_operator = Column(String(32), comment="提货操作人")
    expire_time = Column(DateTime, comment="过期时间")
    remark = Column(Text, comment="备注")
    is_notified = Column(Boolean, default=False, comment="是否已通知")

    group_batch = relationship("GroupBatch", back_populates="pickup_codes")
    after_sale_vouchers = relationship("AfterSaleVoucher", back_populates="pickup_code", cascade="all, delete-orphan")
