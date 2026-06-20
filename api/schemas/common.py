from typing import Generic, TypeVar, Optional, List
from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    code: int = Field(default=200, description="响应码")
    message: str = Field(default="success", description="响应消息")
    data: Optional[T] = Field(default=None, description="响应数据")


class KPIData(BaseModel):
    id: str = Field(description="KPI ID")
    name: str = Field(description="指标名称")
    value: float = Field(description="指标值")
    unit: str = Field(default="", description="单位")
    trend: str = Field(description="趋势: up/down/stable")
    changePercent: float = Field(description="变化百分比")
    yoyChange: float = Field(description="同比变化")
    momChange: float = Field(description="环比变化")


class TrendDataPoint(BaseModel):
    date: str = Field(description="日期")
    value: float = Field(description="数值")
    seriesName: str = Field(description="系列名称")


class SponsorshipRight(BaseModel):
    id: str = Field(description="权益ID")
    name: str = Field(description="权益名称")
    sponsor: str = Field(description="赞助商")
    totalQuantity: int = Field(description="总数量")
    usedQuantity: int = Field(description="已使用数量")
    usageRate: float = Field(description="使用率")
    category: str = Field(description="分类")
