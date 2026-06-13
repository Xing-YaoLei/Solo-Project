from datetime import datetime, date
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field

from app.models import (
    RoleEnum, ReplenishmentStatus, TemperatureAlertStatus, DiscrepancyType
)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


class UserBase(BaseModel):
    username: str
    full_name: str
    role: RoleEnum
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[RoleEnum] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class StoreBase(BaseModel):
    code: str
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None


class StoreCreate(StoreBase):
    pass


class StoreResponse(StoreBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    sku: str
    name: str
    category: Optional[str] = None
    unit: str = "箱"
    min_temp: float = 0.0
    max_temp: float = 8.0


class ProductCreate(ProductBase):
    pass


class ProductResponse(ProductBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


class ReplenishmentItemBase(BaseModel):
    product_id: int
    planned_qty: float
    loaded_qty: Optional[float] = 0.0
    received_qty: Optional[float] = 0.0
    unit_price: Optional[float] = None
    remark: Optional[str] = None


class ReplenishmentItemCreate(ReplenishmentItemBase):
    pass


class ReplenishmentItemUpdate(BaseModel):
    product_id: Optional[int] = None
    planned_qty: Optional[float] = None
    loaded_qty: Optional[float] = None
    received_qty: Optional[float] = None
    unit_price: Optional[float] = None
    remark: Optional[str] = None


class ReplenishmentItemResponse(ReplenishmentItemBase):
    id: int
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


class BatchCodeBase(BaseModel):
    product_id: int
    batch_no: str
    qty: float
    production_date: Optional[date] = None
    expiry_date: Optional[date] = None
    verified: bool = False


class BatchCodeCreate(BatchCodeBase):
    pass


class BatchCodeUpdate(BaseModel):
    batch_no: Optional[str] = None
    qty: Optional[float] = None
    production_date: Optional[date] = None
    expiry_date: Optional[date] = None
    verified: Optional[bool] = None


class BatchCodeResponse(BatchCodeBase):
    id: int
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


class QCImageBase(BaseModel):
    file_path: str
    file_name: Optional[str] = None
    file_size: Optional[int] = None


class QCImageCreate(QCImageBase):
    pass


class QCImageResponse(QCImageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class QCRecordBase(BaseModel):
    product_id: int
    batch_code_id: Optional[int] = None
    temperature: Optional[float] = None
    appearance_ok: bool = True
    packaging_ok: bool = True
    temperature_ok: bool = True
    passed: bool = True
    remark: Optional[str] = None


class QCRecordCreate(QCRecordBase):
    images: Optional[List[QCImageCreate]] = []


class QCRecordUpdate(BaseModel):
    temperature: Optional[float] = None
    appearance_ok: Optional[bool] = None
    packaging_ok: Optional[bool] = None
    temperature_ok: Optional[bool] = None
    passed: Optional[bool] = None
    remark: Optional[str] = None


class QCRecordResponse(QCRecordBase):
    id: int
    order_id: int
    checked_by: int
    checked_at: datetime
    images: List[QCImageResponse] = []

    class Config:
        from_attributes = True


class DiscrepancyBase(BaseModel):
    product_id: int
    type: DiscrepancyType
    expected_qty: Optional[float] = None
    actual_qty: Optional[float] = None
    diff_qty: Optional[float] = None
    description: Optional[str] = None


class DiscrepancyCreate(DiscrepancyBase):
    pass


class DiscrepancyResolve(BaseModel):
    resolution_note: str


class DiscrepancyResponse(DiscrepancyBase):
    id: int
    order_id: int
    reported_by: int
    reported_at: datetime
    resolved: bool = False
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    resolution_note: Optional[str] = None
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


class TemperatureRecordBase(BaseModel):
    temperature: float
    min_temp: Optional[float] = None
    max_temp: Optional[float] = None
    is_out_of_range: bool = False
    location: Optional[str] = None
    device_id: Optional[str] = None


class TemperatureRecordCreate(TemperatureRecordBase):
    recorded_at: Optional[datetime] = None


class TemperatureRecordResponse(TemperatureRecordBase):
    id: int
    order_id: int
    recorded_at: datetime

    class Config:
        from_attributes = True


class AlertHistoryBase(BaseModel):
    action: str
    note: Optional[str] = None


class AlertHistoryResponse(AlertHistoryBase):
    id: int
    alert_id: int
    from_status: Optional[TemperatureAlertStatus] = None
    to_status: TemperatureAlertStatus
    operator_id: Optional[int] = None
    created_at: datetime
    operator: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class TemperatureAlertBase(BaseModel):
    alert_type: str = "temperature_breach"
    severity: str = "warning"
    min_temp: Optional[float] = None
    max_temp: Optional[float] = None
    actual_temp: Optional[float] = None
    duration_minutes: int = 0
    source_type: str = "auto"
    source_ref: Optional[str] = None
    description: Optional[str] = None


class TemperatureAlertCreate(TemperatureAlertBase):
    order_id: int
    trigger_record_id: Optional[int] = None


class TemperatureAlertUpdate(BaseModel):
    status: Optional[TemperatureAlertStatus] = None
    description: Optional[str] = None
    resolution: Optional[str] = None


class TemperatureAlertAck(BaseModel):
    note: Optional[str] = None


class TemperatureAlertResponse(TemperatureAlertBase):
    id: int
    order_id: int
    trigger_record_id: Optional[int] = None
    status: TemperatureAlertStatus
    acknowledged_at: Optional[datetime] = None
    handled_by: Optional[int] = None
    handled_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    history: List[AlertHistoryResponse] = []
    trigger_record: Optional[TemperatureRecordResponse] = None
    handler: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class AttachmentBase(BaseModel):
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    category: Optional[str] = None


class AttachmentCreate(AttachmentBase):
    file_path: str


class AttachmentResponse(AttachmentBase):
    id: int
    order_id: int
    file_path: str
    uploaded_by: Optional[int] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ActionLogResponse(BaseModel):
    id: int
    order_id: int
    user_id: int
    action: str
    detail: Optional[Dict[str, Any]] = None
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class ReplenishmentOrderBase(BaseModel):
    store_id: int
    planned_date: date
    truck_no: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    loading_list_no: Optional[str] = None
    remark: Optional[str] = None


class ReplenishmentOrderCreate(ReplenishmentOrderBase):
    items: List[ReplenishmentItemCreate] = []


class ReplenishmentOrderUpdate(BaseModel):
    store_id: Optional[int] = None
    planned_date: Optional[date] = None
    truck_no: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    loading_list_no: Optional[str] = None
    remark: Optional[str] = None
    status: Optional[ReplenishmentStatus] = None


class ReplenishmentOrderTransition(BaseModel):
    target_status: ReplenishmentStatus
    remark: Optional[str] = None


class BatchOperationRequest(BaseModel):
    order_ids: List[int]
    target_status: Optional[ReplenishmentStatus] = None
    remark: Optional[str] = None


class ReplenishmentOrderResponse(ReplenishmentOrderBase):
    id: int
    order_no: str
    status: ReplenishmentStatus
    loading_time: Optional[datetime] = None
    departure_time: Optional[datetime] = None
    arrival_time: Optional[datetime] = None
    created_by: int
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    items: List[ReplenishmentItemResponse] = []
    batches: List[BatchCodeResponse] = []
    qc_records: List[QCRecordResponse] = []
    discrepancies: List[DiscrepancyResponse] = []
    temperature_records: List[TemperatureRecordResponse] = []
    alerts: List[TemperatureAlertResponse] = []
    attachments: List[AttachmentResponse] = []
    logs: List[ActionLogResponse] = []
    store: Optional[StoreResponse] = None
    creator: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class ReplenishmentOrderListResponse(BaseModel):
    id: int
    order_no: str
    store_id: int
    store_name: Optional[str] = None
    status: ReplenishmentStatus
    planned_date: date
    truck_no: Optional[str] = None
    driver_name: Optional[str] = None
    loading_list_no: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    has_alerts: bool = False
    has_discrepancies: bool = False

    class Config:
        from_attributes = True


class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[Any]


class StatsTemperatureRate(BaseModel):
    date: date
    total_orders: int
    qualified_orders: int
    rate: float


class StatsTemperatureDrillDown(BaseModel):
    order_id: int
    order_no: str
    store_name: str
    max_temp: Optional[float]
    min_temp: Optional[float]
    alert_count: int
    status: ReplenishmentStatus
