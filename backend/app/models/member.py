from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class MemberReceipt(Base):
    __tablename__ = "member_receipts"

    id = Column(Integer, primary_key=True, index=True)
    receipt_no = Column(String(100), unique=True, index=True, nullable=False)
    pos_txn_id = Column(String(100), index=True)
    member_id = Column(String(100), nullable=False, index=True)
    member_name = Column(String(200))
    member_phone = Column(String(50))
    business_date = Column(DateTime, nullable=False, index=True)
    receipt_time = Column(DateTime, nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    total_amount = Column(Float, nullable=False)
    points_earned = Column(Float, default=0.0)
    points_used = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    pay_amount = Column(Float, nullable=False)
    level = Column(String(50))
    is_void = Column(Boolean, default=False)
    source = Column(String(100))
    extra_data = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("MemberReceiptItem", back_populates="receipt")

class MemberReceiptItem(Base):
    __tablename__ = "member_receipt_items"

    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("member_receipts.id"), nullable=False)
    line_no = Column(Integer, nullable=False)
    sku_code = Column(String(100), nullable=False)
    sku_name = Column(String(300), nullable=False)
    category = Column(String(100))
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    points_applied = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    receipt = relationship("MemberReceipt", back_populates="items")

class DataConflict(Base):
    __tablename__ = "data_conflicts"

    id = Column(Integer, primary_key=True, index=True)
    conflict_type = Column(String(50), nullable=False, index=True)
    business_date = Column(DateTime, nullable=False, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    ref_id_1 = Column(String(100))
    ref_id_2 = Column(String(100))
    field_name = Column(String(100))
    source_1 = Column(String(100))
    source_2 = Column(String(100))
    value_1 = Column(JSON)
    value_2 = Column(JSON)
    value_diff = Column(String(500))
    severity = Column(String(50), default="medium")
    status = Column(String(50), default="pending")
    description = Column(String(1000))
    resolved_by = Column(String(100))
    resolved_at = Column(DateTime)
    resolution_note = Column(String(1000))
    created_at = Column(DateTime, default=datetime.utcnow)
