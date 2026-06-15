import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "edu_funnel")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

    SQLALCHEMY_DATABASE_URI = (
        f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}"
        f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    PORT = int(os.getenv("PORT", "8050"))

    FUNNEL_STAGES = [
        "课程目录发布",
        "学生浏览课程",
        "提交选课申请",
        "教务初审",
        "排课分配教室",
        "终审通过",
        "选课成功"
    ]

    CONFLICT_COLOR = "#FF4D4F"
    WARNING_COLOR = "#FAAD14"
    SUCCESS_COLOR = "#52C41A"
    INFO_COLOR = "#1890FF"

    ACADEMIC_TERMS = ["2025-2026-1", "2025-2026-2", "2026-2027-1"]

    TIME_SLOTS = [
        "08:00-09:40",
        "10:00-11:40",
        "14:00-15:40",
        "16:00-17:40",
        "19:00-20:40"
    ]

    WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]


class SyncSourceConfig:
    STUDENT_APPLICATION = {
        "name": "学生申请表",
        "description": "来自学生端的选课申请原始数据",
        "sync_interval_minutes": 30,
    }
    TEACHING_PLATFORM = {
        "name": "教学平台",
        "description": "教务教学管理平台课程与排课数据",
        "sync_interval_minutes": 60,
    }
    SMART_CARD = {
        "name": "一卡通系统",
        "description": "校园一卡通的学生身份与消费验证数据",
        "sync_interval_minutes": 120,
    }
