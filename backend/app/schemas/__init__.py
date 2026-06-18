from datetime import datetime, date
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from ..models import (
    StationStatus, WorkOrderStatus, PartShortageStatus, UserRole
)


class UserBase(BaseModel):
    username: str
    full_name: str
    role: UserRole = UserRole.TECHNICIAN


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class VehicleBase(BaseModel):
    plate_number: str
    vin: Optional[str] = None
    brand: str
    model: str
    year: Optional[int] = None
    color: Optional[str] = None
    mileage: Optional[Decimal] = None
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    mileage: Optional[Decimal] = None
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None


class VehicleResponse(VehicleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class StationBase(BaseModel):
    name: str
    type: Optional[str] = None
    status: StationStatus = StationStatus.IDLE


class StationCreate(StationBase):
    pass


class StationUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[StationStatus] = None


class StationResponse(StationBase):
    id: int
    current_work_order_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


class StationSchedule(StationResponse):
    current_work_order: Optional["WorkOrderResponse"] = None


class DiagnosticBase(BaseModel):
    work_order_id: int
    technician_id: Optional[int] = None
    symptom: Optional[str] = None
    fault_code: Optional[str] = None
    analysis: Optional[str] = None
    conclusion: Optional[str] = None


class DiagnosticCreate(DiagnosticBase):
    pass


class DiagnosticUpdate(BaseModel):
    symptom: Optional[str] = None
    fault_code: Optional[str] = None
    analysis: Optional[str] = None
    conclusion: Optional[str] = None


class DiagnosticResponse(DiagnosticBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class WorkOrderItemBase(BaseModel):
    work_order_id: int
    item_type: str
    name: str
    description: Optional[str] = None
    quantity: Decimal = Decimal("1")
    unit_price: Decimal = Decimal("0")
    part_id: Optional[int] = None
    status: str = "pending"


class WorkOrderItemCreate(WorkOrderItemBase):
    pass


class WorkOrderItemUpdate(BaseModel):
    item_type: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    part_id: Optional[int] = None
    status: Optional[str] = None


class WorkOrderItemResponse(WorkOrderItemBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class WorkOrderBase(BaseModel):
    vehicle_id: int
    station_id: Optional[int] = None
    technician_id: Optional[int] = None
    status: WorkOrderStatus = WorkOrderStatus.PENDING
    complaint: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None


class WorkOrderCreate(WorkOrderBase):
    pass


class WorkOrderUpdate(BaseModel):
    station_id: Optional[int] = None
    technician_id: Optional[int] = None
    status: Optional[WorkOrderStatus] = None
    complaint: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None


class WorkOrderResponse(WorkOrderBase):
    id: int
    order_no: str
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    is_rework: bool = False
    parent_order_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class WorkOrderDetailResponse(WorkOrderResponse):
    vehicle: Optional[VehicleResponse] = None
    station: Optional[StationResponse] = None
    technician: Optional[UserResponse] = None
    diagnostics: List[DiagnosticResponse] = []
    items: List[WorkOrderItemResponse] = []


class PartBase(BaseModel):
    sku: str
    name: str
    brand: Optional[str] = None
    specification: Optional[str] = None
    unit: str = "个"
    safety_stock: int = 0


class PartCreate(PartBase):
    pass


class PartUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    specification: Optional[str] = None
    unit: Optional[str] = None
    safety_stock: Optional[int] = None


class PartResponse(PartBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PartStockBase(BaseModel):
    part_id: int
    quantity: int = 0
    location: Optional[str] = None


class PartStockUpdate(BaseModel):
    quantity: Optional[int] = None
    location: Optional[str] = None


class PartStockResponse(PartStockBase):
    id: int
    last_updated: datetime
    model_config = ConfigDict(from_attributes=True)


class PartWithStockResponse(PartResponse):
    stock: Optional[PartStockResponse] = None


class StockChangeLogResponse(BaseModel):
    id: int
    part_id: int
    work_order_id: Optional[int] = None
    before_quantity: int
    after_quantity: int
    change_reason: Optional[str] = None
    operator_id: Optional[int] = None
    created_at: datetime
    part: Optional[PartResponse] = None
    model_config = ConfigDict(from_attributes=True)


class StockAdjustRequest(BaseModel):
    quantity: int
    change_reason: Optional[str] = None
    work_order_id: Optional[int] = None


class PartShortageBase(BaseModel):
    part_id: int
    work_order_id: Optional[int] = None
    required_quantity: int


class PartShortageCreate(PartShortageBase):
    pass


class PartShortageUpdate(BaseModel):
    status: Optional[PartShortageStatus] = None
    reason: Optional[str] = None
    action_taken: Optional[str] = None
    handler_id: Optional[int] = None
    closed_at: Optional[datetime] = None


class PartShortageResponse(PartShortageBase):
    id: int
    status: PartShortageStatus = PartShortageStatus.OPEN
    reason: Optional[str] = None
    action_taken: Optional[str] = None
    handler_id: Optional[int] = None
    reported_at: datetime
    closed_at: Optional[datetime] = None
    part: Optional[PartResponse] = None
    work_order: Optional[WorkOrderResponse] = None
    handler: Optional[UserResponse] = None
    model_config = ConfigDict(from_attributes=True)


class ReworkRecordResponse(BaseModel):
    id: int
    original_order_id: int
    rework_order_id: int
    reason: Optional[str] = None
    reported_by: Optional[int] = None
    created_at: datetime
    original_order: Optional[WorkOrderResponse] = None
    rework_order: Optional[WorkOrderResponse] = None
    model_config = ConfigDict(from_attributes=True)


class ReworkRateReport(BaseModel):
    month: str
    total_orders: int
    rework_orders: int
    rework_rate: float
    details: List[Dict] = []


class ReportDownloadRequest(BaseModel):
    report_type: str
    filter_criteria: dict


class ReportDownloadLogResponse(BaseModel):
    id: int
    report_type: str
    filter_criteria: dict
    generated_by: Optional[int] = None
    file_name: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
