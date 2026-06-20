from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from models.database import Base


class MerchantTransaction(Base):
    __tablename__ = "merchant_transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(Integer, ForeignKey("data_batches.id"), nullable=True)
    trans_date = Column(Date, nullable=False, index=True)
    time_slot = Column(String(16), nullable=False, index=True)
    zone = Column(String(64), nullable=False, index=True)
    merchant_id = Column(String(64), nullable=False)
    merchant_name = Column(String(128), nullable=True)
    category = Column(String(32), nullable=True, comment="餐饮/零售/游乐/住宿")
    order_no = Column(String(128), nullable=False, unique=True)
    reservation_id = Column(String(128), nullable=True, index=True, comment="关联预约单号(可空)")
    id_card_hash = Column(String(128), nullable=True, comment="游客身份标识(可空)")
    amount = Column(Numeric(12, 2), default=0)
    passenger_count = Column(Integer, default=1, comment="关联游客数")
    pay_method = Column(String(32), nullable=True, comment="wechat/alipay/cash/card")
    trans_status = Column(String(16), default="paid", comment="paid/refunded")
    is_linked = Column(Integer, default=0, comment="是否关联预约人群: 0否 1是")
    trans_at = Column(DateTime, default=datetime.now, index=True)

    batch = relationship("DataBatch")
