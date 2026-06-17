import os
from pathlib import Path
from typing import Dict, List
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class MinIOConfig(BaseModel):
    endpoint: str = Field(default_factory=lambda: os.getenv("MINIO_ENDPOINT", "localhost:9000"))
    access_key: str = Field(default_factory=lambda: os.getenv("MINIO_ACCESS_KEY", "minioadmin"))
    secret_key: str = Field(default_factory=lambda: os.getenv("MINIO_SECRET_KEY", "minioadmin"))
    secure: bool = Field(default_factory=lambda: os.getenv("MINIO_SECURE", "false").lower() == "true")
    bucket: str = Field(default_factory=lambda: os.getenv("MINIO_BUCKET", "elder-care-data"))

class DuckDBConfig(BaseModel):
    path: Path = Field(default_factory=lambda: Path(os.getenv("DUCKDB_PATH", "./data/elder_care.duckdb")))

class DataSourceConfig(BaseModel):
    name: str
    description: str
    file_pattern: str
    source_type: str

DATA_SOURCES: Dict[str, DataSourceConfig] = {
    "nursing_records": DataSourceConfig(
        name="护理终端记录",
        description="护理人员终端录入的护理活动记录",
        file_pattern="nursing/*.parquet",
        source_type="nursing_terminal"
    ),
    "access_records": DataSourceConfig(
        name="门禁进出记录",
        description="老人和护理人员的门禁刷卡记录",
        file_pattern="access/*.parquet",
        source_type="access_control"
    ),
    "health_devices": DataSourceConfig(
        name="健康设备数据",
        description="智能床垫、手环等健康监测设备数据",
        file_pattern="health/*.parquet",
        source_type="health_device"
    )
}

class CareLevel(BaseModel):
    code: str
    name: str
    description: str
    daily_care_minutes: int

CARE_LEVELS: Dict[str, CareLevel] = {
    "level_1": CareLevel(code="level_1", name="自理", description="生活完全自理", daily_care_minutes=30),
    "level_2": CareLevel(code="level_2", name="半自理", description="部分生活需要协助", daily_care_minutes=60),
    "level_3": CareLevel(code="level_3", name="半失能", description="大部分生活需要照护", daily_care_minutes=90),
    "level_4": CareLevel(code="level_4", name="失能", description="完全需要照护", daily_care_minutes=120),
    "level_5": CareLevel(code="level_5", name="特护", description="24小时专人照护", daily_care_minutes=180)
}

class ActivityType(BaseModel):
    code: str
    name: str
    category: str
    standard_duration: int

ACTIVITY_TYPES: Dict[str, ActivityType] = {
    "morning_care": ActivityType(code="morning_care", name="晨间护理", category="日常护理", standard_duration=15),
    "evening_care": ActivityType(code="evening_care", name="晚间护理", category="日常护理", standard_duration=15),
    "meal_assist": ActivityType(code="meal_assist", name="协助进食", category="日常护理", standard_duration=20),
    "bathing": ActivityType(code="bathing", name="清洁沐浴", category="日常护理", standard_duration=30),
    "rehab_exercise": ActivityType(code="rehab_exercise", name="康复训练", category="康复活动", standard_duration=45),
    "physical_therapy": ActivityType(code="physical_therapy", name="物理治疗", category="康复活动", standard_duration=30),
    "mental_activity": ActivityType(code="mental_activity", name="益智活动", category="康复活动", standard_duration=40),
    "social_activity": ActivityType(code="social_activity", name="社交活动", category="康复活动", standard_duration=60),
    "medication_reminder": ActivityType(code="medication_reminder", name="用药提醒", category="医疗护理", standard_duration=10),
    "vital_signs": ActivityType(code="vital_signs", name="生命体征监测", category="医疗护理", standard_duration=15),
    "wound_care": ActivityType(code="wound_care", name="伤口护理", category="医疗护理", standard_duration=20),
    "fall_response": ActivityType(code="fall_response", name="跌倒应急处理", category="应急处理", standard_duration=30)
}

minio_config = MinIOConfig()
duckdb_config = DuckDBConfig()
