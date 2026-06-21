from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.case import CaseStatus
from app.models.invoice import InvoiceStatus, InvoiceSource
from app.models.payment_schedule import PaymentStatus, PaymentCycleType
from app.models.approval_node import ApprovalStatus


class CaseBase(BaseModel):
    case_no: str = Field(max_length=50)
    name: str = Field(max_length=255)
    lawyer_id: UUID
    client_id: UUID
    case_type: str = Field(max_length=50)
    quoted_amount: float = Field(ge=0, default=0)
    actual_amount: float = Field(ge=0, default=0)
    status: CaseStatus = CaseStatus.ACTIVE


class CaseCreate(CaseBase):
    pass


class CaseUpdate(BaseModel):
    case_no: str | None = Field(default=None, max_length=50)
    name: str | None = Field(default=None, max_length=255)
    lawyer_id: UUID | None = None
    client_id: UUID | None = None
    case_type: str | None = Field(default=None, max_length=50)
    quoted_amount: float | None = Field(default=None, ge=0)
    actual_amount: float | None = Field(default=None, ge=0)
    status: CaseStatus | None = None


class CaseResponse(CaseBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvoiceItemBase(BaseModel):
    item_name: str = Field(max_length=255)
    description: str | None = None
    quantity: float = Field(gt=0, default=1)
    unit_price: float = Field(ge=0)
    amount: float = Field(ge=0)
    fee_type: str = Field(max_length=50)


class InvoiceItemCreate(InvoiceItemBase):
    pass


class InvoiceItemResponse(InvoiceItemBase):
    id: UUID
    invoice_id: UUID

    model_config = ConfigDict(from_attributes=True)


class InvoiceBase(BaseModel):
    invoice_no: str = Field(max_length=50)
    case_id: UUID
    amount: float = Field(ge=0)
    status: InvoiceStatus = InvoiceStatus.PENDING
    invoice_date: date
    source: InvoiceSource = InvoiceSource.MANUAL


class InvoiceCreate(InvoiceBase):
    items: list[InvoiceItemCreate] = Field(default_factory=list)


class InvoiceUpdate(BaseModel):
    invoice_no: str | None = Field(default=None, max_length=50)
    case_id: UUID | None = None
    amount: float | None = Field(default=None, ge=0)
    status: InvoiceStatus | None = None
    invoice_date: date | None = None
    source: InvoiceSource | None = None


class InvoiceResponse(InvoiceBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    items: list[InvoiceItemResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class PaymentScheduleBase(BaseModel):
    case_id: UUID
    phase: int = Field(ge=1)
    phase_name: str = Field(max_length=100)
    amount: float = Field(ge=0)
    due_date: date
    status: PaymentStatus = PaymentStatus.PENDING
    payment_cycle_type: PaymentCycleType


class PaymentScheduleCreate(PaymentScheduleBase):
    pass


class PaymentScheduleUpdate(BaseModel):
    phase: int | None = Field(default=None, ge=1)
    phase_name: str | None = Field(default=None, max_length=100)
    amount: float | None = Field(default=None, ge=0)
    due_date: date | None = None
    actual_payment_date: date | None = None
    status: PaymentStatus | None = None
    payment_cycle_type: PaymentCycleType | None = None


class PaymentScheduleResponse(PaymentScheduleBase):
    id: UUID
    actual_payment_date: date | None = None

    model_config = ConfigDict(from_attributes=True)


class ApprovalNodeBase(BaseModel):
    case_id: UUID
    node_name: str = Field(max_length=100)
    approver_id: UUID
    order_index: int = Field(ge=0)
    submit_time: datetime
    expected_complete_time: datetime
    status: ApprovalStatus = ApprovalStatus.PENDING
    reason: str | None = None


class ApprovalNodeCreate(ApprovalNodeBase):
    pass


class ApprovalNodeUpdate(BaseModel):
    node_name: str | None = Field(default=None, max_length=100)
    approver_id: UUID | None = None
    order_index: int | None = Field(default=None, ge=0)
    expected_complete_time: datetime | None = None
    actual_complete_time: datetime | None = None
    status: ApprovalStatus | None = None
    reason: str | None = None


class ApprovalNodeResponse(ApprovalNodeBase):
    id: UUID
    actual_complete_time: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
