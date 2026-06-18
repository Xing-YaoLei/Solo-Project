import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)


class MinIOConfig:
    ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"
    BUCKET = os.getenv("MINIO_BUCKET", "home-decoration")


class DuckDBConfig:
    PATH = Path(os.getenv("DUCKDB_PATH", DATA_DIR / "home_decoration.duckdb"))
    PATH.parent.mkdir(exist_ok=True, parents=True)


class AppConfig:
    ENV = os.getenv("APP_ENV", "development")
    PORT = int(os.getenv("APP_PORT", "8501"))
    TITLE = "家装工地客户确认风险监测"


class SyncStatus:
    PENDING = "待同步"
    RUNNING = "同步中"
    SUCCESS = "成功"
    FAILED = "失败"
    PARTIAL = "部分成功"


class DataSource:
    DESIGN_EXPORT = "design_export"
    PAYMENT_RECORD = "payment_record"
    PURCHASE_ORDER = "purchase_order"


DATA_SOURCE_LABELS = {
    DataSource.DESIGN_EXPORT: "设计软件导出",
    DataSource.PAYMENT_RECORD: "收款记录",
    DataSource.PURCHASE_ORDER: "采购单记录",
}

REGIONS = ["华东区", "华南区", "华北区", "华中区", "西南区", "西北区", "东北区"]

ATTACHMENT_CATEGORIES = [
    "设计图纸",
    "施工合同",
    "材料清单",
    "验收报告",
    "变更签证",
    "客户身份证明",
    "收款凭证",
    "采购发票",
]

TAG_GROUPS = [
    "施工阶段",
    "风险等级",
    "客户类型",
    "房屋类型",
    "装修风格",
]

RISK_LEVELS = ["低风险", "中风险", "高风险", "极高风险"]
