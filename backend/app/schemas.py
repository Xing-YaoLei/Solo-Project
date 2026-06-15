from typing import List, Optional, Any
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field, EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class UserBase(BaseModel):
    username: str
    full_name: str
    email: Optional[str] = None
    role: str = "teacher"
    department: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    full_name: str
    email: Optional[str]
    role: str
    department: Optional[str]
    created_at: datetime


class StudentBase(BaseModel):
    student_id: str
    name: str
    gender: Optional[str] = None
    grade: Optional[str] = None
    major: Optional[str] = None
    class_name: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    advisor_id: Optional[int] = None


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    grade: Optional[str] = None
    major: Optional[str] = None
    class_name: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    advisor_id: Optional[int] = None


class StudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: str
    name: str
    gender: Optional[str] = None
    grade: Optional[str] = None
    major: Optional[str] = None
    class_name: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    advisor_id: Optional[int] = None
    advisor_name: Optional[str] = None
    created_at: datetime


class CourseBase(BaseModel):
    course_code: str
    course_name: str
    credit: float
    semester: Optional[str] = None
    department: Optional[str] = None


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    course_code: str
    course_name: str
    credit: float
    semester: Optional[str] = None
    department: Optional[str] = None


class ScoreBase(BaseModel):
    student_id: int
    course_id: int
    usual_score: Optional[float] = None
    midterm_score: Optional[float] = None
    final_score: Optional[float] = None
    total_score: float
    grade_point: Optional[float] = None
    score_level: Optional[str] = None
    semester: Optional[str] = None
    teacher_id: Optional[int] = None


class ScoreCreate(ScoreBase):
    pass


class ScoreUpdate(BaseModel):
    usual_score: Optional[float] = None
    midterm_score: Optional[float] = None
    final_score: Optional[float] = None
    total_score: Optional[float] = None
    grade_point: Optional[float] = None
    score_level: Optional[str] = None


class ScoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    course_id: int
    usual_score: Optional[float] = None
    midterm_score: Optional[float] = None
    final_score: Optional[float] = None
    total_score: float
    grade_point: Optional[float] = None
    score_level: Optional[str] = None
    semester: Optional[str] = None
    teacher_id: Optional[int] = None
    course_name: Optional[str] = None
    course_code: Optional[str] = None
    teacher_name: Optional[str] = None


class ReviewMaterial(BaseModel):
    name: str
    type: str
    url: str
    uploaded_at: datetime


class ReviewBase(BaseModel):
    student_id: int
    course_id: int
    reason: str
    expected_score: Optional[float] = None
    deadline: Optional[date] = None


class ReviewCreate(ReviewBase):
    score_id: Optional[int] = None


class ReviewUpdate(BaseModel):
    status: Optional[str] = None
    review_result: Optional[str] = None
    adjusted_score: Optional[float] = None
    reviewer_id: Optional[int] = None
    handler_id: Optional[int] = None
    missing_materials: Optional[List[str]] = None
    materials: Optional[List[dict]] = None


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    course_id: int
    score_id: Optional[int] = None
    application_no: Optional[str] = None
    reason: str
    current_score: float
    expected_score: Optional[float] = None
    status: str
    materials: List[Any] = []
    missing_materials: List[Any] = []
    reviewer_id: Optional[int] = None
    handler_id: Optional[int] = None
    review_result: Optional[str] = None
    adjusted_score: Optional[float] = None
    applied_at: datetime
    reviewed_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    deadline: Optional[date] = None
    student_name: Optional[str] = None
    student_no: Optional[str] = None
    course_name: Optional[str] = None
    course_code: Optional[str] = None
    reviewer_name: Optional[str] = None
    handler_name: Optional[str] = None


class ReviewRecordView(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    students: List[StudentResponse] = []
    scores: List[ScoreResponse] = []
    reviews: List[ReviewResponse] = []
    total_students: int = 0
    total_reviews: int = 0


class AdvisorQuotaBase(BaseModel):
    advisor_id: int
    semester: str
    max_quota: int
    current_assigned: int = 0
    department: Optional[str] = None


class AdvisorQuotaCreate(AdvisorQuotaBase):
    pass


class AdvisorQuotaUpdate(BaseModel):
    max_quota: Optional[int] = None
    current_assigned: Optional[int] = None
    department: Optional[str] = None
    reason: Optional[str] = None


class AdvisorQuotaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    advisor_id: int
    semester: str
    max_quota: int
    current_assigned: int
    department: Optional[str] = None
    advisor_name: Optional[str] = None
    remaining_quota: int = 0
    created_at: datetime
    updated_at: datetime


class AdvisorQuotaChangeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    quota_id: int
    old_value: int
    new_value: int
    reason: Optional[str] = None
    changed_at: datetime
    changed_by_name: Optional[str] = None


class ClassroomBase(BaseModel):
    building: str
    room_no: str
    capacity: int
    room_type: Optional[str] = None
    equipment: List[str] = []


class ClassroomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    building: str
    room_no: str
    capacity: int
    room_type: Optional[str] = None
    equipment: List[Any] = []


class ClassroomScheduleBase(BaseModel):
    classroom_id: int
    course_id: Optional[int] = None
    date: date
    period_start: int
    period_end: int
    usage_type: Optional[str] = None
    actual_attendance: Optional[int] = None


class ClassroomUtilization(BaseModel):
    classroom_id: int
    building: str
    room_no: str
    capacity: int
    total_periods: int
    used_periods: int
    utilization_rate: float
    avg_attendance: Optional[float] = None


class MonthlyReviewSummary(BaseModel):
    year_month: str
    total_reviews: int
    pending_count: int
    under_review_count: int
    materials_missing_count: int
    approved_count: int
    rejected_count: int
    closed_count: int
    avg_processing_days: Optional[float] = None


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: str
    recipient_id: int
    review_id: Optional[int] = None
    title: str
    content: str
    reason: Optional[str] = None
    action_taken: Optional[str] = None
    closed_at: Optional[datetime] = None
    is_read: bool
    is_processed: bool
    created_at: datetime
    recipient_name: Optional[str] = None


class NotificationProcess(BaseModel):
    action_taken: str
    close: bool = False


class ReportDownloadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    report_name: str
    report_type: str
    filter_criteria: dict
    generated_by_id: int
    file_path: Optional[str] = None
    file_format: str
    download_count: int
    status: str
    generated_at: datetime
    generated_by_name: Optional[str] = None


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    review_id: Optional[int] = None
    operator_id: int
    old_values: Optional[dict] = None
    new_values: Optional[dict] = None
    reason: Optional[str] = None
    action_taken: Optional[str] = None
    closed_at: Optional[datetime] = None
    created_at: datetime
    operator_name: Optional[str] = None


class Pagination(BaseModel):
    page: int = 1
    page_size: int = 20
    total: int = 0
    total_pages: int = 0
