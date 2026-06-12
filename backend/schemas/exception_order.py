from typing import Optional
from decimal import Decimal
from datetime import datetime
from pydantic import Field
from schemas.common import BaseSchema


class ExceptionOrderBase(BaseSchema):
    group_batch_id: int = Field(..., description="团单ID")
    arrival_list_id: Optional[int] = Field(None, description="到货清单ID")
    exception_no: str = Field(..., max_length=32, description="异常单号")
    type: Optional[str] = Field("shortage", max_length=32, description="异常类型")
    title: Optional[str] = Field(None, max_length=256, description="异常标题")
    description: Optional[str] = Field(None, description="异常描述")
    product_info: Optional[str] = Field(None, description="涉及商品信息(JSON)")
    affected_quantity: Optional[int] = Field(0, description="影响数量")
    affected_customers: Optional[int] = Field(0, description="影响客户数")
    estimated_loss: Optional[Decimal] = Field(Decimal("0"), description="预估损失")
    responsibility_party: Optional[str] = Field("unknown", max_length=32, description="责任归属")
    responsibility_detail: Optional[str] = Field(None, description="责任判定说明")
    status: Optional[str] = Field("pending", max_length=32, description="状态")
    reported_by: Optional[str] = Field(None, max_length=32, description="上报人")
    reported_time: Optional[datetime] = Field(None, description="上报时间")
    processor: Optional[str] = Field(None, max_length=32, description="处理人")
    process_result: Optional[str] = Field(None, description="处理结果")
    process_time: Optional[datetime] = Field(None, description="处理时间")
    compensation_amount: Optional[Decimal] = Field(Decimal("0"), description="赔付金额")
    evidence_images: Optional[str] = Field(None, description="凭证图片(JSON数组)")
    remark: Optional[str] = Field(None, description="备注")


class ExceptionOrderCreate(ExceptionOrderBase):
    pass


class ExceptionOrderUpdate(ExceptionOrderBase):
    group_batch_id: Optional[int] = Field(None, description="团单ID")
    exception_no: Optional[str] = Field(None, max_length=32, description="异常单号")


class ExceptionOrderProcess(BaseSchema):
    status: str = Field(..., max_length=32, description="新状态")
    responsibility_party: Optional[str] = Field(None, max_length=32, description="责任归属")
    responsibility_detail: Optional[str] = Field(None, description="责任判定说明")
    process_result: str = Field(..., description="处理结果")
    compensation_amount: Optional[Decimal] = Field(Decimal("0"), description="赔付金额")
    processor: Optional[str] = Field(None, max_length=32, description="处理人")
    remark: Optional[str] = Field(None, description="备注")


class ExceptionOrderResponse(ExceptionOrderBase):
    pass
