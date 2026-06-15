from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class CaliberVersionCreate(BaseModel):
    version: str = Field(..., description="版本号, 如 v1.0")
    effectiveDate: date = Field(..., description="生效日期")
    formula: str = Field(..., description="计算公式")
    description: str = Field(..., description="描述")
    changeReason: str = Field(..., description="变更原因")


class CaliberVersion(BaseModel):
    version: str
    effectiveDate: date
    formula: str
    description: str
    changeReason: str
    isActive: bool
    createdAt: datetime

    class Config:
        from_attributes = True
