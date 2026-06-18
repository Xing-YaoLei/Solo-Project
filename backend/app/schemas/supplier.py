from typing import Optional
from pydantic import BaseModel, Field


class SupplierCreate(BaseModel):
    name: str = Field(..., description="供应商名称")
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    credit_rating: str = "B"
    on_time_rate: float = 0.9
    quality_score: float = 85.0
    status: str = "active"


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    credit_rating: Optional[str] = None
    on_time_rate: Optional[float] = None
    quality_score: Optional[float] = None
    status: Optional[str] = None


class SupplierResponse(BaseModel):
    id: str
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    credit_rating: str
    on_time_rate: float
    quality_score: float
    status: str

    model_config = {"from_attributes": True}
