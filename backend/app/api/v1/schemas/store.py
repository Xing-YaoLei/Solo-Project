from __future__ import annotations

from typing import Optional
from datetime import datetime, date
import uuid
from pydantic import BaseModel, Field, ConfigDict

from app.db.models import TurnoverStage, RiskLevel


class StoreBase(BaseModel):
    name: str = Field(max_length=128, description="门店名称")
    code: str = Field(max_length=32, description="门店编码")
    region: str = Field(max_length=64, description="所属区域")
    address: str = Field(description="详细地址")
    lng: Optional[float] = Field(default=None, description="经度")
    lat: Optional[float] = Field(default=None, description="纬度")


class StoreCreate(StoreBase):
    pass


class StoreUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=128)
    code: Optional[str] = Field(default=None, max_length=32)
    region: Optional[str] = Field(default=None, max_length=64)
    address: Optional[str] = None
    lng: Optional[float] = None
    lat: Optional[float] = None


class StoreRead(StoreBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    risk_score: int = Field(default=0, ge=0, le=100, description="风险评分")
    in_stock_count: int = Field(default=0, ge=0, description="在库车辆数")
    alert_count: int = Field(default=0, ge=0, description="预警车辆数")


class VehicleBase(BaseModel):
    vin: str = Field(max_length=17, description="车架号")
    plate_number: Optional[str] = Field(default=None, max_length=16, description="车牌号")
    brand: str = Field(max_length=64, description="品牌")
    model: str = Field(max_length=128, description="型号")
    year: int = Field(gt=1990, lt=2100, description="年款")
    mileage: int = Field(ge=0, description="里程(公里)")
    store_id: uuid.UUID
    inbound_date: date
    stage: TurnoverStage = Field(default=TurnoverStage.INBOUND)
    document_completion: int = Field(default=0, ge=0, le=100, description="材料完成度")
    risk_level: RiskLevel = Field(default=RiskLevel.LOW)


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    plate_number: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    mileage: Optional[int] = None
    store_id: Optional[uuid.UUID] = None
    inbound_date: Optional[date] = None
    stage: Optional[TurnoverStage] = None
    document_completion: Optional[int] = None
    risk_level: Optional[RiskLevel] = None


class VehicleRead(VehicleBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    stock_days: int = Field(ge=0, description="库龄(天)")
    created_at: datetime
    updated_at: datetime
