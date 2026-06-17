import os
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError


def _detect_database():
    pg_url = os.getenv("DATABASE_URL")
    if pg_url:
        try:
            eng = create_engine(pg_url, pool_pre_ping=True)
            with eng.connect():
                return pg_url
        except (OperationalError, Exception):
            pass
    base_dir = os.path.dirname(os.path.abspath(__file__))
    sqlite_path = os.path.join(base_dir, "data", "renovation_risk.db")
    os.makedirs(os.path.dirname(sqlite_path), exist_ok=True)
    return f"sqlite:///{sqlite_path}"


DATABASE_URL = _detect_database()


def _detect_broker():
    redis_url = os.getenv("CELERY_BROKER_URL")
    if redis_url:
        return redis_url
    return "redis://localhost:6379/0"


CELERY_BROKER_URL = _detect_broker()
CELERY_RESULT_BACKEND = os.getenv(
    "CELERY_RESULT_BACKEND", "redis://localhost:6379/1"
)

DESIGN_SOFTWARE_EXPORT_FIELDS = [
    "project_id",
    "room_name",
    "item_name",
    "quantity",
    "unit_price",
    "total_price",
    "unit",
]

INTERNAL_RECORD_FIELDS = [
    "project_id",
    "room",
    "material_name",
    "qty",
    "price",
    "amount",
    "unit",
]

FIELD_MAPPING = {
    "room_name": "room",
    "item_name": "material_name",
    "quantity": "qty",
    "unit_price": "price",
    "total_price": "amount",
}

AMOUNT_TOLERANCE = 0.01

RECONCILIATION_STATUS_COLORS = {
    "matched": "#2ecc71",
    "mismatched": "#e74c3c",
    "missing_internal": "#f39c12",
    "missing_design": "#9b59b6",
}
