from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel


class DepartmentOut(BaseModel):
    id: int
    name: str
    code: str

    class Config:
        from_attributes = True


class TherapistOut(BaseModel):
    id: int
    name: str
    department_id: int
    title: Optional[str] = None
    specialty: Optional[str] = None

    class Config:
        from_attributes = True


class PatientOut(BaseModel):
    id: int
    name: str
    gender: Optional[str] = None
    age: Optional[int] = None
    diagnosis: Optional[str] = None
    department_id: int
    department_name: Optional[str] = None
    admission_date: Optional[date] = None
    insurance_type: Optional[str] = None

    class Config:
        from_attributes = True


class AssessmentScaleOut(BaseModel):
    id: int
    patient_id: int
    patient_name: str
    scale_name: str
    score: float
    previous_score: Optional[float] = None
    assessed_at: date
    has_linked_prescription: bool = False
    linked_prescription_id: Optional[int] = None

    class Config:
        from_attributes = True


class TrainingPrescriptionOut(BaseModel):
    id: int
    patient_id: int
    patient_name: str
    assessment_id: Optional[int] = None
    prescription_name: str
    content: str
    frequency: Optional[str] = None
    total_sessions: int = 0
    completed_sessions: int = 0
    completion_rate: float = 0.0
    prescribed_at: date
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = "active"
    therapist_name: Optional[str] = None

    class Config:
        from_attributes = True


class EquipmentRecordBriefOut(BaseModel):
    id: int
    equipment_name: str
    parameters: Optional[dict] = None
    duration: Optional[int] = None
    record_date: date

    class Config:
        from_attributes = True


class TreatmentSessionOut(BaseModel):
    id: int
    patient_id: int
    patient_name: str
    therapist_id: int
    therapist_name: str
    prescription_id: Optional[int] = None
    treatment_date: date
    time: Optional[str] = None
    project_name: Optional[str] = None
    duration_minutes: Optional[int] = None
    status: Optional[str] = None
    equipment_records: List[EquipmentRecordBriefOut] = []

    class Config:
        from_attributes = True


class CheckInRecordOut(BaseModel):
    id: int
    patient_id: int
    session_id: Optional[int] = None
    check_in_date: date
    check_in_time: Optional[str] = None

    class Config:
        from_attributes = True


class EquipmentRecordOut(BaseModel):
    id: int
    session_id: Optional[int] = None
    equipment_name: str
    parameters: Optional[dict] = None
    duration: Optional[int] = None
    record_date: date
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    patient_name: Optional[str] = None
    therapist_name: Optional[str] = None
    treatment_date: Optional[date] = None
    project_name: Optional[str] = None

    class Config:
        from_attributes = True


class SettlementOut(BaseModel):
    id: int
    patient_id: int
    patient_name: str
    settlement_date: date
    total_amount: float
    insurance_amount: float
    self_paid_amount: float
    settlement_type: Optional[str] = None
    status: Optional[str] = None

    class Config:
        from_attributes = True


class RemarkTaskOut(BaseModel):
    id: int
    rejection_id: int
    assigned_to: Optional[str] = None
    assignee: Optional[str] = None
    content: Optional[str] = None
    status: str = "pending"
    created_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    completed: Optional[bool] = None

    class Config:
        from_attributes = True


class RejectionRecordOut(BaseModel):
    id: int
    settlement_id: Optional[int] = None
    patient_id: int
    patient_name: str
    rejected_amount: float = 0.0
    rejection_reason: str = ""
    rejection_date: date
    status: Optional[str] = None
    remark: Optional[str] = None
    conclusion: Optional[str] = None
    remark_task: Optional[RemarkTaskOut] = None

    class Config:
        from_attributes = True


class SavedViewOut(BaseModel):
    id: int
    name: str
    owner: str = "当前用户"
    is_shared: bool = False
    config: str
    filters: Optional[dict] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SavedViewCreate(BaseModel):
    name: str
    config: str
    owner: Optional[str] = "当前用户"
    is_shared: Optional[bool] = False


class RemarkCreate(BaseModel):
    remark: str
    assignee: Optional[str] = None


class ConclusionUpdate(BaseModel):
    conclusion: str


class RemarkTaskUpsert(BaseModel):
    rejection_id: int
    assigned_to: Optional[str] = None
    assignee: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None


class SettlementTrendPoint(BaseModel):
    period: str
    total_amount: float
    insurance_amount: float
    self_paid_amount: float
    rejected_amount: float = 0.0
    rejected_pending_amount: float = 0.0
    rejected_processing_amount: float = 0.0
    rejected_resolved_amount: float = 0.0
    rejection_rate: float = 0.0
    completion_rate: float = 0.0
    count: int


class SettlementSummary(BaseModel):
    total_settled: float
    total_insurance: float
    total_self_paid: float
    total_count: int
    avg_per_case: float
    rejected_amount: float = 0.0
    rejected_pending_amount: float = 0.0
    rejected_processing_amount: float = 0.0
    rejected_resolved_amount: float = 0.0
    rejection_rate: float = 0.0
    completion_rate: float = 0.0
    total_amount_change: float = 0.0
    rejected_amount_change: float = 0.0
    rejection_rate_change: float = 0.0
    completion_rate_change: float = 0.0


class TrainingCompletionStats(BaseModel):
    department: str
    therapist: str
    total_sessions: int
    completed_sessions: int
    completion_rate: float


class CalendarDay(BaseModel):
    date: date
    scheduled_count: int = 0
    completed_count: int = 0
    missed_count: int = 0
    rejected_count: int = 0
    session_count: int = 0
    patient_count: int = 0
    details: List[TreatmentSessionOut] = []
