from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, computed_field, model_validator


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    username: str
    display_name: str
    role: str
    store_id: str
    is_active: bool

    model_config = {"from_attributes": True}


class RegionOut(BaseModel):
    id: str
    name: str
    code: str
    manager_name: str | None = None

    model_config = {"from_attributes": True}


class StoreOut(BaseModel):
    id: str
    region_id: str
    name: str
    code: str
    address: str | None = None
    phone: str | None = None
    is_active: bool

    model_config = {"from_attributes": True}


class MemberProfileOut(BaseModel):
    id: str
    name: str
    id_number: str | None = None
    phone: str | None = None
    gender: str | None = None

    model_config = {"from_attributes": True}


class BatchItemCreate(BaseModel):
    drug_name: str
    drug_code: str | None = None
    specification: str | None = None
    quantity: int = 1
    unit: str | None = None
    dosage: str | None = None
    frequency: str | None = None
    duration_days: int | None = None
    unit_price: float = 0.0
    notes: str | None = None


class BatchItemOut(BatchItemCreate):
    id: str
    prescription_id: str
    subtotal: float

    model_config = {"from_attributes": True}


class ReplenishmentCreate(BaseModel):
    drug_name: str
    drug_code: str | None = None
    quantity: int = 1
    reason: str | None = None


class ReplenishmentOut(ReplenishmentCreate):
    id: str
    prescription_id: str
    status: str

    model_config = {"from_attributes": True}


class InsuranceRecordCreate(BaseModel):
    insurance_type: str
    policy_number: str | None = None
    coverage_ratio: float = 0.0
    covered_amount: float = 0.0
    self_pay_amount: float = 0.0
    verified: bool = False
    notes: str | None = None


class InsuranceRecordOut(InsuranceRecordCreate):
    id: str
    prescription_id: str

    model_config = {"from_attributes": True}


class PrescriptionPhotoOut(BaseModel):
    id: str
    prescription_id: str
    file_path: str
    file_name: str
    content_type: str
    uploaded_by: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TimelineEventOut(BaseModel):
    id: str
    prescription_id: str
    event_type: str
    from_status: str | None = None
    to_status: str | None = None
    description: str | None = None
    performed_by: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PrescriptionCaliberNoteCreate(BaseModel):
    content: str
    category: str | None = None


class PrescriptionCaliberNoteOut(BaseModel):
    id: str
    prescription_id: str
    content: str
    category: str | None = None
    created_by: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PrescriptionCreate(BaseModel):
    store_id: str
    member_id: str
    rx_number: str
    priority: str = "normal"
    diagnosis: str | None = None
    total_amount: float = 0.0
    batch_items: list[BatchItemCreate] = []


class PrescriptionUpdate(BaseModel):
    status: str | None = None
    priority: str | None = None
    diagnosis: str | None = None
    reviewer_id: str | None = None


class PrescriptionOut(BaseModel):
    id: str
    store_id: str
    member_id: str
    rx_number: str
    status: str
    priority: str
    diagnosis: str | None = None
    total_amount: float
    reviewer_id: str | None = None
    reviewed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PrescriptionDetail(PrescriptionOut):
    member: MemberProfileOut | None = None
    batch_items: list[BatchItemOut] = []
    replenishments: list[ReplenishmentOut] = []
    insurance_records: list[InsuranceRecordOut] = []
    photos: list[PrescriptionPhotoOut] = []
    timeline_events: list[TimelineEventOut] = []
    exceptions: list["ExceptionOut"] = []
    caliber_notes: list[PrescriptionCaliberNoteOut] = []


class PrescriptionListParams(BaseModel):
    status: str | None = None
    store_id: str | None = None
    region_id: str | None = None
    priority: str | None = None
    search: str | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int


class ExceptionCreate(BaseModel):
    prescription_id: str
    exception_type: str
    severity: str = "medium"
    impact_scope: str
    description: str | None = None
    assignee_id: str | None = None


class ExceptionUpdate(BaseModel):
    severity: str | None = None
    impact_scope: str | None = None
    description: str | None = None
    assignee_id: str | None = None
    resolution: str | None = None
    status: str | None = None


class ExceptionOut(BaseModel):
    id: str
    prescription_id: str
    exception_type: str
    severity: str
    impact_scope: str
    description: str | None = None
    assignee_id: str | None = None
    resolution: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None = None

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def extract_related_data(cls, data: Any) -> Any:
        if hasattr(data, "prescription") and data.prescription is not None:
            object.__setattr__(data, "_prescription_rx_number", data.prescription.rx_number)
        if hasattr(data, "assignee") and data.assignee is not None:
            object.__setattr__(data, "_assignee_username", data.assignee.username)
        return data

    @computed_field
    @property
    def exception_no(self) -> str:
        year = self.created_at.year
        month = str(self.created_at.month).zfill(2)
        seq = self.id[-4:].upper()
        return f"EXC-{year}{month}{seq}"

    @computed_field
    @property
    def prescription_no(self) -> str:
        return getattr(self, "_prescription_rx_number", "")

    @computed_field
    @property
    def assignee_name(self) -> str | None:
        return getattr(self, "_assignee_username", None)


class ExceptionListParams(BaseModel):
    status: str | None = None
    severity: str | None = None
    assignee_id: str | None = None
    prescription_id: str | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class DashboardStats(BaseModel):
    total_prescriptions: int
    pending_count: int
    in_review_count: int
    approved_count: int
    rejected_count: int
    exception_count: int
    open_exceptions: int
    total_stores: int
    total_members: int


class GlobalCaliberNoteOut(BaseModel):
    id: str
    metric: str
    definition: str
    exclusions: list[str]
    remarks: str | None
    created_at: datetime
    model_config = {"from_attributes": True}


class ExportRequest(BaseModel):
    export_type: str = "prescriptions"
    filters: dict | None = None
    include_caliber: bool = True
    dimensions: list[str] | None = None
    date_range: dict | None = None
    format: str = "xlsx"


class ExportStatusResponse(BaseModel):
    task_id: str
    status: str
    file_path: str | None = None
    error_message: str | None = None
    row_count: int | None = None


class BatchStatusUpdate(BaseModel):
    prescription_ids: list[str]
    status: str


class MarkExceptionRequest(BaseModel):
    exception_type: str
    severity: str = "medium"
    impact_scope: str
    description: str | None = None
    assignee_id: str | None = None
