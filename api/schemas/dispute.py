from typing import Optional
from pydantic import BaseModel, Field


class PaymentRecord(BaseModel):
    transactionId: str = Field(description="交易ID")
    amount: float = Field(description="金额")
    payTime: str = Field(description="支付时间")
    payMethod: str = Field(description="支付方式")
    status: str = Field(description="状态")


class CheckInRecord(BaseModel):
    checkInCode: str = Field(description="签到码")
    scanTime: str = Field(description="扫码时间")
    scanner: str = Field(description="扫码人")
    location: str = Field(description="地点")
    status: str = Field(description="状态")


class GateRecord(BaseModel):
    recordId: str = Field(description="记录ID")
    gateCode: str = Field(description="闸机编号")
    passTime: str = Field(description="通过时间")
    direction: str = Field(description="方向: in/out")
    deviceId: str = Field(description="设备ID")


class RefundDispute(BaseModel):
    disputeId: str = Field(description="争议ID")
    orderId: str = Field(description="订单ID")
    buyerName: str = Field(description="购票人姓名")
    amount: float = Field(description="金额")
    reason: str = Field(description="争议原因")
    status: str = Field(description="状态: pending/processing/resolved/rejected")
    createTime: str = Field(description="创建时间")
    checkInCode: Optional[str] = Field(default=None, description="签到码")
    hasGateRecord: bool = Field(description="是否有闸机记录")
    hasPaymentRecord: bool = Field(description="是否有支付记录")


class SampleDetail(BaseModel):
    orderId: str = Field(description="订单ID")
    paymentRecord: Optional[PaymentRecord] = Field(default=None, description="支付记录")
    checkInRecord: Optional[CheckInRecord] = Field(default=None, description="签到记录")
    gateRecord: Optional[GateRecord] = Field(default=None, description="闸机记录")
