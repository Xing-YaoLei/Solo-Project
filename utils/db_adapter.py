import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DB_TYPE = os.getenv("DB_TYPE", "sqlite").lower()

if DB_TYPE == "sqlite":
    from scripts.database_sqlite import (
        Base, engine, SessionLocal, get_db, get_session,
        SyncBatch, Region, Coach, Member, CourseSchedule, Appointment,
        RescheduleRecord, AccessRecord, BodyTestRecord, AttendanceRecord, ConflictRecord,
        init_db, seed_test_data
    )
else:
    from utils.database import Base, engine, SessionLocal, get_db, get_session
    from models import (
        SyncBatch, Region, Coach, Member, CourseSchedule, Appointment,
        RescheduleRecord, AccessRecord, BodyTestRecord, AttendanceRecord, ConflictRecord,
    )
    from scripts.init_db import init_db

    def seed_test_data(days=60):
        print("PostgreSQL模式: 请使用Celery同步任务生成数据")
        init_db()


__all__ = [
    "Base", "engine", "SessionLocal", "get_db", "get_session",
    "SyncBatch", "Region", "Coach", "Member", "CourseSchedule", "Appointment",
    "RescheduleRecord", "AccessRecord", "BodyTestRecord", "AttendanceRecord", "ConflictRecord",
    "init_db", "seed_test_data", "DB_TYPE"
]
