from pydantic import BaseModel, Field
from typing import Generic, TypeVar, Optional, List, Dict, Any
from datetime import date, datetime

T = TypeVar('T')


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    keyword: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class AmountValidationRequest(BaseModel):
    contract_id: int
    bill_id: Optional[int] = None
    expected_amount: float
    actual_amount: float
    description: Optional[str] = None


class AmountValidationResult(BaseModel):
    is_valid: bool
    diff_amount: float
    diff_percentage: float
    threshold: float
    needs_exception: bool
    message: str


class ExportRequest(BaseModel):
    export_type: str
    export_name: str
    filter_conditions: Optional[Dict[str, Any]] = None
    data_caliber: Optional[str] = None
    include_caliber: bool = True
