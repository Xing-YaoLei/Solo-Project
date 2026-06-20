from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from enum import Enum


class RoleEnum(str, Enum):
    ADMIN = "admin"
    OPERATION_MANAGER = "operation_manager"
    ANALYST = "analyst"
    VIEWER = "viewer"


class OrderSourceEnum(str, Enum):
    MINIAPP = "miniapp"
    MERCHANT = "merchant"
    ONSITE = "onsite"
    SPONSOR = "sponsor"


class SignCodeTypeEnum(str, Enum):
    QR = "qr"
    BARCODE = "barcode"
    NFC = "nfc"
    MANUAL = "manual"


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[RoleEnum] = None


class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role: RoleEnum = RoleEnum.VIEWER


class UserResponse(UserBase):
    id: int
    role: RoleEnum
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PerformanceScheduleBase(BaseModel):
    performance_name: str
    venue: Optional[str] = None
    performance_date: datetime
    start_time: datetime
    end_time: datetime
    total_seats: int = 0


class PerformanceScheduleCreate(PerformanceScheduleBase):
    pass


class PerformanceScheduleResponse(PerformanceScheduleBase):
    id: int
    status: str
    risk_level: str
    risk_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SeatAllocationBase(BaseModel):
    seat_zone: Optional[str] = None
    seat_number: Optional[str] = None
    seat_type: Optional[str] = None
    price: Optional[Decimal] = None
    status: str = "available"


class SeatAllocationResponse(SeatAllocationBase):
    id: int
    schedule_id: int
    order_id: Optional[int] = None
    recorded_at: datetime

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    order_no: str
    source: OrderSourceEnum = OrderSourceEnum.MINIAPP
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    user_phone: Optional[str] = None
    total_amount: Decimal = Decimal("0")
    ticket_count: int = 0
    merchant_id: Optional[str] = None
    merchant_name: Optional[str] = None


class OrderCreate(OrderBase):
    schedule_id: int


class OrderResponse(OrderBase):
    id: int
    schedule_id: int
    status: str
    paid_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SignCodeBase(BaseModel):
    code: str
    code_type: SignCodeTypeEnum = SignCodeTypeEnum.QR
    is_used: bool = False


class SignCodeCreate(SignCodeBase):
    order_id: int


class SignCodeResponse(SignCodeBase):
    id: int
    order_id: int
    used_at: Optional[datetime] = None
    generated_at: datetime

    class Config:
        from_attributes = True


class CheckinRecordBase(BaseModel):
    user_identifier: Optional[str] = None
    checkin_channel: str = "staff"
    camera_verified: bool = False
    camera_snapshot_id: Optional[str] = None
    is_anomaly: bool = False
    anomaly_type: Optional[str] = None
    anomaly_description: Optional[str] = None
    staff_id: Optional[str] = None
    staff_name: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None


class CheckinRecordCreate(CheckinRecordBase):
    schedule_id: int
    order_id: Optional[int] = None
    sign_code_id: Optional[int] = None


class CheckinRecordResponse(CheckinRecordBase):
    id: int
    schedule_id: int
    order_id: Optional[int] = None
    sign_code_id: Optional[int] = None
    checkin_time: datetime

    class Config:
        from_attributes = True


class SponsorBase(BaseModel):
    sponsor_name: str
    sponsor_type: Optional[str] = None
    sponsorship_level: Optional[str] = None
    contribution_amount: Decimal = Decimal("0")
    in_kind_items: Optional[str] = None
    ticket_allocation: int = 0
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contract_no: Optional[str] = None
    notes: Optional[str] = None


class SponsorCreate(SponsorBase):
    schedule_id: int


class SponsorResponse(SponsorBase):
    id: int
    schedule_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class SeatTrendPoint(BaseModel):
    timestamp: datetime
    sold: int
    available: int
    reserved: int
    occupancy_rate: float


class SeatTrendResponse(BaseModel):
    schedule_id: int
    performance_name: str
    data: List[SeatTrendPoint]


class SignCodeComposition(BaseModel):
    code_type: str
    count: int
    percentage: float
    used_count: int
    used_percentage: float


class SignCodeCompositionResponse(BaseModel):
    schedule_id: int
    total_codes: int
    composition: List[SignCodeComposition]


class MetricDefinitionBase(BaseModel):
    metric_code: str
    metric_name: str
    category: Optional[str] = None
    definition: str
    calculation_formula: Optional[str] = None
    unit: Optional[str] = None
    data_source: Optional[str] = None
    refresh_frequency: Optional[str] = None


class MetricDefinitionResponse(MetricDefinitionBase):
    id: int
    version: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DataRefreshStatus(BaseModel):
    data_type: str
    last_refresh: Optional[datetime] = None
    status: str
    records_count: int


class DashboardOverview(BaseModel):
    last_refresh_time: datetime
    total_performances: int
    total_tickets_sold: int
    total_revenue: Decimal
    checkin_rate: float
    anomaly_count: int


class ShareViewRequest(BaseModel):
    view_name: str
    filters: Optional[Dict[str, Any]] = None
    allowed_role: RoleEnum
    expires_in_hours: int = 24


class ShareViewResponse(BaseModel):
    token: str
    view_name: str
    allowed_role: RoleEnum
    expires_at: datetime
    share_url: str
