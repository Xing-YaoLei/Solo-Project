from sqlalchemy import Column, String, Integer, Numeric, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from models.base import BaseModel


class AfterSaleVoucherType:
    REFUND = "refund"
    EXCHANGE = "exchange"
    COMPENSATION = "compensation"
    OTHER = "other"

    CHOICES = [
        (REFUND, "退款"),
        (EXCHANGE, "换货"),
        (COMPENSATION, "赔偿"),
        (OTHER, "其他"),
    ]


class AfterSaleVoucherStatus:
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    REJECTED = "rejected"

    CHOICES = [
        (PENDING, "待处理"),
        (PROCESSING, "处理中"),
        (COMPLETED, "已完成"),
        (REJECTED, "已驳回"),
    ]


class AfterSaleVoucher(BaseModel):
    __tablename__ = "after_sale_vouchers"

    pickup_code_id = Column(Integer, ForeignKey("pickup_codes.id"), nullable=False, index=True, comment="自提码ID")
    voucher_no = Column(String(32), unique=True, index=True, nullable=False, comment="售后单号")
    type = Column(String(32), default=AfterSaleVoucherType.REFUND, index=True, comment="售后类型")
    reason = Column(Text, comment="售后原因")
    product_info = Column(Text, comment="涉及商品信息(JSON)")
    refund_amount = Column(Numeric(12, 2), default=0, comment="退款金额")
    status = Column(String(32), default=AfterSaleVoucherStatus.PENDING, index=True, comment="状态")
    applicant = Column(String(32), comment="申请人")
    applicant_phone = Column(String(16), comment="申请人电话")
    apply_time = Column(DateTime, comment="申请时间")
    processor = Column(String(32), comment="处理人")
    process_time = Column(DateTime, comment="处理时间")
    process_result = Column(Text, comment="处理结果")
    evidence_images = Column(Text, comment="凭证图片(JSON数组)")
    remark = Column(Text, comment="备注")

    pickup_code = relationship("PickupCode", back_populates="after_sale_vouchers")
