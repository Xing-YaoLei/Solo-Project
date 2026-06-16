from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, List, Dict, Any


class PatientBase(BaseModel):
    patient_id: str
    name: str
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    phone: Optional[str] = None
    id_card: Optional[str] = None
    first_visit_date: Optional[date] = None


class PatientCreate(PatientBase):
    pass


class Patient(PatientBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AppointmentBase(BaseModel):
    appointment_id: str
    patient_id: str
    appointment_date: datetime
    department: Optional[str] = None
    doctor: Optional[str] = None
    treatment_type: Optional[str] = None
    status: Optional[str] = "scheduled"
    is_no_show: Optional[bool] = False
    source_system: Optional[str] = "appointment_system"


class AppointmentCreate(AppointmentBase):
    pass


class Appointment(AppointmentBase):
    id: int
    no_show_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BillingRecordBase(BaseModel):
    billing_id: str
    patient_id: str
    billing_date: datetime
    total_amount: float = 0.0
    paid_amount: float = 0.0
    payment_method: Optional[str] = None
    treatment_items: Optional[Dict[str, Any]] = None
    source_system: Optional[str] = "billing_system"


class BillingRecordCreate(BillingRecordBase):
    pass


class BillingRecord(BillingRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class MedicalRecordBase(BaseModel):
    record_id: str
    patient_id: str
    visit_date: datetime
    doctor: Optional[str] = None
    department: Optional[str] = None
    chief_complaint: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment_summary: Optional[str] = None
    prescription: Optional[str] = None
    source_system: Optional[str] = "clinical_system"


class MedicalRecordCreate(MedicalRecordBase):
    pass


class MedicalRecord(MedicalRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TreatmentPlanBase(BaseModel):
    plan_id: str
    record_id: str
    plan_name: str
    plan_description: Optional[str] = None
    estimated_cost: float = 0.0
    priority: Optional[str] = "normal"
    status: Optional[str] = "pending"
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class TreatmentPlanCreate(TreatmentPlanBase):
    pass


class TreatmentPlan(TreatmentPlanBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ImageRecordBase(BaseModel):
    image_id: str
    patient_id: str
    study_date: datetime
    image_type: Optional[str] = None
    body_part: Optional[str] = None
    study_description: Optional[str] = None
    study_instance_uid: Optional[str] = None
    series_count: int = 0
    image_count: int = 0
    file_size_mb: float = 0.0
    storage_path: Optional[str] = None
    source_system: Optional[str] = "imaging_system"
    archive_status: Optional[str] = "archived"


class ImageRecordCreate(ImageRecordBase):
    pass


class ImageRecord(ImageRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class WarningThresholdBase(BaseModel):
    metric_name: str
    metric_code: str
    warning_threshold: float
    critical_threshold: Optional[float] = None
    operator: str = ">="
    unit: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_enabled: bool = True


class WarningThresholdCreate(WarningThresholdBase):
    created_by: Optional[str] = None


class WarningThresholdUpdate(BaseModel):
    warning_threshold: Optional[float] = None
    critical_threshold: Optional[float] = None
    operator: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_enabled: Optional[bool] = None
    updated_by: Optional[str] = None


class WarningThreshold(WarningThresholdBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CaliberConflictBase(BaseModel):
    conflict_id: str
    patient_id: Optional[str] = None
    source_system_a: str
    source_system_b: str
    conflict_field: str
    value_a: Optional[str] = None
    value_b: Optional[str] = None
    resolution_status: Optional[str] = "pending"


class CaliberConflictCreate(CaliberConflictBase):
    pass


class CaliberConflict(CaliberConflictBase):
    id: int
    conflict_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class NoShowReviewBase(BaseModel):
    review_id: str
    patient_id: str
    appointment_id: Optional[str] = None
    no_show_date: datetime
    follow_up_rate: float = 0.0
    historical_no_show_count: int = 0
    review_materials: Optional[Dict[str, Any]] = None
    review_status: Optional[str] = "pending"
    reviewer: Optional[str] = None
    review_notes: Optional[str] = None


class NoShowReviewCreate(NoShowReviewBase):
    pass


class NoShowReview(NoShowReviewBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TrendDataPoint(BaseModel):
    date: str
    value: float
    label: Optional[str] = None


class ArchiveTrendResponse(BaseModel):
    period: str
    data: List[TrendDataPoint]


class PatientStatsResponse(BaseModel):
    total_patients: int
    new_patients: int
    active_patients: int
    avg_visits_per_patient: float
    gender_distribution: Dict[str, int]
    age_distribution: Dict[str, int]


class MedicalRecordStatsResponse(BaseModel):
    total_records: int
    records_with_images: int
    avg_treatment_items: float
    top_diagnoses: List[Dict[str, Any]]
    department_distribution: Dict[str, int]


class TreatmentPlanStatsResponse(BaseModel):
    total_plans: int
    completed_plans: int
    pending_plans: int
    avg_estimated_cost: float
    priority_distribution: Dict[str, int]
    completion_rate: float


class WarningAlert(BaseModel):
    metric_code: str
    metric_name: str
    current_value: float
    threshold: float
    level: str
    message: str
    timestamp: datetime


class DataUploadResponse(BaseModel):
    success: bool
    records_processed: int
    records_duplicated: int
    records_cleaned: int
    conflicts_found: int
    message: str
