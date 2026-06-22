from datetime import datetime, date
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.models import (
    UserRole,
    SamplingStatus,
    EvidenceStatus,
    RiskLevel,
    RectificationStatus,
    MaterialStatus,
    ExceptionType,
    ExceptionStatus,
)


def to_camel(string: str) -> str:
    components = string.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


class CamelCaseModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class UserBase(CamelCaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    role: UserRole = UserRole.AUDITOR


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(CamelCaseModel):
    username: str
    password: str


class UserUpdate(CamelCaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None


class UserResponse(UserBase):
    id: int
    created_at: datetime


class Token(CamelCaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(CamelCaseModel):
    user_id: Optional[int] = None
    username: Optional[str] = None
    role: Optional[UserRole] = None


class VendorBase(CamelCaseModel):
    name: str = Field(..., max_length=200)
    contact: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class VendorCreate(VendorBase):
    pass


class VendorUpdate(CamelCaseModel):
    name: Optional[str] = Field(None, max_length=200)
    contact: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class VendorResponse(VendorBase):
    id: int
    created_at: datetime


class AuditChecklistBase(CamelCaseModel):
    title: str = Field(..., max_length=300)
    category: str = Field(..., max_length=100)
    description: Optional[str] = None
    criteria: str


class AuditChecklistCreate(AuditChecklistBase):
    pass


class AuditChecklistUpdate(CamelCaseModel):
    title: Optional[str] = Field(None, max_length=300)
    category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    criteria: Optional[str] = None


class AuditChecklistResponse(AuditChecklistBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime


class AuditChecklistListResponse(CamelCaseModel):
    total: int
    items: List[AuditChecklistResponse]


class SamplingRecordBase(CamelCaseModel):
    checklist_id: int
    sample_name: str = Field(..., max_length=300)
    sample_code: str = Field(..., max_length=100)
    source: Optional[str] = None
    sampling_date: date
    sampled_by: Optional[str] = None
    status: SamplingStatus = SamplingStatus.PENDING
    sample_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    evidence_status: EvidenceStatus = EvidenceStatus.COMPLETE


class SamplingRecordCreate(SamplingRecordBase):
    pass


class SamplingRecordUpdate(CamelCaseModel):
    checklist_id: Optional[int] = None
    sample_name: Optional[str] = Field(None, max_length=300)
    sample_code: Optional[str] = Field(None, max_length=100)
    source: Optional[str] = None
    sampling_date: Optional[date] = None
    sampled_by: Optional[str] = None
    sample_data: Optional[Dict[str, Any]] = None
    evidence_status: Optional[EvidenceStatus] = None


class SamplingStatusUpdate(CamelCaseModel):
    status: SamplingStatus
    remark: Optional[str] = None


class SamplingRecordResponse(SamplingRecordBase):
    id: int
    created_at: datetime


class SamplingRecordListResponse(CamelCaseModel):
    total: int
    items: List[SamplingRecordResponse]


class RectificationPlanBase(CamelCaseModel):
    sampling_id: int
    title: str = Field(..., max_length=300)
    description: Optional[str] = None
    risk_level: RiskLevel = RiskLevel.MEDIUM
    deadline: Optional[date] = None
    responsible_person: Optional[str] = None
    vendor_id: Optional[int] = None
    status: RectificationStatus = RectificationStatus.NOT_STARTED


class RectificationPlanCreate(RectificationPlanBase):
    pass


class RectificationPlanUpdate(CamelCaseModel):
    sampling_id: Optional[int] = None
    title: Optional[str] = Field(None, max_length=300)
    description: Optional[str] = None
    risk_level: Optional[RiskLevel] = None
    deadline: Optional[date] = None
    responsible_person: Optional[str] = None
    vendor_id: Optional[int] = None


class RectificationStatusUpdate(CamelCaseModel):
    status: RectificationStatus
    remark: Optional[str] = None


class RectificationPlanResponse(RectificationPlanBase):
    id: int
    created_at: datetime
    updated_at: datetime


class RectificationPlanListResponse(CamelCaseModel):
    total: int
    items: List[RectificationPlanResponse]


class SupplierMaterialBase(CamelCaseModel):
    vendor_id: int
    material_type: str = Field(..., max_length=100)
    material_name: str = Field(..., max_length=300)
    uploaded_by: Optional[str] = None
    status: MaterialStatus = MaterialStatus.PENDING


class SupplierMaterialCreate(SupplierMaterialBase):
    file_path: str


class SupplierMaterialUpdate(CamelCaseModel):
    material_type: Optional[str] = Field(None, max_length=100)
    material_name: Optional[str] = Field(None, max_length=300)
    status: Optional[MaterialStatus] = None


class SupplierMaterialResponse(CamelCaseModel):
    id: int
    vendor_id: int
    material_type: str
    material_name: str
    upload_date: datetime
    uploaded_by: Optional[str] = None
    file_path: str
    status: MaterialStatus


class SupplierMaterialListResponse(CamelCaseModel):
    total: int
    items: List[SupplierMaterialResponse]


class ExceptionOrderBase(CamelCaseModel):
    sampling_id: int
    exception_type: ExceptionType = ExceptionType.OTHER
    impact_scope: Optional[str] = None
    responsible_person: Optional[str] = None
    root_cause: Optional[str] = None
    handling_result: Optional[str] = None
    status: ExceptionStatus = ExceptionStatus.OPEN


class ExceptionOrderCreate(ExceptionOrderBase):
    pass


class ExceptionOrderUpdate(CamelCaseModel):
    exception_type: Optional[ExceptionType] = None
    impact_scope: Optional[str] = None
    responsible_person: Optional[str] = None
    root_cause: Optional[str] = None
    handling_result: Optional[str] = None


class ExceptionStatusUpdate(CamelCaseModel):
    status: ExceptionStatus
    remark: Optional[str] = None


class ExceptionOrderResponse(ExceptionOrderBase):
    id: int
    created_at: datetime
    updated_at: datetime


class ExceptionOrderListResponse(CamelCaseModel):
    total: int
    items: List[ExceptionOrderResponse]


class StatusChangeLogResponse(CamelCaseModel):
    id: int
    entity_type: str
    entity_id: int
    old_status: Optional[str] = None
    new_status: str
    changed_by: int
    changed_at: datetime
    remark: Optional[str] = None


class StatusChangeLogListResponse(CamelCaseModel):
    total: int
    items: List[StatusChangeLogResponse]


class ExportRequest(CamelCaseModel):
    entity_type: str
    format: str = Field(default="excel", pattern="^(excel|csv)$")
    filters: Optional[Dict[str, Any]] = None


class ExportTaskResponse(CamelCaseModel):
    task_id: str
    status: str
    entity_type: str
    format: str


class SamplingCoverageResponse(CamelCaseModel):
    total_checklists: int
    sampled_checklists: int
    coverage_rate: float
    by_category: Dict[str, Dict[str, Any]]
    description: str


class DashboardStatsResponse(CamelCaseModel):
    total_checklists: int
    total_samplings: int
    total_rectifications: int
    total_exceptions: int
    pending_exceptions: int
    total_vendors: int
    sampling_coverage_rate: float
    rectification_completion_rate: float
    risk_distribution: Dict[str, int]
    sampling_coverage_description: str
