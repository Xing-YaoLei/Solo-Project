from sqlalchemy import Column, String, Integer, Numeric, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from models.base import BaseModel


class ArrivalListStatus:
    PENDING = "pending"
    PARTIAL = "partial"
    COMPLETED = "completed"
    SHORTAGE = "shortage"

    CHOICES = [
        (PENDING, "待到货"),
        (PARTIAL, "部分到货"),
        (COMPLETED, "已到货"),
        (SHORTAGE, "到货短少"),
    ]


class ArrivalList(BaseModel):
    __tablename__ = "arrival_lists"

    group_batch_id = Column(Integer, ForeignKey("group_batches.id"), nullable=False, index=True, comment="团单ID")
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True, comment="商品ID")
    product_sku = Column(String(64), comment="商品SKU")
    product_name = Column(String(128), comment="商品名称")
    expected_quantity = Column(Integer, default=0, comment="预计到货数量")
    actual_quantity = Column(Integer, default=0, comment="实际到货数量")
    shortage_quantity = Column(Integer, default=0, comment="短少数量")
    unit_price = Column(Numeric(10, 2), comment="单价")
    total_amount = Column(Numeric(12, 2), comment="金额")
    status = Column(String(32), default=ArrivalListStatus.PENDING, index=True, comment="状态")
    arrival_time = Column(DateTime, comment="到货时间")
    warehouse_operator = Column(String(32), comment="仓管员")
    remark = Column(Text, comment="备注")
    has_exception = Column(Integer, default=0, comment="是否有异常:0-否,1-是")

    group_batch = relationship("GroupBatch", back_populates="arrival_lists")
    product = relationship("Product")
    product_tags = relationship("ProductTag", back_populates="arrival_list", cascade="all, delete-orphan")
