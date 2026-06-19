from datetime import datetime, date
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date, Float, Boolean,
    ForeignKey, Enum, JSON, BigInteger, Numeric, PrimaryKeyConstraint,
    UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from ..core.database import Base


class OrderStatus(PyEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class VerificationStatus(PyEnum):
    PENDING = "pending"
    VERIFIED = "verified"
    FAILED = "failed"


class DepositStatus(PyEnum):
    UNPAID = "unpaid"
    PAID = "paid"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"
    FORFEITED = "forfeited"


class AnomalyStatus(PyEnum):
    OPEN = "open"
    PROCESSING = "processing"
    RESOLVED = "resolved"
    CLOSED = "closed"


class AnomalyType(PyEnum):
    OVERSOLD = "oversold"
    PRICE_MISMATCH = "price_mismatch"
    INVENTORY_ERROR = "inventory_error"
    VERIFICATION_FAILED = "verification_failed"
    DEPOSIT_ISSUE = "deposit_issue"


class ResponsibilityOwner(PyEnum):
    SALES = "sales"
    OPERATIONS = "operations"
    FRONT_DESK = "front_desk"
    SYSTEM = "system"
    CUSTOMER = "customer"


class Package(Base):
    __tablename__ = "packages"

    id = Column(BigInteger, primary_key=True, autoincrement=True, index=True)
    name = Column(String(255), nullable=False, comment="套餐名称")
    description = Column(Text, nullable=True, comment="套餐描述")
    homestay_name = Column(String(255), nullable=False, comment="民宿名称")
    room_type = Column(String(100), nullable=True, comment="房型")
    max_guests = Column(Integer, default=2, comment="最多入住人数")
    base_price = Column(Numeric(12, 2), nullable=False, comment="基础价格")
    is_active = Column(Boolean, default=True, comment="是否上架")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    price_rules = relationship("PriceRule", back_populates="package", cascade="all, delete-orphan")
    stay_dates = relationship("StayDate", back_populates="package", cascade="all, delete-orphan")
    inventories = relationship("PackageInventory", back_populates="package", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="package")


class PriceRule(Base):
    __tablename__ = "price_rules"

    id = Column(BigInteger, primary_key=True, autoincrement=True, index=True)
    package_id = Column(BigInteger, ForeignKey("packages.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_name = Column(String(255), nullable=False, comment="规则名称")
    rule_type = Column(String(50), nullable=False, comment="规则类型: weekday/weekend/holiday/custom_date")
    start_date = Column(Date, nullable=True, comment="规则生效开始日期")
    end_date = Column(Date, nullable=True, comment="规则生效结束日期")
    weekdays = Column(JSON, nullable=True, comment="适用星期几 [0-6]")
    price_adjustment_type = Column(String(20), default="fixed", comment="fixed/percentage")
    price_adjustment_value = Column(Numeric(12, 2), nullable=False, comment="调整值")
    min_stay_nights = Column(Integer, default=1, comment="最少入住晚数")
    max_stay_nights = Column(Integer, nullable=True, comment="最多入住晚数")
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0, comment="优先级，数字越大越优先")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    package = relationship("Package", back_populates="price_rules")


class StayDate(Base):
    __tablename__ = "stay_dates"

    id = Column(BigInteger, primary_key=True, autoincrement=True, index=True)
    package_id = Column(BigInteger, ForeignKey("packages.id", ondelete="CASCADE"), nullable=False, index=True)
    stay_date = Column(Date, nullable=False, index=True, comment="入住日期")
    check_in_time = Column(String(20), default="14:00", comment="入住时间")
    check_out_time = Column(String(20), default="12:00", comment="退房时间")
    is_blocked = Column(Boolean, default=False, comment="是否关闭（不可售）")
    block_reason = Column(String(255), nullable=True, comment="关闭原因")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    package = relationship("Package", back_populates="stay_dates")
    inventories = relationship("PackageInventory", back_populates="stay_date", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("package_id", "stay_date", name="uq_package_stay_date"),
    )


class PackageInventory(Base):
    __tablename__ = "package_inventories"

    id = Column(BigInteger, primary_key=True, autoincrement=True, index=True)
    package_id = Column(BigInteger, ForeignKey("packages.id", ondelete="CASCADE"), nullable=False, index=True)
    stay_date_id = Column(BigInteger, ForeignKey("stay_dates.id", ondelete="CASCADE"), nullable=False, index=True)
    inventory_date = Column(Date, nullable=False, index=True, comment="库存日期")
    total_quantity = Column(Integer, nullable=False, default=1, comment="总库存")
    sold_quantity = Column(Integer, nullable=False, default=0, comment="已售数量")
    reserved_quantity = Column(Integer, nullable=False, default=0, comment="预留数量")
    unit_price = Column(Numeric(12, 2), nullable=False, comment="当日单价")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    package = relationship("Package", back_populates="inventories")
    stay_date = relationship("StayDate", back_populates="inventories")


class Order(Base):
    __tablename__ = "orders"

    id = Column(BigInteger, primary_key=True, autoincrement=True, index=True)
    order_no = Column(String(50), unique=True, nullable=False, index=True, comment="订单号")
    package_id = Column(BigInteger, ForeignKey("packages.id"), nullable=False, index=True)
    customer_name = Column(String(100), nullable=False, comment="客户姓名")
    customer_phone = Column(String(30), nullable=False, comment="客户电话")
    customer_id_card = Column(String(50), nullable=True, comment="身份证号")
    check_in_date = Column(Date, nullable=False, index=True, comment="入住日期")
    check_out_date = Column(Date, nullable=False, comment="退房日期")
    nights = Column(Integer, nullable=False, comment="入住晚数")
    guest_count = Column(Integer, default=1, comment="入住人数")
    room_count = Column(Integer, default=1, comment="房间数")
    original_amount = Column(Numeric(12, 2), nullable=False, comment="原价总额")
    discount_amount = Column(Numeric(12, 2), default=0, comment="优惠金额")
    final_amount = Column(Numeric(12, 2), nullable=False, comment="实收金额")
    deposit_amount = Column(Numeric(12, 2), default=0, comment="押金金额")
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, index=True, comment="订单状态")
    sales_channel = Column(String(50), nullable=True, comment="销售渠道")
    sales_person = Column(String(100), nullable=True, comment="销售负责人")
    operator = Column(String(100), nullable=True, comment="操作人")
    remark = Column(Text, nullable=True, comment="备注")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    package = relationship("Package", back_populates="orders")
    verification = relationship("Verification", back_populates="order", uselist=False, cascade="all, delete-orphan")
    deposit = relationship("Deposit", back_populates="order", uselist=False, cascade="all, delete-orphan")
    status_logs = relationship("OrderStatusLog", back_populates="order", cascade="all, delete-orphan")
    anomalies = relationship("AnomalyOrder", back_populates="order")


class OrderStatusLog(Base):
    __tablename__ = "order_status_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True, index=True)
    order_id = Column(BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    from_status = Column(Enum(OrderStatus), nullable=True)
    to_status = Column(Enum(OrderStatus), nullable=False)
    operator = Column(String(100), nullable=True)
    reason = Column(String(500), nullable=True)
    extra_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    order = relationship("Order", back_populates="status_logs")


class Verification(Base):
    __tablename__ = "verifications"

    id = Column(BigInteger, primary_key=True, autoincrement=True, index=True)
    order_id = Column(BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING, index=True)
    verification_code = Column(String(100), nullable=True, comment="核销码")
    verified_at = Column(DateTime, nullable=True, comment="核销时间")
    verified_by = Column(String(100), nullable=True, comment="核销人")
    check_in_actual = Column(DateTime, nullable=True, comment="实际入住时间")
    check_out_actual = Column(DateTime, nullable=True, comment="实际退房时间")
    guest_ids_verified = Column(JSON, nullable=True, comment="已核验的客人证件")
    verification_note = Column(Text, nullable=True, comment="核销备注")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    order = relationship("Order", back_populates="verification")


class Deposit(Base):
    __tablename__ = "deposits"

    id = Column(BigInteger, primary_key=True, autoincrement=True, index=True)
    order_id = Column(BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    total_amount = Column(Numeric(12, 2), nullable=False, comment="应付押金总额")
    paid_amount = Column(Numeric(12, 2), default=0, comment="已付金额")
    refunded_amount = Column(Numeric(12, 2), default=0, comment="已退金额")
    status = Column(Enum(DepositStatus), default=DepositStatus.UNPAID, index=True)
    payment_method = Column(String(50), nullable=True, comment="支付方式: cash/wechat/alipay/card")
    payment_ref = Column(String(255), nullable=True, comment="支付流水号")
    paid_at = Column(DateTime, nullable=True, comment="支付时间")
    refund_method = Column(String(50), nullable=True, comment="退款方式")
    refund_ref = Column(String(255), nullable=True, comment="退款流水号")
    refunded_at = Column(DateTime, nullable=True, comment="退款时间")
    deduction_details = Column(JSON, nullable=True, comment="扣款明细 [{item, amount, reason}]")
    deducted_amount = Column(Numeric(12, 2), default=0, comment="扣款总额")
    handler = Column(String(100), nullable=True, comment="处理人")
    remark = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    order = relationship("Order", back_populates="deposit")


class AnomalyOrder(Base):
    __tablename__ = "anomaly_orders"

    id = Column(BigInteger, primary_key=True, autoincrement=True, index=True)
    anomaly_no = Column(String(50), unique=True, nullable=False, index=True, comment="异常单号")
    order_id = Column(BigInteger, ForeignKey("orders.id"), nullable=True, index=True)
    package_id = Column(BigInteger, ForeignKey("packages.id"), nullable=True, index=True)
    anomaly_type = Column(Enum(AnomalyType), nullable=False, index=True)
    status = Column(Enum(AnomalyStatus), default=AnomalyStatus.OPEN, index=True)
    title = Column(String(500), nullable=False, comment="异常标题")
    description = Column(Text, nullable=True, comment="异常描述")
    impact_scope = Column(JSON, nullable=True, comment="影响范围 {orders: [], dates: [], rooms: []}")
    impact_level = Column(String(20), default="medium", comment="影响等级: low/medium/high/critical")
    responsibility_owner = Column(Enum(ResponsibilityOwner), nullable=True, comment="责任归属")
    responsible_person = Column(String(100), nullable=True, comment="具体责任人")
    root_cause = Column(Text, nullable=True, comment="根本原因")
    handling_process = Column(JSON, nullable=True, comment="处理过程 [{time, operator, action, note}]")
    resolution = Column(Text, nullable=True, comment="处理结果")
    compensation_amount = Column(Numeric(12, 2), default=0, comment="赔付金额")
    reported_by = Column(String(100), nullable=True, comment="上报人")
    reported_at = Column(DateTime, default=datetime.utcnow, index=True)
    handled_by = Column(String(100), nullable=True, comment="处理人")
    resolved_at = Column(DateTime, nullable=True, comment="解决时间")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    order = relationship("Order", back_populates="anomalies")
    package = relationship("Package")


class ExportTask(Base):
    __tablename__ = "export_tasks"

    id = Column(BigInteger, primary_key=True, autoincrement=True, index=True)
    task_no = Column(String(100), unique=True, nullable=False, index=True)
    export_type = Column(String(50), nullable=False, comment="导出类型: orders/conversion/inventory/anomaly")
    status = Column(String(20), default="pending", index=True)
    criteria = Column(JSON, nullable=True, comment="筛选条件")
    data_caliber = Column(JSON, nullable=True, comment="数据口径说明")
    file_url = Column(String(500), nullable=True)
    file_size = Column(BigInteger, nullable=True)
    total_rows = Column(Integer, nullable=True)
    requested_by = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    celery_task_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime, nullable=True)
