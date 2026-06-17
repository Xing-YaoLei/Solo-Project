from datetime import datetime
from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict


class InventoryRecordType(str, Enum):
    IN = "in"
    OUT = "out"
    TRANSFER = "transfer"
    ADJUST = "adjust"


class InventoryRecordBase(BaseModel):
    batch_id: int = Field(..., description="批次ID")
    type: InventoryRecordType = Field(..., description="记录类型")
    quantity: float = Field(..., gt=0, description="数量")
    operator_id: Optional[int] = Field(default=None, description="操作人ID")
    operator: Optional[str] = Field(default=None, max_length=100, description="操作人")
    region: Optional[str] = Field(default=None, max_length=100, description="区域")
    remark: Optional[str] = Field(default=None, description="备注")


class InventoryRecordCreate(InventoryRecordBase):
    pass


class InventoryRecordQueryParams(BaseModel):
    batch_id: Optional[int] = Field(default=None, description="批次ID")
    type: Optional[InventoryRecordType] = Field(default=None, description="记录类型")
    region: Optional[str] = Field(default=None, max_length=100, description="区域")
    start_date: Optional[datetime] = Field(default=None, description="开始时间")
    end_date: Optional[datetime] = Field(default=None, description="结束时间")
    keyword: Optional[str] = Field(default=None, description="关键词搜索")
    page: int = Field(default=1, ge=1, description="页码")
    page_size: int = Field(default=10, ge=1, le=100, description="每页数量")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


class InventoryRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="记录ID")
    batch_id: int = Field(description="批次ID")
    type: InventoryRecordType = Field(description="记录类型")
    quantity: float = Field(description="数量")
    operator_id: Optional[int] = Field(description="操作人ID")
    operator: Optional[str] = Field(description="操作人")
    region: Optional[str] = Field(description="区域")
    remark: Optional[str] = Field(description="备注")
    created_at: datetime = Field(description="创建时间")
