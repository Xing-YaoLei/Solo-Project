from typing import Optional
from pydantic import BaseModel, Field


class SeatData(BaseModel):
    seatId: str = Field(description="座位ID")
    row: str = Field(description="排号")
    col: int = Field(description="列号")
    area: str = Field(description="区域")
    status: str = Field(description="状态: available/sold/reserved/used")
    price: float = Field(description="价格")
    orderId: Optional[str] = Field(default=None, description="订单ID")


class AreaData(BaseModel):
    areaId: str = Field(description="区域ID")
    areaName: str = Field(description="区域名称")
    totalSeats: int = Field(description="总座位数")
    soldSeats: int = Field(description="已售座位数")
    avgPrice: float = Field(description="均价")
    revenue: float = Field(description="收入")
