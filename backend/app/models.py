from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    PICKED = "picked"
    DELIVERING = "delivering"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"
    APPEALED = "appealed"
    SETTLED = "settled"


class RejectReason(str, enum.Enum):
    RIDER_FAULT = "rider_fault"
    SYSTEM_FAULT = "system_fault"
    MERCHANT_FAULT = "merchant_fault"
    CUSTOMER_FAULT = "customer_fault"
    OTHER = "other"


class AddressDict(Base):
    __tablename__ = "address_dict"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    address = Column(String(500), nullable=False)
    area = Column(String(100), index=True)
    lng = Column(Float)
    lat = Column(Float)
    contact_person = Column(String(50))
    contact_phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TrackRule(Base):
    __tablename__ = "track_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    area = Column(String(100), index=True)
    max_distance = Column(Float, nullable=False, comment="最大配送距离(米)")
    expected_duration = Column(Integer, nullable=False, comment="预计时长(分钟)")
    warning_duration = Column(Integer, nullable=False, comment="预警时长(分钟)")
    track_interval = Column(Integer, default=60, comment="轨迹上报间隔(秒)")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SubsidyRule(Base):
    __tablename__ = "subsidy_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    rule_type = Column(String(50), index=True, comment="补贴类型: distance/weather/peak/weight")
    threshold = Column(Float, nullable=False, comment="阈值")
    subsidy_amount = Column(Float, nullable=False, comment="补贴金额")
    subsidy_unit = Column(String(20), default="yuan", comment="单位: yuan/percent")
    area = Column(String(100), index=True)
    priority = Column(Integer, default=0, comment="优先级，数字越大越优先")
    is_active = Column(Boolean, default=True)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Rider(Base):
    __tablename__ = "riders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    phone = Column(String(20), unique=True, index=True)
    area = Column(String(100), index=True)
    level = Column(String(20), default="normal")
    status = Column(String(20), default="online")
    rating = Column(Float, default=5.0)
    total_orders = Column(Integer, default=0)
    reject_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True, nullable=False)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, index=True)
    
    pickup_address_id = Column(Integer, ForeignKey("address_dict.id"))
    delivery_address_id = Column(Integer, ForeignKey("address_dict.id"))
    pickup_address = Column(String(500), nullable=False)
    delivery_address = Column(String(500), nullable=False)
    pickup_area = Column(String(100), index=True)
    delivery_area = Column(String(100), index=True)
    distance = Column(Float, comment="配送距离(米)")
    
    goods_name = Column(String(200))
    goods_weight = Column(Float, default=0)
    goods_amount = Column(Float, default=0)
    
    customer_name = Column(String(50))
    customer_phone = Column(String(20))
    
    rider_id = Column(Integer, ForeignKey("riders.id"), nullable=True)
    assign_time = Column(DateTime, nullable=True)
    accept_time = Column(DateTime, nullable=True)
    pickup_time = Column(DateTime, nullable=True)
    delivery_time = Column(DateTime, nullable=True)
    complete_time = Column(DateTime, nullable=True)
    
    base_fee = Column(Float, default=0)
    distance_fee = Column(Float, default=0)
    weight_fee = Column(Float, default=0)
    subsidy_fee = Column(Float, default=0)
    total_fee = Column(Float, default=0)
    
    rider_income = Column(Float, default=0, comment="骑手实际收入")
    platform_profit = Column(Float, default=0, comment="平台利润")
    
    reject_count = Column(Integer, default=0)
    last_reject_reason = Column(String(200), nullable=True)
    last_reject_time = Column(DateTime, nullable=True)
    
    remark = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    pickup_addr = relationship("AddressDict", foreign_keys=[pickup_address_id])
    delivery_addr = relationship("AddressDict", foreign_keys=[delivery_address_id])
    rider = relationship("Rider")
    status_logs = relationship("OrderStatusLog", back_populates="order", order_by="OrderStatusLog.id")
    appeals = relationship("Appeal", back_populates="order")
    settlements = relationship("Settlement", back_populates="order")


class OrderStatusLog(Base):
    __tablename__ = "order_status_logs"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), index=True)
    from_status = Column(String(50))
    to_status = Column(String(50), nullable=False)
    operator_type = Column(String(20), comment="操作人类型: system/rider/admin/customer")
    operator_id = Column(Integer, nullable=True)
    operator_name = Column(String(50), nullable=True)
    reason = Column(String(500), nullable=True)
    remark = Column(Text, nullable=True)
    extra_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    order = relationship("Order", back_populates="status_logs")


class OrderRejectRecord(Base):
    __tablename__ = "order_reject_records"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), index=True)
    rider_id = Column(Integer, ForeignKey("riders.id"), index=True)
    reject_reason = Column(SQLEnum(RejectReason), nullable=False)
    reject_detail = Column(String(500), nullable=True)
    responsibility = Column(String(50), comment="责任方: rider/platform/merchant/customer")
    is_reminded = Column(Boolean, default=False)
    reminded_at = Column(DateTime, nullable=True)
    handler = Column(String(50), nullable=True, comment="处理人")
    handled_at = Column(DateTime, nullable=True)
    remark = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    rider = relationship("Rider")


class Appeal(Base):
    __tablename__ = "appeals"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), index=True)
    appeal_type = Column(String(50), comment="申诉类型: late/damage/lost/wrong")
    appellant = Column(String(50), comment="申诉方: customer/rider/merchant")
    appellant_name = Column(String(100))
    appellant_phone = Column(String(20))
    description = Column(Text, nullable=False)
    status = Column(String(20), default="pending", comment="pending/processing/resolved/rejected")
    claim_amount = Column(Float, default=0, comment="索赔金额")
    compensate_amount = Column(Float, default=0, comment="赔付金额")
    
    evidence = Column(JSON, default=list, comment="证据列表 [{type, url, name}]")
    
    handler = Column(String(50), nullable=True)
    handle_time = Column(DateTime, nullable=True)
    handle_result = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    order = relationship("Order", back_populates="appeals")


class Settlement(Base):
    __tablename__ = "settlements"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), index=True)
    settlement_no = Column(String(50), unique=True, index=True)
    
    base_fee = Column(Float, default=0)
    distance_fee = Column(Float, default=0)
    weight_fee = Column(Float, default=0)
    subsidy_fee = Column(Float, default=0)
    appeal_compensation = Column(Float, default=0, comment="申诉赔付")
    penalty_fee = Column(Float, default=0, comment="罚款")
    bonus_fee = Column(Float, default=0, comment="奖金")
    
    total_income = Column(Float, default=0, comment="订单总收入")
    rider_income = Column(Float, default=0, comment="骑手收入")
    platform_income = Column(Float, default=0, comment="平台收入")
    
    detail = Column(JSON, default=list, comment="结算明细项")
    remark = Column(Text, nullable=True)
    
    status = Column(String(20), default="pending", comment="pending/confirmed/paid")
    confirmed_by = Column(String(50), nullable=True)
    confirmed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    order = relationship("Order", back_populates="settlements")


class CompensateStat(Base):
    __tablename__ = "compensate_stats"

    id = Column(Integer, primary_key=True, index=True)
    stat_date = Column(DateTime, index=True)
    area = Column(String(100), index=True)
    handler = Column(String(50), index=True)
    
    total_orders = Column(Integer, default=0)
    appeal_count = Column(Integer, default=0)
    appeal_rate = Column(Float, default=0)
    
    compensate_amount = Column(Float, default=0)
    compensate_count = Column(Integer, default=0)
    
    late_compensate = Column(Float, default=0)
    damage_compensate = Column(Float, default=0)
    lost_compensate = Column(Float, default=0)
    other_compensate = Column(Float, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
