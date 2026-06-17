from datetime import datetime, date
from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict


class ShortagePriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ShortageOrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUPPLEMENTED = "supplemented"
    RETRIED = "retried"
    CLOSED = "closed"


class ShortageActionType(str, Enum):
    SUPPLEMENT = "supplement"
    RETRY = "retry"
    CLOSE = "close"


class ShortageOrderBase(BaseModel):
    batch_id: int = Field(..., description="批次ID")
    material_name: str = Field(..., max_length=200, description="物料名称")
    shortage_quantity: float = Field(..., gt=0, description="短缺数量")
    unit: Optional[str] = Field(default=None, max_length=20, description="单位")
    responsible_person: Optional[str] = Field(default=None, max_length=100, description="负责人")
    priority: ShortagePriority = Field(default=ShortagePriority.MEDIUM, description="优先级")
    status: ShortageOrderStatus = Field(default=ShortageOrderStatus.PENDING, description="状态")
    deadline: Optional[date] = Field(default=None, description="截止日期")


class ShortageOrderCreate(ShortageOrderBase):
    pass


class ShortageOrderUpdate(BaseModel):
    material_name: Optional[str] = Field(default=None, max_length=200, description="物料名称")
    shortage_quantity: Optional[float] = Field(default=None, gt=0, description="短缺数量")
    unit: Optional[str] = Field(default=None, max_length=20, description="单位")
    responsible_person: Optional[str] = Field(default=None, max_length=100, description="负责人")
    priority: Optional[ShortagePriority] = Field(default=None, description="优先级")
    status: Optional[ShortageOrderStatus] = Field(default=None, description="状态")
    deadline: Optional[date] = Field(default=None, description="截止日期")


class ShortageOrderQueryParams(BaseModel):
    status: Optional[ShortageOrderStatus] = Field(default=None, description="状态筛选")
    priority: Optional[ShortagePriority] = Field(default=None, description="优先级筛选")
    responsible_person: Optional[str] = Field(default=None, max_length=100, description="负责人筛选")
    start_date: Optional[date] = Field(default=None, description="开始日期")
    end_date: Optional[date] = Field(default=None, description="结束日期")
    keyword: Optional[str] = Field(default=None, description="关键词搜索")
    page: int = Field(default=1, ge=1, description="页码")
    page_size: int = Field(default=10, ge=1, le=100, description="每页数量")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


class ShortageActionRequest(BaseModel):
    action: ShortageActionType = Field(..., description="操作类型")
    remark: Optional[str] = Field(default=None, description="操作备注")
    supplement_quantity: Optional[float] = Field(default=None, gt=0, description="补货数量")


class ShortageOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="工单ID")
    batch_id: int = Field(description="批次ID")
    material_name: str = Field(description="物料名称")
    shortage_quantity: float = Field(description="短缺数量")
    unit: Optional[str] = Field(description="单位")
    responsible_person: Optional[str] = Field(description="负责人")
    priority: ShortagePriority = Field(description="优先级")
    status: ShortageOrderStatus = Field(description="状态")
    deadline: Optional[date] = Field(description="截止日期")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="更新时间")
