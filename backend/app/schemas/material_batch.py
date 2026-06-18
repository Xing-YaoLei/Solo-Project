from typing import Optional, List, Generic, TypeVar
from datetime import date, datetime
from pydantic import BaseModel, Field

T = TypeVar("T")


class MaterialBatchCreate(BaseModel):
    batch_no: str = Field(..., description="批次号")
    material_name: str = Field(..., description="材料名称")
    category: Optional[str] = None
    specification: Optional[str] = None
    unit: Optional[str] = None
    quantity: float = 0.0
    supplier_id: Optional[str] = None
    supplier_name: Optional[str] = None
    region: Optional[str] = None
    responsible_person: Optional[str] = None
    status: str = "pending"
    in_date: Optional[date] = None
    expected_turnover_days: int = 30
    actual_turnover_days: Optional[int] = None
    remark: Optional[str] = None


class MaterialBatchUpdate(BaseModel):
    batch_no: Optional[str] = None
    material_name: Optional[str] = None
    category: Optional[str] = None
    specification: Optional[str] = None
    unit: Optional[str] = None
    quantity: Optional[float] = None
    supplier_id: Optional[str] = None
    supplier_name: Optional[str] = None
    region: Optional[str] = None
    responsible_person: Optional[str] = None
    status: Optional[str] = None
    in_date: Optional[date] = None
    expected_turnover_days: Optional[int] = None
    actual_turnover_days: Optional[int] = None
    remark: Optional[str] = None


class MaterialBatchResponse(BaseModel):
    id: str
    batch_no: str
    material_name: str
    category: Optional[str] = None
    specification: Optional[str] = None
    unit: Optional[str] = None
    quantity: float
    supplier_id: Optional[str] = None
    supplier_name: Optional[str] = None
    region: Optional[str] = None
    responsible_person: Optional[str] = None
    status: str
    in_date: Optional[date] = None
    expected_turnover_days: int
    actual_turnover_days: Optional[int] = None
    remark: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MaterialBatchQueryParams(BaseModel):
    page: int = 1
    page_size: int = 10
    sort_by: str = "created_at"
    sort_order: str = "desc"
    statuses: List[str] = Field(default_factory=list)
    date_start: Optional[str] = None
    date_end: Optional[str] = None
    regions: List[str] = Field(default_factory=list)
    responsible_persons: List[str] = Field(default_factory=list)
    categories: List[str] = Field(default_factory=list)
    keyword: Optional[str] = None


class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    total: int
    page: int
    page_size: int
