from pydantic import BaseModel, Field
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List


class MerchantBase(BaseModel):
    merchant_code: str
    merchant_name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    settlement_cycle: int = 7
    status: str = "active"


class MerchantCreate(MerchantBase):
    pass


class Merchant(MerchantBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SettlementBase(BaseModel):
    settlement_no: str
    merchant_id: int
    settlement_date: date
    total_amount: Decimal
    order_count: int = 0
    refund_amount: Decimal = Decimal("0")
    service_fee: Decimal = Decimal("0")
    actual_settlement: Decimal
    status: str = "pending"
    payment_status: str = "unpaid"
    has_anomaly: bool = False
    anomaly_type: Optional[str] = None
    anomaly_desc: Optional[str] = None
    review_note: Optional[str] = None


class SettlementCreate(SettlementBase):
    pass


class Settlement(SettlementBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SettlementTrendItem(BaseModel):
    date: date
    amount: Decimal
    order_count: int
    anomaly_type: Optional[str] = None
    anomaly_desc: Optional[str] = None
    has_anomaly: bool = False


class SettlementTrendResponse(BaseModel):
    merchant_id: int
    merchant_name: str
    trend_data: List[SettlementTrendItem]
    affected_ranges: List[dict]
    anomaly_summary: dict


class OrderBase(BaseModel):
    order_no: str
    merchant_id: int
    settlement_id: Optional[int] = None
    order_date: datetime
    amount: Decimal
    status: str = "completed"
    payment_method: Optional[str] = None
    has_delay: bool = False
    delay_hours: int = 0


class OrderCreate(OrderBase):
    pass


class Order(OrderBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class OrderDetail(Order):
    merchant_name: Optional[str] = None
    customer_service_count: int = 0
    payment_flow_count: int = 0


class ApprovalNodeBase(BaseModel):
    node_no: str
    settlement_id: int
    node_name: str
    node_order: int
    status: str = "pending"
    approver: Optional[str] = None
    approval_time: Optional[datetime] = None
    approval_opinion: Optional[str] = None


class ApprovalNodeCreate(ApprovalNodeBase):
    pass


class ApprovalNode(ApprovalNodeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AmountCheckBase(BaseModel):
    check_no: str
    settlement_id: int
    check_date: date
    order_amount: Decimal
    refund_amount: Decimal = Decimal("0")
    service_fee: Decimal = Decimal("0")
    expected_settlement: Decimal
    actual_settlement: Decimal
    difference: Decimal = Decimal("0")
    is_consistent: bool = True
    check_note: Optional[str] = None


class AmountCheckCreate(AmountCheckBase):
    pass


class SaveAmountCheckRequest(BaseModel):
    check_id: int = Field(..., description="校验记录ID")
    actual_settlement: Decimal = Field(..., description="实际结算金额")
    check_note: Optional[str] = Field(None, description="校验备注")


class AmountCheck(AmountCheckBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CaliberDiffBase(BaseModel):
    diff_no: str
    order_id: int
    cs_amount: Optional[Decimal] = None
    payment_amount: Optional[Decimal] = None
    difference: Optional[Decimal] = None
    diff_type: Optional[str] = None
    is_resolved: bool = False
    resolution: Optional[str] = None


class CaliberDiffCreate(CaliberDiffBase):
    pass


class CaliberDiff(CaliberDiffBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CaliberDiffDetail(CaliberDiff):
    order_no: str
    merchant_name: Optional[str] = None


class DownloadRequest(BaseModel):
    merchant_id: Optional[int] = None
    start_date: date
    end_date: date
    include_rules: bool = True


class DashboardSummary(BaseModel):
    total_settlement: Decimal
    total_orders: int
    anomaly_count: int
    delay_orders: int
    missing_cs_records: int
    caliber_changes: int
    affected_amount: Decimal
