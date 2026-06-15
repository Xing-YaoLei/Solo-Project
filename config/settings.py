from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Dict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    DUCKDB_PATH: str = "./data/textbook_analysis.duckdb"

    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "textbook-reports"
    MINIO_SECURE: bool = False

    APP_TITLE: str = "高校教务教材订购漏斗报表"
    APP_THEME: str = "light"
    PAGE_SIZE: int = 50

    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/app.log"

    CURRENT_TERM: str = "2025-2026-2"


FUNNEL_STAGES: List[Dict] = [
    {"code": "course_plan", "name": "课程计划", "description": "教学平台排课计划", "color": "#1E3A8A"},
    {"code": "course_selection", "name": "选课确认", "description": "学生选课完成数", "color": "#3B82F6"},
    {"code": "textbook_apply", "name": "教材申请", "description": "教师提交教材申请", "color": "#60A5FA"},
    {"code": "approval", "name": "审批通过", "description": "多级审批通过", "color": "#8B5CF6"},
    {"code": "purchase", "name": "采购完成", "description": "供应商采购完成", "color": "#A78BFA"},
    {"code": "stock_in", "name": "入库确认", "description": "教材仓库入库", "color": "#10B981"},
    {"code": "distribution", "name": "发放完成", "description": "学生领书确认", "color": "#34D399"},
]

SEVERITY_COLORS = {
    "high": "#EF4444",
    "medium": "#F97316",
    "low": "#10B981",
}

STATUS_COLORS = {
    "pending": "#F59E0B",
    "approved": "#10B981",
    "rejected": "#EF4444",
    "completed": "#3B82F6",
    "open": "#F97316",
    "closed": "#6B7280",
}

DATA_SOURCES = [
    {"id": "teaching_platform", "name": "教学平台", "type": "api"},
    {"id": "campus_card", "name": "一卡通系统", "type": "database"},
    {"id": "student_application", "name": "学生申请表", "type": "excel"},
    {"id": "classroom", "name": "教室资源系统", "type": "api"},
    {"id": "evaluation", "name": "评教系统", "type": "database"},
]

settings = Settings()
