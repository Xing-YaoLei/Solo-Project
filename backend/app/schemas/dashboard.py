from pydantic import BaseModel, Field
from typing import List


class OverviewMetrics(BaseModel):
    totalStudents: int = Field(..., description="总学员数")
    totalCompletionRate: float = Field(..., description="总完成率")
    avgPracticeDuration: int = Field(..., description="平均练习时长(秒)")
    todayActiveUsers: int = Field(..., description="今日活跃用户")
    completionRateChange: float = Field(..., description="完成率环比变化")
    practiceCountChange: float = Field(..., description="练习次数环比变化")


class TrendDataPoint(BaseModel):
    date: str
    completionRate: float
    practiceCount: int


class TrendResponse(BaseModel):
    data: List[TrendDataPoint]
    timeRange: str


class ChapterDistribution(BaseModel):
    courseName: str
    chapterName: str
    questionCount: int
    completedCount: int
    completionRate: float


class FunnelStage(BaseModel):
    stage: str
    value: int
    conversionRate: float


class TagRank(BaseModel):
    tagName: str
    practiceCount: int
    correctRate: float


class ProgressTrend(BaseModel):
    date: str
    className: str
    progress: float
