from datetime import datetime, date
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field

from app.models import (
    UserRole, CourseStatus, ProgressStatus,
    NotificationStatus, AssignmentType
)


class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.MEMBER


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None


class User(UserBase):
    id: int
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


class TagBase(BaseModel):
    name: str
    color: str = "#3B82F6"


class TagCreate(TagBase):
    pass


class Tag(TagBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AssignmentTagBase(BaseModel):
    assignment_id: int
    tag_id: int


class AssignmentTag(AssignmentTagBase):
    id: int
    tag: Tag

    class Config:
        from_attributes = True


class AssignmentBase(BaseModel):
    chapter_id: int
    title: str
    description: Optional[str] = None
    assignment_type: AssignmentType = AssignmentType.EXERCISE
    sets: Optional[int] = None
    reps: Optional[str] = None
    weight: Optional[float] = None
    duration_minutes: Optional[int] = None


class AssignmentCreate(AssignmentBase):
    tag_ids: Optional[List[int]] = None


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignment_type: Optional[AssignmentType] = None
    sets: Optional[int] = None
    reps: Optional[str] = None
    weight: Optional[float] = None
    duration_minutes: Optional[int] = None
    is_completed: Optional[bool] = None
    member_note: Optional[str] = None
    trainer_feedback: Optional[str] = None
    tag_ids: Optional[List[int]] = None


class Assignment(AssignmentBase):
    id: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    member_note: Optional[str] = None
    trainer_feedback: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    tags: List[AssignmentTag] = []

    class Config:
        from_attributes = True


class ChapterBase(BaseModel):
    course_id: int
    title: str
    description: Optional[str] = None
    chapter_order: int = 0
    duration_minutes: int = 0


class ChapterCreate(ChapterBase):
    pass


class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    chapter_order: Optional[int] = None
    duration_minutes: Optional[int] = None
    is_completed: Optional[bool] = None


class Chapter(ChapterBase):
    id: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    assignments: List[Assignment] = []

    class Config:
        from_attributes = True


class CourseMemberBase(BaseModel):
    course_id: int
    member_id: int
    expected_progress_rate: float = 0.0


class CourseMemberCreate(CourseMemberBase):
    pass


class CourseMember(CourseMemberBase):
    id: int
    joined_at: datetime
    actual_progress_rate: float = 0.0
    member: User

    class Config:
        from_attributes = True


class CourseBase(BaseModel):
    name: str
    description: Optional[str] = None
    cover_url: Optional[str] = None
    trainer_id: int
    total_sessions: int = 0
    total_duration_hours: float = 0.0
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class CourseCreate(CourseBase):
    member_ids: Optional[List[int]] = None


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cover_url: Optional[str] = None
    total_sessions: Optional[int] = None
    total_duration_hours: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[CourseStatus] = None


class Course(CourseBase):
    id: int
    status: CourseStatus
    created_at: datetime
    updated_at: datetime
    trainer: User
    chapters: List[Chapter] = []
    members: List[CourseMember] = []

    class Config:
        from_attributes = True


class CourseListItem(BaseModel):
    id: int
    name: str
    status: CourseStatus
    total_sessions: int
    total_duration_hours: float
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    trainer_name: str
    member_count: int
    completion_rate: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True


class ProgressRecordBase(BaseModel):
    course_id: int
    member_id: int
    new_progress: float
    consumed_sessions: int = 0
    remaining_sessions: int = 0
    change_reason: Optional[str] = None
    chapter_id: Optional[int] = None
    extra_data: Optional[Dict[str, Any]] = None


class ProgressRecordCreate(ProgressRecordBase):
    operator_id: int


class ProgressRecord(BaseModel):
    id: int
    course_id: int
    member_id: int
    chapter_id: Optional[int] = None
    operator_id: int
    old_progress: float
    new_progress: float
    progress_status: ProgressStatus
    consumed_sessions: int
    remaining_sessions: int
    change_reason: Optional[str] = None
    extra_data: Dict[str, Any] = {}
    created_at: datetime
    operator: User
    member: User
    course: Course

    class Config:
        from_attributes = True


class NotificationBase(BaseModel):
    course_id: int
    from_user_id: int
    to_user_id: int
    member_id: int
    title: str
    content: str
    expected_progress: float = 0.0
    actual_progress: float = 0.0
    gap_hours: float = 0.0


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    status: Optional[NotificationStatus] = None
    delay_reason: Optional[str] = None
    action_taken: Optional[str] = None
    closed_by_id: Optional[int] = None


class Notification(BaseModel):
    id: int
    course_id: int
    from_user_id: int
    to_user_id: int
    member_id: int
    title: str
    content: str
    status: NotificationStatus
    delay_reason: Optional[str] = None
    action_taken: Optional[str] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    closed_by_id: Optional[int] = None
    expected_progress: float
    actual_progress: float
    gap_hours: float
    created_at: datetime
    updated_at: datetime
    course: Course
    from_user: User
    to_user: User
    member: User
    closed_by: Optional[User] = None

    class Config:
        from_attributes = True


class MonthlyReviewQuery(BaseModel):
    year: int
    month: int
    trainer_id: Optional[int] = None
    member_id: Optional[int] = None
    course_id: Optional[int] = None


class CourseMonthlyStats(BaseModel):
    course_id: int
    course_name: str
    trainer_name: str
    member_name: str
    total_sessions: int
    consumed_sessions: int
    remaining_sessions: int
    expected_progress: float
    actual_progress: float
    completion_rate: float
    is_behind: bool
    gap: float


class MonthlyReviewResponse(BaseModel):
    year: int
    month: int
    total_courses: int
    total_members: int
    overall_completion_rate: float
    on_track_count: int
    behind_count: int
    completed_count: int
    course_stats: List[CourseMonthlyStats]


class ExportLogResponse(BaseModel):
    id: int
    export_type: str
    filter_conditions: Dict[str, Any]
    file_name: Optional[str] = None
    generated_at: datetime
    operator_name: str

    class Config:
        from_attributes = True
