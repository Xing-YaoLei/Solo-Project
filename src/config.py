import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)


class MinIOConfig:
    ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"
    BUCKET_DATA = os.getenv("MINIO_BUCKET_DATA", "cleaning-data")
    BUCKET_AUDIT = os.getenv("MINIO_BUCKET_AUDIT", "audit-logs")


class DuckDBConfig:
    PATH = os.getenv("DUCKDB_PATH", str(DATA_DIR / "cleaning_report.duckdb"))


class AppConfig:
    SECRET_KEY = os.getenv("APP_SECRET_KEY", "dev-secret-key-change-in-production")
    DEBUG = os.getenv("DEBUG", "true").lower() == "true"


class DataSourceConfig:
    PAYMENT_FLOW_PREFIX = "payment_flows/"
    E_CONTRACT_PREFIX = "e_contracts/"
    METER_READING_PREFIX = "meter_readings/"
    CLEANING_SCHEDULE_PREFIX = "cleaning_schedules/"


class Role:
    TENANT = "tenant"
    HOUSEKEEPER = "housekeeper"
    MAINTENANCE = "maintenance"
    FINANCE = "finance"
    EXTERNAL = "external"
    ADMIN = "admin"

    ALL_ROLES = [TENANT, HOUSEKEEPER, MAINTENANCE, FINANCE, EXTERNAL, ADMIN]


ROLE_PERMISSIONS = {
    Role.ADMIN: {
        "view_sensitive": True,
        "view_payment": True,
        "view_contract": True,
        "view_all_regions": True,
        "export_data": True,
        "manage_shares": True,
    },
    Role.FINANCE: {
        "view_sensitive": True,
        "view_payment": True,
        "view_contract": True,
        "view_all_regions": True,
        "export_data": True,
        "manage_shares": False,
    },
    Role.HOUSEKEEPER: {
        "view_sensitive": False,
        "view_payment": False,
        "view_contract": False,
        "view_all_regions": True,
        "export_data": False,
        "manage_shares": False,
    },
    Role.MAINTENANCE: {
        "view_sensitive": False,
        "view_payment": False,
        "view_contract": False,
        "view_all_regions": True,
        "export_data": False,
        "manage_shares": False,
    },
    Role.TENANT: {
        "view_sensitive": False,
        "view_payment": False,
        "view_contract": False,
        "view_all_regions": False,
        "export_data": False,
        "manage_shares": False,
    },
    Role.EXTERNAL: {
        "view_sensitive": False,
        "view_payment": False,
        "view_contract": False,
        "view_all_regions": False,
        "export_data": False,
        "manage_shares": False,
    },
}


class SyncNodeStatus:
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"


CAPACITY_RULES = {
    "cleaner_daily_max": 8,
    "cleaner_weekly_max": 40,
    "apartment_cleaning_hours": 2,
    "peak_hours": ["09:00", "12:00", "14:00", "17:00"],
    "region_cleaners": {"东城区": 5, "西城区": 4, "朝阳区": 6, "海淀区": 5, "丰台区": 3},
}
