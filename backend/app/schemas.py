from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from app.models import UserRole, RiskLevel, QuestionType


class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: UserRole = UserRole.STUDENT


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TagBase(BaseModel):
    name: str
    category: Optional[str] = None
    color: Optional[str] = "#3b82f6"


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ChapterBase(BaseModel):
    name: str
    order_index: int = 0
    description: Optional[str] = None


class ChapterCreate(ChapterBase):
    course_id: Optional[int] = None


class ChapterResponse(ChapterBase):
    id: int
    course_id: int
    question_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class CourseBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None


class CourseCreate(CourseBase):
    pass


class CourseResponse(CourseBase):
    id: int
    total_questions: int = 0
    created_at: datetime
    chapters: List[ChapterResponse] = []
    teachers: List[UserResponse] = []

    class Config:
        from_attributes = True


class CourseListItem(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    total_questions: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionBase(BaseModel):
    course_id: int
    chapter_id: Optional[int] = None
    question_type: QuestionType = QuestionType.SINGLE_CHOICE
    content: str
    options: Optional[dict] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    difficulty: int = 2


class QuestionCreate(QuestionBase):
    tag_ids: List[int] = []


class QuestionUpdate(BaseModel):
    question_type: Optional[QuestionType] = None
    content: Optional[str] = None
    options: Optional[dict] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    difficulty: Optional[int] = None
    is_active: Optional[bool] = None
    tag_ids: Optional[List[int]] = []


class QuestionResponse(QuestionBase):
    id: int
    is_active: bool = True
    tags: List[TagResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PracticeRecordBase(BaseModel):
    question_id: int
    user_answer: Optional[str] = None
    is_correct: Optional[bool] = None
    score: Optional[float] = None
    time_spent: Optional[int] = None


class PracticeRecordCreate(PracticeRecordBase):
    pass


class PracticeRecordResponse(PracticeRecordBase):
    id: int
    student_id: int
    course_id: Optional[int] = None
    chapter_id: Optional[int] = None
    attempt_number: int
    created_at: datetime
    question: Optional[QuestionResponse] = None

    class Config:
        from_attributes = True


class StudyProgressBase(BaseModel):
    student_id: int
    course_id: int


class StudyProgressResponse(BaseModel):
    id: int
    student_id: int
    course_id: int
    total_questions: int
    completed_questions: int
    correct_count: int
    accuracy_rate: float
    completion_rate: float
    risk_level: RiskLevel
    last_practice_at: Optional[datetime] = None
    expected_completion_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    student: Optional[UserResponse] = None
    course: Optional[CourseListItem] = None

    class Config:
        from_attributes = True


class ReminderRuleBase(BaseModel):
    name: str
    description: Optional[str] = None
    rule_type: str = "completion_rate"
    threshold: float
    risk_level: RiskLevel = RiskLevel.WARNING
    days_without_practice: Optional[int] = None
    is_active: bool = True


class ReminderRuleCreate(ReminderRuleBase):
    pass


class ReminderRuleResponse(ReminderRuleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ReminderRecordResponse(BaseModel):
    id: int
    study_progress_id: int
    rule_id: Optional[int] = None
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class RiskRecordResponse(BaseModel):
    id: int
    study_progress_id: int
    previous_level: Optional[RiskLevel] = None
    current_level: RiskLevel
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CommunicationBase(BaseModel):
    study_progress_id: int
    message: str
    message_type: str = "comment"


class CommunicationCreate(CommunicationBase):
    pass


class CommunicationResponse(CommunicationBase):
    id: int
    sender_id: int
    sender: Optional[UserResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewConclusionBase(BaseModel):
    study_progress_id: int
    conclusion: str
    action_plan: Optional[str] = None
    risk_level_after: Optional[RiskLevel] = None


class ReviewConclusionCreate(ReviewConclusionBase):
    pass


class ReviewConclusionResponse(ReviewConclusionBase):
    id: int
    reviewer_id: int
    reviewer: Optional[UserResponse] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TodoItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    todo_type: str = "review"
    related_id: Optional[int] = None
    priority: int = 2
    due_date: Optional[datetime] = None


class TodoItemCreate(TodoItemBase):
    pass


class TodoItemResponse(TodoItemBase):
    id: int
    user_id: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CompletionTrendItem(BaseModel):
    date: str
    completion_rate: float
    student_count: int


class PaginatedResponse(BaseModel):
    items: List
    total: int
    page: int
    page_size: int
    total_pages: int
