from datetime import datetime, date
from typing import Optional, Any, Generic, TypeVar, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict

from ..models import RoleEnum, RecordStatusEnum, ExceptionTypeEnum, AuditActionEnum


T = TypeVar("T")


class Pagination(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class Message(BaseModel):
    message: str


class IdResponse(BaseModel):
    id: int


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: Optional[int] = None


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: Optional[EmailStr] = None
    full_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    role: RoleEnum = RoleEnum.TOURIST


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    role: Optional[RoleEnum] = None
    is_active: Optional[bool] = None


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChangePassword(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)


class GuideRouteBase(BaseModel):
    name: str = Field(..., max_length=200)
    code: str = Field(..., max_length=50)
    description: Optional[str] = None
    duration_minutes: int = 60
    distance_meters: float = 0
    cover_image: Optional[str] = None
    sort_order: int = 0


class GuideRouteCreate(GuideRouteBase):
    pass


class GuideRouteUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    distance_meters: Optional[float] = None
    cover_image: Optional[str] = None
    sort_order: Optional[int] = None
    status: Optional[RecordStatusEnum] = None


class GuideRouteResponse(GuideRouteBase):
    id: int
    status: RecordStatusEnum
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int]

    model_config = ConfigDict(from_attributes=True)


class HeatPointBase(BaseModel):
    route_id: int
    name: str = Field(..., max_length=200)
    code: Optional[str] = Field(None, max_length=50)
    latitude: float
    longitude: float
    radius_meters: float = 50
    description: Optional[str] = None
    sort_order: int = 0


class HeatPointCreate(HeatPointBase):
    pass


class HeatPointUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    code: Optional[str] = Field(None, max_length=50)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_meters: Optional[float] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    status: Optional[RecordStatusEnum] = None


class HeatPointResponse(HeatPointBase):
    id: int
    status: RecordStatusEnum
    verified_at: Optional[datetime] = None
    verified_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int]

    model_config = ConfigDict(from_attributes=True)


class GuideContentBase(BaseModel):
    route_id: int
    title: str = Field(..., max_length=300)
    content_type: str = "text"
    content_text: Optional[str] = None
    audio_url: Optional[str] = None
    video_url: Optional[str] = None
    language: str = "zh-CN"
    sort_order: int = 0


class GuideContentCreate(GuideContentBase):
    pass


class GuideContentUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=300)
    content_type: Optional[str] = None
    content_text: Optional[str] = None
    audio_url: Optional[str] = None
    video_url: Optional[str] = None
    language: Optional[str] = None
    sort_order: Optional[int] = None
    status: Optional[RecordStatusEnum] = None


class GuideContentResponse(GuideContentBase):
    id: int
    status: RecordStatusEnum
    verified_at: Optional[datetime] = None
    verified_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int]

    model_config = ConfigDict(from_attributes=True)


class PerformanceBase(BaseModel):
    name: str = Field(..., max_length=200)
    code: str = Field(..., max_length=50)
    venue: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    duration_minutes: int = 60


class PerformanceCreate(PerformanceBase):
    pass


class PerformanceUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    venue: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    duration_minutes: Optional[int] = None


class PerformanceResponse(PerformanceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int]

    model_config = ConfigDict(from_attributes=True)


class PerformanceSessionBase(BaseModel):
    performance_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    total_seats: int = 0


class PerformanceSessionCreate(PerformanceSessionBase):
    pass


class PerformanceSessionUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    total_seats: Optional[int] = None
    status: Optional[RecordStatusEnum] = None


class PerformanceSessionResponse(PerformanceSessionBase):
    id: int
    status: RecordStatusEnum
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int]

    model_config = ConfigDict(from_attributes=True)


class SeatBase(BaseModel):
    session_id: int
    row: str = Field(..., max_length=10)
    number: str = Field(..., max_length=10)
    zone: Optional[str] = Field(None, max_length=50)
    price: float = 0


class SeatCreate(SeatBase):
    pass


class SeatUpdate(BaseModel):
    zone: Optional[str] = Field(None, max_length=50)
    price: Optional[float] = None
    is_available: Optional[bool] = None
    is_verified: Optional[bool] = None


class SeatResponse(SeatBase):
    id: int
    is_available: bool
    is_verified: bool
    verified_at: Optional[datetime] = None
    verified_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SeatBatchCreate(BaseModel):
    session_id: int
    rows: List[str] = Field(..., min_length=1)
    numbers_per_row: int = Field(..., ge=1)
    zone: Optional[str] = None
    price: float = 0


class MerchantBase(BaseModel):
    name: str = Field(..., max_length=200)
    contact_name: Optional[str] = Field(None, max_length=100)
    contact_phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=300)
    category: Optional[str] = Field(None, max_length=50)


class MerchantCreate(MerchantBase):
    pass


class MerchantUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    contact_name: Optional[str] = Field(None, max_length=100)
    contact_phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=300)
    category: Optional[str] = Field(None, max_length=50)


class MerchantResponse(MerchantBase):
    id: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int]

    model_config = ConfigDict(from_attributes=True)


class MerchantContractBase(BaseModel):
    merchant_id: int
    contract_no: str = Field(..., max_length=100)
    title: str = Field(..., max_length=300)
    start_date: date
    end_date: Optional[date] = None
    amount: float = 0
    content: Optional[str] = None


class MerchantContractCreate(MerchantContractBase):
    pass


class MerchantContractUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=300)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    amount: Optional[float] = None
    content: Optional[str] = None
    status: Optional[RecordStatusEnum] = None


class MerchantContractResponse(MerchantContractBase):
    id: int
    status: RecordStatusEnum
    verified_at: Optional[datetime] = None
    verified_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int]

    model_config = ConfigDict(from_attributes=True)


class TicketBase(BaseModel):
    ticket_no: str = Field(..., max_length=100)
    route_id: Optional[int] = None
    seat_id: Optional[int] = None
    owner_id: Optional[int] = None
    buyer_name: Optional[str] = Field(None, max_length=100)
    buyer_phone: Optional[str] = Field(None, max_length=20)
    ticket_type: str = "adult"
    price: float = 0


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    buyer_name: Optional[str] = Field(None, max_length=100)
    buyer_phone: Optional[str] = Field(None, max_length=20)
    status: Optional[RecordStatusEnum] = None


class TicketResponse(TicketBase):
    id: int
    sold_at: Optional[datetime] = None
    sold_by: Optional[int] = None
    used_at: Optional[datetime] = None
    status: RecordStatusEnum
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SecondarySaleBase(BaseModel):
    ticket_id: int
    ticket_no: Optional[str] = Field(None, max_length=100)
    item_name: str = Field(..., max_length=200)
    item_category: Optional[str] = Field(None, max_length=50)
    quantity: int = 1
    unit_price: float = 0
    total_amount: Optional[float] = None
    sale_channel: Optional[str] = Field(None, max_length=50)


class SecondarySaleCreate(SecondarySaleBase):
    pass


class SecondarySaleUpdate(BaseModel):
    item_name: Optional[str] = Field(None, max_length=200)
    item_category: Optional[str] = Field(None, max_length=50)
    quantity: Optional[int] = None
    unit_price: Optional[float] = None
    total_amount: Optional[float] = None


class SecondarySaleResponse(SecondarySaleBase):
    id: int
    salesperson_id: Optional[int] = None
    sold_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExceptionRecordBase(BaseModel):
    exception_type: ExceptionTypeEnum
    related_type: Optional[str] = Field(None, max_length=50)
    related_id: Optional[int] = None
    title: str = Field(..., max_length=300)
    description: Optional[str] = None
    root_cause: Optional[str] = None
    resolution: Optional[str] = None
    original_record_type: Optional[str] = Field(None, max_length=50)
    original_record_id: Optional[int] = None
    occurred_at: Optional[datetime] = None


class ExceptionRecordCreate(ExceptionRecordBase):
    pass


class ExceptionRecordUpdate(BaseModel):
    description: Optional[str] = None
    root_cause: Optional[str] = None
    resolution: Optional[str] = None
    status: Optional[RecordStatusEnum] = None
    handled_by: Optional[int] = None
    resolved_at: Optional[datetime] = None


class ExceptionRecordResponse(ExceptionRecordBase):
    id: int
    status: RecordStatusEnum
    handled_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int]

    model_config = ConfigDict(from_attributes=True)


class AttachmentResponse(BaseModel):
    id: int
    record_type: str
    record_id: int
    file_name: str
    original_name: Optional[str] = None
    file_path: str
    file_size: int
    mime_type: Optional[str] = None
    uploaded_by: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: AuditActionEnum
    record_type: Optional[str] = None
    record_id: Optional[int] = None
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    batch_ids: Optional[List[int]] = None
    remarks: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BatchUpdateRequest(BaseModel):
    ids: List[int] = Field(..., min_length=1)
    updates: dict = Field(..., min_length=1)
    remarks: Optional[str] = None


class StatisticsQuery(BaseModel):
    start_date: date
    end_date: date
    group_by: str = "day"


class TicketStatistics(BaseModel):
    date: str
    total_tickets: int
    total_revenue: float
    used_tickets: int
    utilization_rate: float


class SecondarySaleStatistics(BaseModel):
    ticket_no: str
    ticket_id: int
    buyer_name: Optional[str]
    route_name: Optional[str]
    secondary_count: int
    secondary_total: float
    items: List[dict]


class DailyConversion(BaseModel):
    date: str
    ticket_count: int
    secondary_conversion_rate: float
    secondary_per_ticket: float
    total_revenue: float
