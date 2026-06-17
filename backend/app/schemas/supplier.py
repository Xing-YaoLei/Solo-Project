from datetime import datetime
from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict, EmailStr


class CreditRating(str, Enum):
    A = "A"
    B = "B"
    C = "C"


class SupplierStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class SupplierBase(BaseModel):
    name: str = Field(..., max_length=200, description="供应商名称")
    contact_person: Optional[str] = Field(default=None, max_length=50, description="联系人")
    phone: Optional[str] = Field(default=None, max_length=20, description="电话")
    email: Optional[EmailStr] = Field(default=None, max_length=100, description="邮箱")
    address: Optional[str] = Field(default=None, max_length=500, description="地址")
    credit_rating: CreditRating = Field(default=CreditRating.B, description="信用评级")
    on_time_rate: float = Field(default=0.0, ge=0.0, le=1.0, description="准时率")
    quality_score: float = Field(default=0.0, ge=0.0, le=100.0, description="质量评分")
    status: SupplierStatus = Field(default=SupplierStatus.ACTIVE, description="状态")


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=200, description="供应商名称")
    contact_person: Optional[str] = Field(default=None, max_length=50, description="联系人")
    phone: Optional[str] = Field(default=None, max_length=20, description="电话")
    email: Optional[EmailStr] = Field(default=None, max_length=100, description="邮箱")
    address: Optional[str] = Field(default=None, max_length=500, description="地址")
    credit_rating: Optional[CreditRating] = Field(default=None, description="信用评级")
    on_time_rate: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="准时率")
    quality_score: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="质量评分")
    status: Optional[SupplierStatus] = Field(default=None, description="状态")


class SupplierQueryParams(BaseModel):
    keyword: Optional[str] = Field(default=None, description="关键词搜索")
    status: Optional[SupplierStatus] = Field(default=None, description="状态筛选")
    credit_rating: Optional[CreditRating] = Field(default=None, description="信用评级筛选")


class SupplierResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="供应商ID")
    name: str = Field(description="供应商名称")
    contact_person: Optional[str] = Field(description="联系人")
    phone: Optional[str] = Field(description="电话")
    email: Optional[str] = Field(description="邮箱")
    address: Optional[str] = Field(description="地址")
    credit_rating: CreditRating = Field(description="信用评级")
    on_time_rate: float = Field(description="准时率")
    quality_score: float = Field(description="质量评分")
    status: SupplierStatus = Field(description="状态")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="更新时间")
