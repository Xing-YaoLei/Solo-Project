from dataclasses import dataclass, field
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from enum import Enum


class ActivityStatus(str, Enum):
    PLANNED = "计划中"
    IN_PROGRESS = "进行中"
    COMPLETED = "已完成"
    CANCELLED = "已取消"
    MISSED = "未参与"


class RiskLevel(str, Enum):
    LOW = "低风险"
    MEDIUM = "中风险"
    HIGH = "高风险"
    CRITICAL = "极高风险"


class RiskType(str, Enum):
    FALL = "跌倒"
    PRESSURE_SORE = "压疮"
    MEDICATION_ERROR = "用药错误"
    INFECTION = "感染"
    NUTRITION = "营养问题"
    OTHER = "其他"


class DataSource(str, Enum):
    NURSING_TERMINAL = "护理终端"
    CHARGING_SYSTEM = "收费系统"
    HEALTH_DEVICE = "健康设备"
    MANUAL = "人工录入"


class AnomalyType(str, Enum):
    TERMINAL_DELAY = "护理终端延迟"
    CHARGING_MISSING = "收费系统缺失"
    DEVICE_CALIBER_CHANGE = "健康设备口径变化"
    FALL_IMPACT = "跌倒影响"


@dataclass
class ElderProfile:
    elder_id: str
    name: str
    gender: str
    age: int
    room_number: str
    admission_date: date
    health_level: str
    care_level: str
    medical_history: List[str] = field(default_factory=list)
    contact_person: str = ""
    contact_phone: str = ""
    notes: str = ""


@dataclass
class RehabilitationActivity:
    activity_id: str
    activity_name: str
    activity_type: str
    plan_date: date
    plan_start_time: str
    plan_end_time: str
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    elder_id: str = ""
    elder_name: str = ""
    therapist: str = ""
    status: ActivityStatus = ActivityStatus.PLANNED
    checkin_time: Optional[datetime] = None
    is_compliant: bool = False
    non_compliant_reason: str = ""
    data_source: DataSource = DataSource.NURSING_TERMINAL
    notes: str = ""


@dataclass
class RiskEvent:
    event_id: str
    event_type: RiskType
    event_time: datetime
    elder_id: str
    elder_name: str
    location: str
    risk_level: RiskLevel
    description: str
    handler: str = ""
    handle_time: Optional[datetime] = None
    handle_result: str = ""
    follow_up_required: bool = False
    follow_up_notes: str = ""
    is_impact_trend: bool = False
    impact_days: int = 0


@dataclass
class ActivityCheckin:
    checkin_id: str
    activity_id: str
    elder_id: str
    elder_name: str
    checkin_time: datetime
    checkin_method: str
    terminal_id: str = ""
    is_late: bool = False
    delay_minutes: int = 0
    data_source: DataSource = DataSource.NURSING_TERMINAL


@dataclass
class AnomalyRecord:
    anomaly_id: str
    anomaly_type: AnomalyType
    detect_time: datetime
    description: str
    affected_period_start: Optional[datetime] = None
    affected_period_end: Optional[datetime] = None
    affected_elder_ids: List[str] = field(default_factory=list)
    severity: str = "medium"
    review_notes: str = ""
    handle_conclusion: str = ""
    is_resolved: bool = False


@dataclass
class ComplianceTask:
    task_id: str
    elder_id: str
    elder_name: str
    task_type: str
    compliance_rate: float
    threshold: float
    start_date: str
    end_date: str
    create_time: datetime
    due_time: Optional[datetime] = None
    handler: str = ""
    status: str = "pending"
    notes: str = ""
    resolution: str = ""
    resolve_time: Optional[datetime] = None


@dataclass
class FunnelStage:
    stage_name: str
    count: int
    rate: float
    cumulative_rate: float
    notes: str = ""
