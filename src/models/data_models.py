from typing import Optional, List, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator


class PackageInfo(BaseModel):
    package_id: str
    package_name: str
    package_type: str
    description: Optional[str] = None
    base_price: float
    max_guests: int
    min_nights: int = 1
    max_nights: int = 30
    is_active: bool = True


class OTAOrder(BaseModel):
    order_id: str
    package_id: str
    channel: str
    order_date: date
    checkin_date: date
    checkout_date: date
    nights: int
    rooms: int = 1
    guests: int
    order_amount: float
    paid_amount: float
    order_status: str
    payment_status: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class DoorLockRecord(BaseModel):
    record_id: str
    order_id: Optional[str] = None
    room_id: str
    checkin_time: datetime
    checkout_time: Optional[datetime] = None
    guest_name: Optional[str] = None
    id_card: Optional[str] = None
    operation_type: str
    operator: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)


class PaymentTransaction(BaseModel):
    transaction_id: str
    order_id: str
    transaction_date: datetime
    amount: float
    payment_method: str
    transaction_status: str
    channel_fee: float = 0.0
    net_amount: float
    remark: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)


class PackageInventory(BaseModel):
    inventory_id: Optional[str] = None
    package_id: str
    date: date
    total_rooms: int
    booked_rooms: int = 0
    reserved_rooms: int = 0
    available_rooms: int
    unit_price: float
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    @field_validator("available_rooms")
    @classmethod
    def calculate_available(cls, v: int, info: Any) -> int:
        if v is not None:
            return v
        values = info.data
        return values.get("total_rooms", 0) - values.get("booked_rooms", 0) - values.get("reserved_rooms", 0)


class PricingRule(BaseModel):
    rule_id: Optional[str] = None
    package_id: str
    rule_name: str
    rule_type: str
    start_date: date
    end_date: date
    min_nights: int = 1
    max_nights: int = 30
    base_price: float
    weekend_surcharge: float = 0.0
    holiday_surcharge: float = 0.0
    early_bird_discount: float = 0.0
    last_minute_discount: float = 0.0
    long_stay_discount: float = 0.0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class OversellRecord(BaseModel):
    oversell_id: Optional[str] = None
    package_id: str
    order_id: str
    oversell_date: date
    oversell_rooms: int
    detected_at: datetime = Field(default_factory=datetime.now)
    status: str = "pending"
    handler: Optional[str] = None
    handled_at: Optional[datetime] = None
    handling_result: Optional[str] = None
    remark: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)


class ConversionRateVersion(BaseModel):
    version_id: Optional[str] = None
    version_name: str
    version_code: str
    description: str
    numerator_formula: str
    denominator_formula: str
    time_range: str = "daily"
    filters: Optional[str] = None
    is_active: bool = True
    created_by: str
    created_at: datetime = Field(default_factory=datetime.now)
    effective_date: date
    expiry_date: Optional[date] = None


class AnalysisNote(BaseModel):
    note_id: Optional[str] = None
    record_type: str
    record_id: str
    analysis_date: date
    analyst: str
    content: str
    conclusion: Optional[str] = None
    action_items: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class SalesSummary(BaseModel):
    date: date
    package_id: str
    orders_count: int = 0
    rooms_sold: int = 0
    revenue: float = 0.0
    avg_price: float = 0.0
    conversion_rate: float = 0.0
    visitors: int = 0
    page_views: int = 0


class ChannelPerformance(BaseModel):
    channel: str
    orders_count: int
    rooms_sold: int
    revenue: float
    avg_order_value: float
    conversion_rate: float
    cancellation_rate: float
    channel_fee: float
    net_revenue: float


class InventoryAlert(BaseModel):
    package_id: str
    date: date
    alert_type: str
    severity: str
    message: str
    current_available: int
    threshold: int
    created_at: datetime = Field(default_factory=datetime.now)
