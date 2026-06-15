from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any


class TagTrendItem(BaseModel):
    date: str
    tag: str
    count: int


class TagTrendResponse(BaseModel):
    data: List[TagTrendItem]
    tags: List[str]
    date_range: List[str]
    refreshed_at: datetime
    completion_rate_formula: str


class ProgressCompositionItem(BaseModel):
    category: str
    value: float
    count: int


class ProgressCompositionResponse(BaseModel):
    data: List[ProgressCompositionItem]
    total: int
    refreshed_at: datetime
    completion_rate_formula: str


class GradeFeedbackItem(BaseModel):
    student_id: str
    student_name: str
    course: str
    chapter: str
    score: float
    total_questions: int
    correct_count: int
    time_spent: int
    submit_time: datetime


class GradeFeedbackResponse(BaseModel):
    data: List[GradeFeedbackItem]
    total: int
    page: int
    page_size: int
    refreshed_at: datetime
    completion_rate_formula: str


class AnomalyAlertItem(BaseModel):
    id: int
    rule_name: str
    rule_type: str
    student_id: str
    student_name: str
    course: str
    description: str
    severity: str
    detected_at: datetime
    is_resolved: bool


class AnomalyAlertResponse(BaseModel):
    data: List[AnomalyAlertItem]
    total: int
    severity_stats: Dict[str, int]
    refreshed_at: datetime
    completion_rate_formula: str


class ChapterRankItem(BaseModel):
    chapter_id: str
    chapter_name: str
    course: str
    total_students: int
    completed_students: int
    completion_rate: float
    avg_score: float


class ChapterRankResponse(BaseModel):
    data: List[ChapterRankItem]
    total: int
    view_mode: str
    refreshed_at: datetime
    completion_rate_formula: str


class ShareTokenCreate(BaseModel):
    chart_type: str
    permissions: Dict[str, Any]
    expire_hours: Optional[int] = 72


class ShareTokenResponse(BaseModel):
    token: str
    chart_type: str
    permissions: Dict[str, Any]
    expires_at: datetime
    share_url: str


class RefreshInfoResponse(BaseModel):
    data_source: str
    refreshed_at: datetime
    status: str
    record_count: int
