import os
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)


@dataclass
class MinIOConfig:
    endpoint: str
    access_key: str
    secret_key: str
    secure: bool
    bucket: str
    use_local_fallback: bool = True


@dataclass
class DuckDBConfig:
    db_path: Path


@dataclass
class AppConfig:
    env: str
    minio: MinIOConfig
    duckdb: DuckDBConfig
    target_attendance_rate: float = 0.85


def _get_bool_env(key: str, default: bool = False) -> bool:
    val = os.getenv(key)
    if val is None:
        return default
    return val.lower() in ("true", "1", "yes", "t")


def _get_env(key: str, default: Optional[str] = None, required: bool = False) -> str:
    val = os.getenv(key, default)
    if required and val is None:
        raise EnvironmentError(f"Missing required environment variable: {key}")
    return val or ""


def load_config() -> AppConfig:
    minio_config = MinIOConfig(
        endpoint=_get_env("MINIO_ENDPOINT", "localhost:9000"),
        access_key=_get_env("MINIO_ACCESS_KEY", "minioadmin"),
        secret_key=_get_env("MINIO_SECRET_KEY", "minioadmin"),
        secure=_get_bool_env("MINIO_SECURE", False),
        bucket=_get_env("MINIO_BUCKET", "beauty-store"),
    )

    duckdb_path = Path(_get_env("DUCKDB_PATH", str(DATA_DIR / "beauty_warehouse.duckdb")))
    duckdb_path.parent.mkdir(parents=True, exist_ok=True)

    return AppConfig(
        env=_get_env("ENV", "development"),
        minio=minio_config,
        duckdb=DuckDBConfig(db_path=duckdb_path),
    )


USER_ROLES = {
    "management": "管理层",
    "frontline": "一线员工",
}

TECHNICIANS = [
    "张技师",
    "李技师",
    "王技师",
    "刘技师",
    "陈技师",
    "杨技师",
]

STORES = [
    "总店",
    "朝阳店",
    "海淀店",
    "西城店",
]

PRODUCT_CATEGORIES = [
    "面部护理",
    "身体护理",
    "美甲美睫",
    "美发造型",
    "养生SPA",
]
