from typing import Optional
from decimal import Decimal
from datetime import datetime
from pydantic import Field
from schemas.common import BaseSchema


class AfterSaleVoucherBase(BaseSchema):
    pickup_code_id: int = Field(..., description="自提码ID")
    voucher_no: str = Field(..., max_length=32, description="售后单号")
    type: Optional[str] = Field("refund", max_length=32, description="售后类型")
    reason: Optional[str] = Field(None, description="售后原因")
    product_info: Optional[str] = Field(None, description="涉及商品信息(JSON)")
    refund_amount: Optional[Decimal] = Field(Decimal("0"), description="退款金额")
    status: Optional[str] = Field("pending", max_length=32, description="状态")
    applicant: Optional[str] = Field(None, max_length=32, description="申请人")
    applicant_phone: Optional[str] = Field(None, max_length=16, description="申请人电话")
    apply_time: Optional[datetime] = Field(None, description="申请时间")
    processor: Optional[str] = Field(None, max_length=32, description="处理人")
    process_time: Optional[datetime] = Field(None, description="处理时间")
    process_result: Optional[str] = Field(None, description="处理结果")
    evidence_images: Optional[str] = Field(None, description="凭证图片(JSON数组)")
    remark: Optional[str] = Field(None, description="备注")


class AfterSaleVoucherCreate(AfterSaleVoucherBase):
    pass


class AfterSaleVoucherUpdate(AfterSaleVoucherBase):
    pickup_code_id: Optional[int] = Field(None, description="自提码ID")
    voucher_no: Optional[str] = Field(None, max_length=32, description="售后单号")


class AfterSaleVoucherResponse(AfterSaleVoucherBase):
    pass
