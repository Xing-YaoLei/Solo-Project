import uuid
from datetime import date, datetime
from pydantic import BaseModel, Field


class BedOut(BaseModel):
    id: uuid.UUID
    floor: int
    room_number: str
    bed_number: str

    model_config = {"from_attributes": True}


class NurseOut(BaseModel):
    id: uuid.UUID
    name: str
    role: str

    model_config = {"from_attributes": True}


class ElderOut(BaseModel):
    id: uuid.UUID
    name: str
    bed_id: uuid.UUID
    admission_date: date

    model_config = {"from_attributes": True}


class ScheduleOut(BaseModel):
    id: uuid.UUID
    bed_id: uuid.UUID
    nurse_id: uuid.UUID
    shift_date: date
    shift_type: str

    model_config = {"from_attributes": True}


class RiskAnnotationOut(BaseModel):
    id: uuid.UUID
    type: str
    timestamp: datetime
    description: str
    severity: str
    bed_id: uuid.UUID
    metadata_: dict | None = Field(None, alias="metadata")

    model_config = {"from_attributes": True, "populate_by_name": True}


class RiskAnnotationCreate(BaseModel):
    type: str = Field(..., pattern="^(terminal_delay|access_missing|billing_caliber_change|fall_event)$")
    timestamp: datetime
    description: str
    severity: str = Field(..., pattern="^(low|medium|high|critical)$")
    bed_id: uuid.UUID
    metadata_: dict | None = Field(None, alias="metadata")


class ReviewNoteOut(BaseModel):
    id: uuid.UUID
    annotation_id: uuid.UUID
    author: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewNoteCreate(BaseModel):
    author: str
    content: str


class MedicationRecordOut(BaseModel):
    id: uuid.UUID
    elder_id: uuid.UUID
    medication_name: str
    scheduled_time: datetime
    actual_time: datetime | None
    status: str

    model_config = {"from_attributes": True}


class MedicationRecordCreate(BaseModel):
    elder_id: uuid.UUID
    medication_name: str
    scheduled_time: datetime
    actual_time: datetime | None = None
    status: str = Field(..., pattern="^(按时|延迟|未执行)$")


class VisitRecordOut(BaseModel):
    id: uuid.UUID
    elder_id: uuid.UUID
    visitor_name: str
    scheduled_time: datetime
    actual_time: datetime | None
    access_record_exists: bool

    model_config = {"from_attributes": True}


class VisitRecordCreate(BaseModel):
    elder_id: uuid.UUID
    visitor_name: str
    scheduled_time: datetime
    actual_time: datetime | None = None
    access_record_exists: bool = False


class ActivityRecordOut(BaseModel):
    id: uuid.UUID
    elder_id: uuid.UUID
    activity_name: str
    scheduled_time: datetime
    checked_in: bool
    check_in_time: datetime | None

    model_config = {"from_attributes": True}


class ActivityRecordCreate(BaseModel):
    elder_id: uuid.UUID
    activity_name: str
    scheduled_time: datetime
    checked_in: bool = False
    check_in_time: datetime | None = None


class ScheduleTrendItem(BaseModel):
    date: date
    occupancy: float
    risk_score: float
    annotations: list[RiskAnnotationOut]


class ScheduleTrendResponse(BaseModel):
    items: list[ScheduleTrendItem]
    total: int


class FallEventOut(BaseModel):
    id: uuid.UUID
    elder_id: uuid.UUID
    timestamp: datetime
    description: str
    severity: str

    model_config = {"from_attributes": True}


class BillingCaliberChangeOut(BaseModel):
    id: uuid.UUID
    change_date: date
    description: str
    old_caliber: str
    new_caliber: str

    model_config = {"from_attributes": True}
