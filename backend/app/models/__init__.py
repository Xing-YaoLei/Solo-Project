from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True)
    merchant_code = Column(String(50), unique=True, index=True, nullable=False)
    merchant_name = Column(String(200), nullable=False)
    contact_person = Column(String(100))
    phone = Column(String(20))
    settlement_cycle = Column(Integer, default=7)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    settlements = relationship("Settlement", back_populates="merchant")
    orders = relationship("Order", back_populates="merchant")


class Settlement(Base):
    __tablename__ = "settlements"

    id = Column(Integer, primary_key=True, index=True)
    settlement_no = Column(String(50), unique=True, index=True, nullable=False)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    settlement_date = Column(Date, nullable=False, index=True)
    total_amount = Column(Numeric(15, 2), nullable=False)
    order_count = Column(Integer, default=0)
    refund_amount = Column(Numeric(15, 2), default=0)
    service_fee = Column(Numeric(15, 2), default=0)
    actual_settlement = Column(Numeric(15, 2), nullable=False)
    status = Column(String(20), default="pending")
    payment_status = Column(String(20), default="unpaid")
    has_anomaly = Column(Boolean, default=False)
    anomaly_type = Column(String(50))
    anomaly_desc = Column(Text)
    review_note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    merchant = relationship("Merchant", back_populates="settlements")
    orders = relationship("Order", back_populates="settlement")
    approval_nodes = relationship("ApprovalNode", back_populates="settlement")
    amount_checks = relationship("AmountCheck", back_populates="settlement")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True, nullable=False)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    settlement_id = Column(Integer, ForeignKey("settlements.id"))
    order_date = Column(DateTime, nullable=False, index=True)
    amount = Column(Numeric(15, 2), nullable=False)
    status = Column(String(20), default="completed")
    payment_method = Column(String(20))
    has_delay = Column(Boolean, default=False)
    delay_hours = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    merchant = relationship("Merchant", back_populates="orders")
    settlement = relationship("Settlement", back_populates="orders")
    customer_service_records = relationship("CustomerServiceRecord", back_populates="order")
    payment_flows = relationship("PaymentFlow", back_populates="order")


class CustomerServiceRecord(Base):
    __tablename__ = "customer_service_records"

    id = Column(Integer, primary_key=True, index=True)
    record_no = Column(String(50), unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    record_date = Column(DateTime, nullable=False)
    record_type = Column(String(50))
    amount = Column(Numeric(15, 2), default=0)
    description = Column(Text)
    handler = Column(String(100))
    is_missing = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="customer_service_records")


class PaymentFlow(Base):
    __tablename__ = "payment_flows"

    id = Column(Integer, primary_key=True, index=True)
    flow_no = Column(String(50), unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    flow_date = Column(DateTime, nullable=False, index=True)
    amount = Column(Numeric(15, 2), nullable=False)
    flow_type = Column(String(20))
    channel = Column(String(50))
    caliber_version = Column(String(20), default="v1")
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="payment_flows")


class ApprovalNode(Base):
    __tablename__ = "approval_nodes"

    id = Column(Integer, primary_key=True, index=True)
    node_no = Column(String(50), unique=True, index=True, nullable=False)
    settlement_id = Column(Integer, ForeignKey("settlements.id"), nullable=False)
    node_name = Column(String(100), nullable=False)
    node_order = Column(Integer, nullable=False)
    status = Column(String(20), default="pending")
    approver = Column(String(100))
    approval_time = Column(DateTime)
    approval_opinion = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    settlement = relationship("Settlement", back_populates="approval_nodes")


class AmountCheck(Base):
    __tablename__ = "amount_checks"

    id = Column(Integer, primary_key=True, index=True)
    check_no = Column(String(50), unique=True, index=True, nullable=False)
    settlement_id = Column(Integer, ForeignKey("settlements.id"), nullable=False)
    check_date = Column(Date, nullable=False)
    order_amount = Column(Numeric(15, 2), nullable=False)
    refund_amount = Column(Numeric(15, 2), default=0)
    service_fee = Column(Numeric(15, 2), default=0)
    expected_settlement = Column(Numeric(15, 2), nullable=False)
    actual_settlement = Column(Numeric(15, 2), nullable=False)
    difference = Column(Numeric(15, 2), default=0)
    is_consistent = Column(Boolean, default=True)
    check_note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    settlement = relationship("Settlement", back_populates="amount_checks")


class CaliberDiff(Base):
    __tablename__ = "caliber_diffs"

    id = Column(Integer, primary_key=True, index=True)
    diff_no = Column(String(50), unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    cs_amount = Column(Numeric(15, 2))
    payment_amount = Column(Numeric(15, 2))
    difference = Column(Numeric(15, 2))
    diff_type = Column(String(50))
    is_resolved = Column(Boolean, default=False)
    resolution = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
