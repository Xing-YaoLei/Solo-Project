from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
from enum import Enum


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    FAILED = "failed"


class DepositStatus(str, Enum):
    UNPAID = "unpaid"
    PAID = "paid"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"
    FORFEITED = "forfeited"


class AnomalyStatus(str, Enum):
    OPEN = "open"
    PROCESSING = "processing"
    RESOLVED = "resolved"
    CLOSED = "closed"


class AnomalyType(str, Enum):
    OVERSOLD = "oversold"
    PRICE_MISMATCH = "price_mismatch"
    INVENTORY_ERROR = "inventory_error"
    VERIFICATION_FAILED = "verification_failed"
    DEPOSIT_ISSUE = "deposit_issue"


class ResponsibilityOwner(str, Enum):
    SALES = "sales"
    OPERATIONS = "operations"
    FRONT_DESK = "front_desk"
    SYSTEM = "system"
    CUSTOMER = "customer"


class PackageBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    homestay_name: str = Field(..., max_length=255)
    room_type: Optional[str] = None
    max_guests: int = 2
    base_price: Decimal = Field(..., decimal_places=2)
    is_active: bool = True


class PackageCreate(PackageBase):
    pass


class PackageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    homestay_name: Optional[str] = None
    room_type: Optional[str] = None
    max_guests: Optional[int] = None
    base_price: Optional[Decimal] = None
    is_active: Optional[bool] = None


class PackageOut(PackageBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


class PackageListOut(BaseModel):
    items: List[PackageOut]
    total: int
    page: int
    page_size: int


class PriceRuleBase(BaseModel):
    package_id: int
    rule_name: str
    rule_type: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    weekdays: Optional[List[int]] = None
    price_adjustment_type: str = "fixed"
    price_adjustment_value: Decimal
    min_stay_nights: int = 1
    max_stay_nights: Optional[int] = None
    is_active: bool = True
    priority: int = 0


class PriceRuleCreate(PriceRuleBase):
    pass


class PriceRuleUpdate(BaseModel):
    rule_name: Optional[str] = None
    rule_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    weekdays: Optional[List[int]] = None
    price_adjustment_type: Optional[str] = None
    price_adjustment_value: Optional[Decimal] = None
    min_stay_nights: Optional[int] = None
    max_stay_nights: Optional[int] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None


class PriceRuleOut(PriceRuleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


class StayDateBase(BaseModel):
    package_id: int
    stay_date: date
    check_in_time: str = "14:00"
    check_out_time: str = "12:00"
    is_blocked: bool = False
    block_reason: Optional[str] = None


class StayDateCreate(StayDateBase):
    pass


class StayDateUpdate(BaseModel):
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    is_blocked: Optional[bool] = None
    block_reason: Optional[str] = None


class StayDateOut(StayDateBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


class PackageInventoryBase(BaseModel):
    package_id: int
    stay_date_id: int
    inventory_date: date
    total_quantity: int = 1
    sold_quantity: int = 0
    reserved_quantity: int = 0
    unit_price: Decimal


class PackageInventoryCreate(PackageInventoryBase):
    pass


class PackageInventoryUpdate(BaseModel):
    total_quantity: Optional[int] = None
    sold_quantity: Optional[int] = None
    reserved_quantity: Optional[int] = None
    unit_price: Optional[Decimal] = None


class PackageInventoryOut(PackageInventoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    available_quantity: int = 0
    updated_at: datetime


class OrderBase(BaseModel):
    package_id: int
    customer_name: str
    customer_phone: str
    customer_id_card: Optional[str] = None
    check_in_date: date
    check_out_date: date
    nights: int
    guest_count: int = 1
    room_count: int = 1
    original_amount: Decimal
    discount_amount: Decimal = Decimal("0")
    final_amount: Decimal
    deposit_amount: Decimal = Decimal("0")
    sales_channel: Optional[str] = None
    sales_person: Optional[str] = None
    remark: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_id_card: Optional[str] = None
    status: Optional[OrderStatus] = None
    remark: Optional[str] = None


class OrderStatusChange(BaseModel):
    to_status: OrderStatus
    operator: Optional[str] = None
    reason: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None


class OrderOut(OrderBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    order_no: str
    status: OrderStatus
    operator: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    package: Optional[PackageOut] = None
    verification: Optional["VerificationOut"] = None
    deposit: Optional["DepositOut"] = None


class OrderListOut(BaseModel):
    items: List[OrderOut]
    total: int
    page: int
    page_size: int


class OrderStatusLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    order_id: int
    from_status: Optional[OrderStatus]
    to_status: OrderStatus
    operator: Optional[str] = None
    reason: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None
    created_at: datetime


class OrderDetailOut(OrderOut):
    verification: Optional["VerificationOut"] = None
    deposit: Optional["DepositOut"] = None
    status_logs: List[OrderStatusLogOut] = []


class VerificationBase(BaseModel):
    order_id: int
    verification_code: Optional[str] = None
    check_in_actual: Optional[datetime] = None
    check_out_actual: Optional[datetime] = None
    guest_ids_verified: Optional[List[str]] = None
    verification_note: Optional[str] = None


class VerificationCreate(VerificationBase):
    pass


class VerificationUpdate(BaseModel):
    status: Optional[VerificationStatus] = None
    verification_code: Optional[str] = None
    verified_by: Optional[str] = None
    check_in_actual: Optional[datetime] = None
    check_out_actual: Optional[datetime] = None
    guest_ids_verified: Optional[List[str]] = None
    verification_note: Optional[str] = None


class VerificationOut(VerificationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: VerificationStatus
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class DeductionDetail(BaseModel):
    item: str
    amount: Decimal
    reason: Optional[str] = None


class DepositBase(BaseModel):
    order_id: int
    total_amount: Decimal
    payment_method: Optional[str] = None
    payment_ref: Optional[str] = None


class DepositCreate(DepositBase):
    pass


class DepositPay(BaseModel):
    paid_amount: Decimal
    payment_method: str
    payment_ref: Optional[str] = None
    handler: Optional[str] = None


class DepositRefund(BaseModel):
    refund_amount: Optional[Decimal] = None
    refund_method: str
    refund_ref: Optional[str] = None
    deductions: Optional[List[DeductionDetail]] = None
    handler: Optional[str] = None
    remark: Optional[str] = None


class DepositUpdate(BaseModel):
    status: Optional[DepositStatus] = None
    remark: Optional[str] = None


class DepositOut(DepositBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    paid_amount: Decimal
    refunded_amount: Decimal
    status: DepositStatus
    paid_at: Optional[datetime] = None
    refund_method: Optional[str] = None
    refund_ref: Optional[str] = None
    refunded_at: Optional[datetime] = None
    deduction_details: Optional[List[DeductionDetail]] = None
    deducted_amount: Decimal
    handler: Optional[str] = None
    remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class AnomalyOrderBase(BaseModel):
    order_id: Optional[int] = None
    package_id: Optional[int] = None
    anomaly_type: AnomalyType
    title: str
    description: Optional[str] = None
    impact_scope: Optional[Dict[str, Any]] = None
    impact_level: str = "medium"
    responsibility_owner: Optional[ResponsibilityOwner] = None
    responsible_person: Optional[str] = None
    root_cause: Optional[str] = None
    reported_by: Optional[str] = None


class AnomalyOrderCreate(AnomalyOrderBase):
    pass


class AnomalyOrderUpdate(BaseModel):
    status: Optional[AnomalyStatus] = None
    title: Optional[str] = None
    description: Optional[str] = None
    impact_scope: Optional[Dict[str, Any]] = None
    impact_level: Optional[str] = None
    responsibility_owner: Optional[ResponsibilityOwner] = None
    responsible_person: Optional[str] = None
    root_cause: Optional[str] = None
    resolution: Optional[str] = None
    compensation_amount: Optional[Decimal] = None
    handled_by: Optional[str] = None


class AnomalyHandlingAction(BaseModel):
    action: str
    operator: str
    note: Optional[str] = None


class AnomalyOrderOut(AnomalyOrderBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    anomaly_no: str
    status: AnomalyStatus
    handling_process: Optional[List[Dict[str, Any]]] = None
    resolution: Optional[str] = None
    compensation_amount: Decimal
    reported_at: datetime
    handled_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class AnomalyListOut(BaseModel):
    items: List[AnomalyOrderOut]
    total: int
    page: int
    page_size: int


class ExportTaskCreate(BaseModel):
    export_type: str
    criteria: Optional[Dict[str, Any]] = None
    requested_by: Optional[str] = None


class ExportTaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    task_no: str
    export_type: str
    status: str
    criteria: Optional[Dict[str, Any]] = None
    data_caliber: Optional[Dict[str, Any]] = None
    file_url: Optional[str] = None
    file_size: Optional[int] = None
    total_rows: Optional[int] = None
    requested_by: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class ConversionMetrics(BaseModel):
    period: str
    total_inquiries: int = 0
    total_orders: int = 0
    confirmed_orders: int = 0
    checked_in_orders: int = 0
    cancelled_orders: int = 0
    inquiry_to_order_rate: float = 0.0
    order_to_confirm_rate: float = 0.0
    confirm_to_checkin_rate: float = 0.0
    overall_conversion_rate: float = 0.0
    total_revenue: Decimal = Decimal("0")
    avg_order_value: Decimal = Decimal("0")


class PackageConversionDetail(BaseModel):
    package_id: int
    package_name: str
    metrics: ConversionMetrics
