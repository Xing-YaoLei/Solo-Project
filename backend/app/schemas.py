from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


class OrderStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    PICKED = "picked"
    DELIVERING = "delivering"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"
    APPEALED = "appealed"
    SETTLED = "settled"


class RejectReason(str, Enum):
    RIDER_FAULT = "rider_fault"
    SYSTEM_FAULT = "system_fault"
    MERCHANT_FAULT = "merchant_fault"
    CUSTOMER_FAULT = "customer_fault"
    OTHER = "other"


class ResponseModel(BaseModel):
    code: int = 0
    message: str = "success"
    data: Optional[Any] = None


class PaginatedResponse(BaseModel):
    code: int = 0
    message: str = "success"
    data: Optional[Any] = None
    total: int = 0
    page: int = 1
    page_size: int = 20


class AddressDictBase(BaseModel):
    name: str
    address: str
    area: Optional[str] = None
    lng: Optional[float] = None
    lat: Optional[float] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    is_active: Optional[bool] = True


class AddressDictCreate(AddressDictBase):
    pass


class AddressDictUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    area: Optional[str] = None
    lng: Optional[float] = None
    lat: Optional[float] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    is_active: Optional[bool] = None


class AddressDictResponse(AddressDictBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TrackRuleBase(BaseModel):
    name: str
    area: Optional[str] = None
    max_distance: float
    expected_duration: int
    warning_duration: int
    track_interval: int = 60
    is_active: Optional[bool] = True


class TrackRuleCreate(TrackRuleBase):
    pass


class TrackRuleUpdate(BaseModel):
    name: Optional[str] = None
    area: Optional[str] = None
    max_distance: Optional[float] = None
    expected_duration: Optional[int] = None
    warning_duration: Optional[int] = None
    track_interval: Optional[int] = None
    is_active: Optional[bool] = None


class TrackRuleResponse(TrackRuleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SubsidyRuleBase(BaseModel):
    name: str
    rule_type: str
    threshold: float
    subsidy_amount: float
    subsidy_unit: str = "yuan"
    area: Optional[str] = None
    priority: int = 0
    is_active: Optional[bool] = True
    description: Optional[str] = None


class SubsidyRuleCreate(SubsidyRuleBase):
    pass


class SubsidyRuleUpdate(BaseModel):
    name: Optional[str] = None
    rule_type: Optional[str] = None
    threshold: Optional[float] = None
    subsidy_amount: Optional[float] = None
    subsidy_unit: Optional[str] = None
    area: Optional[str] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None


class SubsidyRuleResponse(SubsidyRuleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RiderBase(BaseModel):
    name: str
    phone: str
    area: Optional[str] = None
    level: str = "normal"
    status: str = "online"


class RiderResponse(RiderBase):
    id: int
    rating: float
    total_orders: int
    reject_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    pickup_address: str
    delivery_address: str
    pickup_area: Optional[str] = None
    delivery_area: Optional[str] = None
    distance: Optional[float] = None
    goods_name: Optional[str] = None
    goods_weight: Optional[float] = 0
    goods_amount: Optional[float] = 0
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    remark: Optional[str] = None


class OrderCreate(OrderBase):
    pickup_address_id: Optional[int] = None
    delivery_address_id: Optional[int] = None


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    remark: Optional[str] = None


class OrderResponse(BaseModel):
    id: int
    order_no: str
    status: OrderStatus
    pickup_address_id: Optional[int] = None
    delivery_address_id: Optional[int] = None
    pickup_address: str
    delivery_address: str
    pickup_area: Optional[str] = None
    delivery_area: Optional[str] = None
    distance: Optional[float] = None
    goods_name: Optional[str] = None
    goods_weight: float
    goods_amount: float
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    rider_id: Optional[int] = None
    rider_name: Optional[str] = None
    assign_time: Optional[datetime] = None
    accept_time: Optional[datetime] = None
    pickup_time: Optional[datetime] = None
    delivery_time: Optional[datetime] = None
    complete_time: Optional[datetime] = None
    base_fee: float
    distance_fee: float
    weight_fee: float
    subsidy_fee: float
    total_fee: float
    rider_income: float
    platform_profit: float
    reject_count: int
    remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderDetailResponse(OrderResponse):
    status_logs: List[Any] = []
    appeals: List[Any] = []
    settlements: List[Any] = []
    reject_records: List[Any] = []


class OrderStatusLogResponse(BaseModel):
    id: int
    order_id: int
    from_status: Optional[str] = None
    to_status: str
    operator_type: Optional[str] = None
    operator_id: Optional[int] = None
    operator_name: Optional[str] = None
    reason: Optional[str] = None
    remark: Optional[str] = None
    extra_data: Optional[Any] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OrderRejectRecordResponse(BaseModel):
    id: int
    order_id: int
    rider_id: int
    rider_name: Optional[str] = None
    reject_reason: RejectReason
    reject_detail: Optional[str] = None
    responsibility: Optional[str] = None
    is_reminded: bool
    reminded_at: Optional[datetime] = None
    handler: Optional[str] = None
    handled_at: Optional[datetime] = None
    remark: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AppealBase(BaseModel):
    order_id: int
    appeal_type: str
    appellant: str
    appellant_name: str
    appellant_phone: Optional[str] = None
    description: str
    claim_amount: float = 0


class AppealCreate(AppealBase):
    pass


class AppealUpdate(BaseModel):
    status: Optional[str] = None
    compensate_amount: Optional[float] = None
    handler: Optional[str] = None
    handle_result: Optional[str] = None


class AppealResponse(BaseModel):
    id: int
    order_id: int
    order_no: Optional[str] = None
    appeal_type: str
    appellant: str
    appellant_name: str
    appellant_phone: Optional[str] = None
    description: str
    status: str
    claim_amount: float
    compensate_amount: float
    evidence: Optional[List[Any]] = None
    handler: Optional[str] = None
    handle_time: Optional[datetime] = None
    handle_result: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EvidenceAddRequest(BaseModel):
    appeal_id: int
    evidence_type: str
    evidence_url: str
    evidence_name: Optional[str] = None


class SettlementBase(BaseModel):
    order_id: int
    remark: Optional[str] = None


class SettlementCreate(SettlementBase):
    pass


class SettlementUpdate(BaseModel):
    status: Optional[str] = None
    appeal_compensation: Optional[float] = None
    penalty_fee: Optional[float] = None
    bonus_fee: Optional[float] = None
    remark: Optional[str] = None


class SettlementResponse(BaseModel):
    id: int
    order_id: int
    settlement_no: str
    order_no: Optional[str] = None
    base_fee: float
    distance_fee: float
    weight_fee: float
    subsidy_fee: float
    appeal_compensation: float
    penalty_fee: float
    bonus_fee: float
    total_income: float
    rider_income: float
    platform_income: float
    detail: Optional[List[Any]] = None
    remark: Optional[str] = None
    status: str
    confirmed_by: Optional[str] = None
    confirmed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CompensateStatResponse(BaseModel):
    id: int
    stat_date: datetime
    area: Optional[str] = None
    handler: Optional[str] = None
    total_orders: int
    appeal_count: int
    appeal_rate: float
    compensate_amount: float
    compensate_count: int
    late_compensate: float
    damage_compensate: float
    lost_compensate: float
    other_compensate: float
    created_at: datetime

    class Config:
        from_attributes = True


class OrderRejectRequest(BaseModel):
    order_id: int
    rider_id: int
    reject_reason: RejectReason
    reject_detail: Optional[str] = None


class OrderSupplementRequest(BaseModel):
    order_id: int
    field_name: str
    field_value: str
    operator_name: str
    remark: Optional[str] = None
