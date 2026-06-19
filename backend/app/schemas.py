from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional, List, Any


class VehicleBase(BaseModel):
    plate_number: str
    vin: Optional[str] = None
    brand: str
    model: str
    year: Optional[int] = None
    color: Optional[str] = None
    mileage: Optional[float] = 0
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None


class VehicleCreate(VehicleBase):
    pass


class Vehicle(VehicleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    repair_count: int = 0
    total_amount: float = 0
    last_repair_date: Optional[date] = None
    warning_level: str = "normal"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class QuotationBase(BaseModel):
    quotation_no: str
    vehicle_id: int
    vehicle_plate: Optional[str] = None
    status: str = "draft"
    total_amount: float = 0
    parts_amount: float = 0
    labor_amount: float = 0
    discount_amount: float = 0
    insurance_covered: bool = False
    insurance_claim_no: Optional[str] = None
    parts: Optional[List[Any]] = []
    labor_items: Optional[List[Any]] = []
    created_by: Optional[str] = None
    salesperson: Optional[str] = None


class QuotationCreate(QuotationBase):
    pass


class Quotation(QuotationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    converted_at: Optional[datetime] = None


class RepairOrderBase(BaseModel):
    order_no: str
    quotation_id: Optional[int] = None
    vehicle_id: int
    vehicle_plate: Optional[str] = None
    status: str = "pending"
    is_rework: bool = False
    rework_reason: Optional[str] = None
    parent_order_id: Optional[int] = None
    total_amount: float = 0
    actual_amount: float = 0
    mechanic: Optional[str] = None
    quality_inspector: Optional[str] = None
    fault_description: Optional[str] = None
    repair_content: Optional[str] = None
    has_stockout: bool = False
    stockout_parts: Optional[List[Any]] = []
    cashier_no: Optional[str] = None
    cashier_amount: float = 0


class RepairOrderCreate(RepairOrderBase):
    pass


class RepairOrder(RepairOrderBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    quality_check_time: Optional[datetime] = None
    delivery_time: Optional[datetime] = None
    cashier_time: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class InspectionPhotoBase(BaseModel):
    quotation_id: Optional[int] = None
    repair_order_id: Optional[int] = None
    photo_type: Optional[str] = None
    photo_url: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    uploader: Optional[str] = None
    is_quality_issue: bool = False
    issue_notes: Optional[str] = None


class InspectionPhotoCreate(InspectionPhotoBase):
    pass


class InspectionPhoto(InspectionPhotoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None


class StockTaskBase(BaseModel):
    task_no: str
    repair_order_id: Optional[int] = None
    order_no: Optional[str] = None
    part_code: str
    part_name: str
    required_qty: int = 1
    status: str = "open"
    priority: str = "normal"
    notes: Optional[str] = None
    resolution: Optional[str] = None
    resolved_by: Optional[str] = None
    assigned_to: Optional[str] = None
    created_by: Optional[str] = None


class StockTaskCreate(StockTaskBase):
    pass


class StockTaskUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    resolution: Optional[str] = None
    assigned_to: Optional[str] = None


class StockTask(StockTaskBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    resolved_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class WarningThresholdBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    category: str = "vehicle"
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    current_value: float
    unit: Optional[str] = None
    enabled: bool = True


class WarningThresholdCreate(WarningThresholdBase):
    pass


class WarningThresholdUpdate(BaseModel):
    current_value: float
    updated_by: str
    change_reason: Optional[str] = None


class WarningThreshold(WarningThresholdBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    updated_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class WarningChangeLog(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    threshold_id: int
    threshold_name: Optional[str] = None
    old_value: Optional[float] = None
    new_value: Optional[float] = None
    changed_by: str
    change_reason: Optional[str] = None
    changed_at: Optional[datetime] = None


class InsuranceMaterialBase(BaseModel):
    claim_no: str
    quotation_id: Optional[int] = None
    insurance_company: Optional[str] = None
    policy_no: Optional[str] = None
    claim_type: Optional[str] = None
    coverage_amount: float = 0
    approved_amount: float = 0
    materials: Optional[List[Any]] = []
    review_status: str = "pending"
    reviewer: Optional[str] = None


class InsuranceMaterial(InsuranceMaterialBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None


class CashierTransactionBase(BaseModel):
    transaction_no: str
    repair_order_id: Optional[int] = None
    order_no: Optional[str] = None
    vehicle_plate: Optional[str] = None
    total_amount: float = 0
    paid_amount: float = 0
    discount_amount: float = 0
    payment_method: Optional[str] = None
    insurance_paid: float = 0
    self_paid: float = 0
    cashier: Optional[str] = None
    notes: Optional[str] = None


class CashierTransaction(CashierTransactionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    transaction_time: Optional[datetime] = None


class FunnelStage(BaseModel):
    stage: str
    count: int
    amount: float
    conversion_rate: Optional[float] = None


class FunnelData(BaseModel):
    date_range: dict
    stages: List[FunnelStage]
    total_quotations: int
    total_converted: int
    overall_conversion_rate: float


class ReworkStats(BaseModel):
    total_orders: int
    rework_orders: int
    rework_rate: float
    rework_amount: float
    by_mechanic: List[dict]
    by_reason: List[dict]
    by_month: List[dict]


class VehicleWarning(BaseModel):
    vehicle: Vehicle
    warning_items: List[dict]
