from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class POSVersion(Base):
    __tablename__ = "pos_versions"

    id = Column(Integer, primary_key=True, index=True)
    version_number = Column(Integer, nullable=False)
    batch_id = Column(String(100), unique=True, index=True, nullable=False)
    business_date = Column(DateTime, nullable=False, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    source_system = Column(String(100))
    sync_timestamp = Column(DateTime)
    sync_delay_minutes = Column(Integer, default=0)
    transaction_count = Column(Integer, default=0)
    total_amount = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    transactions = relationship("POSTransaction", back_populates="version")

class POSTransaction(Base):
    __tablename__ = "pos_transactions"

    id = Column(Integer, primary_key=True, index=True)
    version_id = Column(Integer, ForeignKey("pos_versions.id"), nullable=False)
    txn_id = Column(String(100), nullable=False, index=True)
    txn_time = Column(DateTime, nullable=False, index=True)
    cashier = Column(String(100))
    member_id = Column(String(100), index=True)
    total_amount = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0)
    pay_amount = Column(Float, nullable=False)
    pay_method = Column(String(50))
    order_type = Column(String(50))
    table_number = Column(String(50))
    is_cancelled = Column(Boolean, default=False)
    extra_data = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)

    version = relationship("POSVersion", back_populates="transactions")
    items = relationship("POSTransactionItem", back_populates="transaction")

class POSTransactionItem(Base):
    __tablename__ = "pos_transaction_items"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("pos_transactions.id"), nullable=False)
    sku_code = Column(String(100), nullable=False)
    sku_name = Column(String(300), nullable=False)
    category = Column(String(100))
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    is_promotion = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    transaction = relationship("POSTransaction", back_populates="items")
