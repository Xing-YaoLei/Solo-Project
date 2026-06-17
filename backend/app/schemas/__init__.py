from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime


class StoreBase(BaseModel):
    store_code: str
    store_name: str
    region: Optional[str] = None
    city: Optional[str] = None
    is_medical_insurance: bool = False


class StoreCreate(StoreBase):
    pass


class Store(StoreBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PromotionBase(BaseModel):
    promo_code: str
    promo_name: str
    store_id: int
    product_name: str
    product_sku: Optional[str] = None
    start_date: date
    end_date: date
    target_sales: float = 0.0
    target_units: int = 0
    discount_rate: float = 0.0
    promo_type: str = "normal"


class PromotionCreate(PromotionBase):
    pass


class Promotion(PromotionBase):
    id: int
    store: Optional[Store] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SalesRecordBase(BaseModel):
    sale_date: date
    promotion_id: int
    store_id: int
    sales_amount: float = 0.0
    sales_units: int = 0
    original_amount: float = 0.0
    member_sales_amount: float = 0.0
    member_sales_units: int = 0
    medical_insurance_amount: float = 0.0
    medical_insurance_units: int = 0
    cashier_delay_minutes: int = 0
    member_record_missing_count: int = 0
    medical_insurance_caliber_changed: bool = False
    data_version: str = "v1"


class SalesRecordCreate(SalesRecordBase):
    pass


class SalesRecord(SalesRecordBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DisplayInspectionBase(BaseModel):
    promotion_id: int
    store_id: int
    inspection_date: date
    is_qualified: bool
    position_score: int = 0
    pop_score: int = 0
    price_score: int = 0
    stock_score: int = 0
    overall_score: int = 0
    inspector: Optional[str] = None
    remark: Optional[str] = None


class DisplayInspectionCreate(DisplayInspectionBase):
    pass


class DisplayPhotoInfo(BaseModel):
    id: int
    file_path: str
    file_name: str
    upload_by: Optional[str] = None
    photo_type: str = "display"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DisplayInspection(DisplayInspectionBase):
    id: int
    photos: List[DisplayPhotoInfo] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RectificationBase(BaseModel):
    promotion_id: int
    inspection_id: Optional[int] = None
    issue_description: str
    require_rectification_date: date
    actual_rectification_date: Optional[date] = None
    rectification_status: str = "pending"
    rectification_remark: Optional[str] = None
    rectification_by: Optional[str] = None
    reviewer: Optional[str] = None


class RectificationCreate(RectificationBase):
    pass


class Rectification(RectificationBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ThresholdConfigBase(BaseModel):
    config_key: str
    config_name: str
    config_value: float
    config_unit: Optional[str] = None
    value_type: Optional[str] = "count"
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None


class ThresholdConfigCreate(ThresholdConfigBase):
    pass


class ThresholdConfigUpdate(BaseModel):
    config_value: float
    modified_by: str
    change_reason: Optional[str] = None


class ThresholdChangeLogInfo(BaseModel):
    id: int
    old_value: float
    new_value: float
    changed_by: str
    change_reason: Optional[str] = None
    changed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ThresholdConfig(ThresholdConfigBase):
    id: int
    current_modified_by: Optional[str] = None
    change_logs: List[ThresholdChangeLogInfo] = Field(default=[], alias="history")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class ExceptionAnnotationBase(BaseModel):
    promotion_id: int
    annotation_date: date
    exception_type: str
    exception_description: str
    impact_degree: str = "medium"
    review_note: Optional[str] = None
    review_by: Optional[str] = None
    created_by: Optional[str] = None


class ExceptionAnnotationCreate(ExceptionAnnotationBase):
    pass


class ExceptionAnnotation(ExceptionAnnotationBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RefreshLogInfo(BaseModel):
    id: int
    refresh_type: str
    triggered_by: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    records_processed: int = 0
    exceptions_found: Dict[str, Any] = {}
    status: str
    remark: Optional[str] = None

    class Config:
        from_attributes = True


class FunnelStageItem(BaseModel):
    stage: str
    stage_code: str
    value: float
    rate: float
    count: int


class FunnelData(BaseModel):
    promotion_id: int
    promo_code: str
    promo_name: str
    store_name: str
    stages: List[FunnelStageItem]
    target_achievement_rate: float
    actual_sales: float
    target_sales: float


class SalesTrendPoint(BaseModel):
    date: date
    sales_amount: float
    sales_units: int
    target_daily: float
    achievement_rate: float
    has_exception: bool = False
    exception_types: List[str] = []
    is_display_unqualified: bool = False


class SalesTrendData(BaseModel):
    promotion_id: int
    daily_data: List[SalesTrendPoint]
    total_sales: float
    total_target: float
    overall_achievement_rate: float


class DisplayImpactRange(BaseModel):
    start_date: date
    end_date: date
    impact_days: int
    estimated_loss_sales: float
    avg_score_during_period: int
    related_inspection_ids: List[int]


class QueryParams(BaseModel):
    promotion_id: Optional[int] = None
    store_id: Optional[int] = None
    region: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
