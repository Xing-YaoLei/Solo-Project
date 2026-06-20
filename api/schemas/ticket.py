from typing import List, Optional
from pydantic import BaseModel, Field


class TicketType(BaseModel):
    id: str = Field(description="票种ID")
    name: str = Field(description="票种名称")
    price: float = Field(description="价格")
    benefits: List[str] = Field(default_factory=list, description="包含权益")
    salesVolume: int = Field(description="销量")
    revenue: float = Field(description="收入")
    verificationRate: float = Field(description="核销率")


class OrderData(BaseModel):
    orderId: str = Field(description="订单ID")
    ticketTypeId: str = Field(description="票种ID")
    ticketTypeName: str = Field(description="票种名称")
    buyerName: str = Field(description="购票人姓名")
    buyerPhone: str = Field(description="购票人电话")
    amount: float = Field(description="金额")
    status: str = Field(description="订单状态")
    createTime: str = Field(description="创建时间")
    verifyTime: Optional[str] = Field(default=None, description="核销时间")
    seatId: Optional[str] = Field(default=None, description="座位ID")
    checkInCode: Optional[str] = Field(default=None, description="签到码")
