from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Date,
    ForeignKey, DECIMAL, Text, JSON
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Order(Base):
    __tablename__ = 'orders'

    order_id = Column(String(64), primary_key=True)
    order_no = Column(String(64), nullable=False)
    user_id = Column(String(64), nullable=False)
    rider_id = Column(String(64))
    merchant_id = Column(String(64), nullable=False)
    order_type = Column(String(32), nullable=False)
    order_status = Column(String(32), nullable=False)
    pickup_address = Column(Text, nullable=False)
    pickup_lng = Column(DECIMAL(10, 7))
    pickup_lat = Column(DECIMAL(10, 7))
    delivery_address = Column(Text, nullable=False)
    delivery_lng = Column(DECIMAL(10, 7))
    delivery_lat = Column(DECIMAL(10, 7))
    distance_km = Column(DECIMAL(10, 2))
    estimated_amount = Column(DECIMAL(10, 2))
    actual_amount = Column(DECIMAL(10, 2))
    subsidy_amount = Column(DECIMAL(10, 2), default=0)
    create_time = Column(DateTime, nullable=False)
    accept_time = Column(DateTime)
    pickup_time = Column(DateTime)
    delivery_time = Column(DateTime)
    cancel_time = Column(DateTime)
    cancel_reason = Column(String(255))
    is_risk_order = Column(Boolean, default=False)
    risk_level = Column(String(16), default='normal')
    data_source = Column(String(32), nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    payments = relationship('PaymentTransaction', back_populates='order')
    trajectories = relationship('RiderTrajectory', back_populates='order')
    rejections = relationship('RiderRejection', back_populates='order')
    alerts = relationship('RiskAlert', back_populates='order')
    reviews = relationship('ReviewMaterial', back_populates='order')


class PaymentTransaction(Base):
    __tablename__ = 'payment_transactions'

    txn_id = Column(String(64), primary_key=True)
    order_id = Column(String(64), ForeignKey('orders.order_id'), nullable=False)
    user_id = Column(String(64), nullable=False)
    pay_type = Column(String(32), nullable=False)
    pay_amount = Column(DECIMAL(10, 2), nullable=False)
    pay_status = Column(String(32), nullable=False)
    pay_time = Column(DateTime)
    refund_amount = Column(DECIMAL(10, 2), default=0)
    refund_time = Column(DateTime)
    third_party_txn_id = Column(String(128))
    currency = Column(String(16), default='CNY')
    data_source = Column(String(32), nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    order = relationship('Order', back_populates='payments')


class RiderTrajectory(Base):
    __tablename__ = 'rider_trajectories'

    traj_id = Column(String(64), primary_key=True)
    rider_id = Column(String(64), nullable=False)
    order_id = Column(String(64), ForeignKey('orders.order_id'))
    lng = Column(DECIMAL(10, 7), nullable=False)
    lat = Column(DECIMAL(10, 7), nullable=False)
    speed_kmh = Column(DECIMAL(10, 2))
    heading = Column(DECIMAL(5, 2))
    accuracy_m = Column(DECIMAL(10, 2))
    record_time = Column(DateTime, nullable=False)
    data_source = Column(String(32), nullable=False)
    created_at = Column(DateTime, default=datetime.now)

    order = relationship('Order', back_populates='trajectories')


class SubsidyRule(Base):
    __tablename__ = 'subsidy_rules'

    rule_id = Column(String(64), primary_key=True)
    rule_name = Column(String(128), nullable=False)
    rule_type = Column(String(32), nullable=False)
    effective_start = Column(DateTime, nullable=False)
    effective_end = Column(DateTime, nullable=False)
    condition_params = Column(JSON, nullable=False)
    subsidy_calc = Column(JSON, nullable=False)
    max_subsidy_per_order = Column(DECIMAL(10, 2))
    daily_quota = Column(DECIMAL(12, 2))
    used_amount = Column(DECIMAL(12, 2), default=0)
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)
    created_by = Column(String(64))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class WarningThreshold(Base):
    __tablename__ = 'warning_thresholds'

    threshold_id = Column(String(64), primary_key=True)
    metric_code = Column(String(64), nullable=False, unique=True)
    metric_name = Column(String(128), nullable=False)
    metric_category = Column(String(32), nullable=False)
    warning_level = Column(String(16), nullable=False)
    operator = Column(String(16), nullable=False)
    threshold_value = Column(DECIMAL(12, 4), nullable=False)
    unit = Column(String(32))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    updated_by = Column(String(64))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    alerts = relationship('RiskAlert', back_populates='threshold')


class RiderRejection(Base):
    __tablename__ = 'rider_rejections'

    rejection_id = Column(String(64), primary_key=True)
    order_id = Column(String(64), ForeignKey('orders.order_id'), nullable=False)
    rider_id = Column(String(64), nullable=False)
    reject_reason = Column(String(255))
    reject_time = Column(DateTime, nullable=False)
    dispatch_count = Column(Integer, default=1)
    compensation_amount = Column(DECIMAL(10, 2), default=0)
    is_verified = Column(Boolean, default=False)
    verification_note = Column(Text)
    created_at = Column(DateTime, default=datetime.now)

    order = relationship('Order', back_populates='rejections')


class RiskAlert(Base):
    __tablename__ = 'risk_alerts'

    alert_id = Column(String(64), primary_key=True)
    alert_type = Column(String(32), nullable=False)
    alert_level = Column(String(16), nullable=False)
    order_id = Column(String(64), ForeignKey('orders.order_id'))
    rider_id = Column(String(64))
    metric_code = Column(String(64), ForeignKey('warning_thresholds.metric_code'))
    alert_value = Column(DECIMAL(12, 4))
    threshold_value = Column(DECIMAL(12, 4))
    alert_message = Column(Text)
    alert_time = Column(DateTime, nullable=False)
    is_handled = Column(Boolean, default=False)
    handled_by = Column(String(64))
    handled_time = Column(DateTime)
    handle_note = Column(Text)
    created_at = Column(DateTime, default=datetime.now)

    order = relationship('Order', back_populates='alerts')
    threshold = relationship('WarningThreshold', back_populates='alerts')


class ReviewMaterial(Base):
    __tablename__ = 'review_materials'

    review_id = Column(String(64), primary_key=True)
    review_type = Column(String(32), nullable=False)
    order_id = Column(String(64), ForeignKey('orders.order_id'))
    rider_id = Column(String(64))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_orders = Column(Integer, default=0)
    rejection_count = Column(Integer, default=0)
    rejection_rate = Column(DECIMAL(5, 4))
    total_compensation = Column(DECIMAL(12, 2), default=0)
    avg_compensation = Column(DECIMAL(10, 2))
    risk_orders = Column(Integer, default=0)
    material_data = Column(JSON)
    summary = Column(Text)
    created_by = Column(String(64))
    created_at = Column(DateTime, default=datetime.now)

    order = relationship('Order', back_populates='reviews')
