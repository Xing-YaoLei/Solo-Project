from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from pydantic import Field
from schemas.common import BaseSchema
from schemas.arrival_list import ArrivalListResponse
from schemas.pickup_code import PickupCodeResponse
from schemas.exception_order import ExceptionOrderResponse
from schemas.status_log import StatusLogResponse


class GroupBatchBase(BaseSchema):
    batch_no: str = Field(..., max_length=32, description="团单号")
    name: str = Field(..., max_length=128, description="团单名称")
    status: Optional[str] = Field("pending", max_length=32, description="状态")
    group_start_time: Optional[datetime] = Field(None, description="开团时间")
    group_end_time: Optional[datetime] = Field(None, description="截团时间")
    expected_arrival_time: Optional[datetime] = Field(None, description="预计到货时间")
    actual_arrival_time: Optional[datetime] = Field(None, description="实际到货时间")
    pickup_deadline: Optional[datetime] = Field(None, description="提货截止时间")
    total_orders: Optional[int] = Field(0, description="订单总数")
    total_items: Optional[int] = Field(0, description="商品总件数")
    total_amount: Optional[Decimal] = Field(Decimal("0"), description="总金额")
    pickup_point: Optional[str] = Field(None, max_length=128, description="提货点")
    contact_person: Optional[str] = Field(None, max_length=32, description="联系人")
    contact_phone: Optional[str] = Field(None, max_length=16, description="联系电话")
    remark: Optional[str] = Field(None, description="备注")
    operator: Optional[str] = Field(None, max_length=32, description="操作人")


class GroupBatchCreate(GroupBatchBase):
    pass


class GroupBatchUpdate(GroupBatchBase):
    batch_no: Optional[str] = Field(None, max_length=32, description="团单号")
    name: Optional[str] = Field(None, max_length=128, description="团单名称")


class GroupBatchStatusUpdate(BaseSchema):
    status: str = Field(..., max_length=32, description="新状态")
    change_reason: Optional[str] = Field(None, description="变更原因")
    operator: Optional[str] = Field(None, max_length=32, description="操作人")


class GroupBatchResponse(GroupBatchBase):
    arrival_lists: Optional[List[ArrivalListResponse]] = None
    pickup_codes: Optional[List[PickupCodeResponse]] = None
    exception_orders: Optional[List[ExceptionOrderResponse]] = None
    status_logs: Optional[List[StatusLogResponse]] = None
