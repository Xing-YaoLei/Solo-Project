from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
import json

from src.data import DuckDBStore


@dataclass
class ThresholdDefinition:
    key: str
    name: str
    description: str
    category: str
    default_value: Any
    value_type: str = "number"
    unit: Optional[str] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    options: Optional[List[Dict]] = None


class ThresholdService:
    def __init__(self, db: DuckDBStore):
        self.db = db
        self._default_thresholds = self._get_default_definitions()
        self._ensure_defaults()

    def _get_default_definitions(self) -> Dict[str, ThresholdDefinition]:
        return {
            "fall_response_time_max": ThresholdDefinition(
                key="fall_response_time_max",
                name="跌倒响应时间阈值",
                description="护理人员接报后到达现场的最大允许时间（分钟）",
                category="应急处理",
                default_value=15,
                value_type="number",
                unit="分钟",
                min_value=1,
                max_value=60
            ),
            "fall_quality_min_score": ThresholdDefinition(
                key="fall_quality_min_score",
                name="跌倒处理最低质量分",
                description="跌倒事件处理的最低合格质量评分",
                category="应急处理",
                default_value=80,
                value_type="number",
                unit="分",
                min_value=0,
                max_value=100
            ),
            "care_compliance_warning": ThresholdDefinition(
                key="care_compliance_warning",
                name="护理达标预警线",
                description="护理完成率低于此值时触发预警",
                category="护理达标",
                default_value=80,
                value_type="number",
                unit="%",
                min_value=50,
                max_value=100
            ),
            "rehab_minutes_per_week": ThresholdDefinition(
                key="rehab_minutes_per_week",
                name="每周最低康复时长",
                description="每位老人每周应达到的最低康复活动时长",
                category="康复活动",
                default_value=180,
                value_type="number",
                unit="分钟",
                min_value=0,
                max_value=600
            ),
            "rehab_activity_diversity": ThresholdDefinition(
                key="rehab_activity_diversity",
                name="康复活动多样性要求",
                description="每周应参与的不同类型康复活动数量",
                category="康复活动",
                default_value=3,
                value_type="number",
                unit="种",
                min_value=1,
                max_value=10
            ),
            "vital_heart_rate_min": ThresholdDefinition(
                key="vital_heart_rate_min",
                name="心率异常下限",
                description="心率低于此值判定为异常",
                category="健康监测",
                default_value=50,
                value_type="number",
                unit="次/分",
                min_value=30,
                max_value=80
            ),
            "vital_heart_rate_max": ThresholdDefinition(
                key="vital_heart_rate_max",
                name="心率异常上限",
                description="心率高于此值判定为异常",
                category="健康监测",
                default_value=100,
                value_type="number",
                unit="次/分",
                min_value=80,
                max_value=150
            ),
            "vital_bp_systolic_max": ThresholdDefinition(
                key="vital_bp_systolic_max",
                name="收缩压异常上限",
                description="收缩压高于此值判定为异常",
                category="健康监测",
                default_value=140,
                value_type="number",
                unit="mmHg",
                min_value=120,
                max_value=180
            ),
            "vital_blood_oxygen_min": ThresholdDefinition(
                key="vital_blood_oxygen_min",
                name="血氧异常下限",
                description="血氧饱和度低于此值判定为异常",
                category="健康监测",
                default_value=92,
                value_type="number",
                unit="%",
                min_value=85,
                max_value=98
            ),
            "data_cleaning_valid_duration_min": ThresholdDefinition(
                key="data_cleaning_valid_duration_min",
                name="有效活动最短时长",
                description="活动时长低于此值视为无效记录",
                category="数据清洗",
                default_value=1,
                value_type="number",
                unit="分钟",
                min_value=0,
                max_value=10
            ),
            "data_cleaning_valid_duration_max": ThresholdDefinition(
                key="data_cleaning_valid_duration_max",
                name="有效活动最长时长",
                description="活动时长高于此值视为异常记录",
                category="数据清洗",
                default_value=480,
                value_type="number",
                unit="分钟",
                min_value=60,
                max_value=720
            ),
        }

    def _ensure_defaults(self):
        existing = self.db.get_threshold_config()
        for key, definition in self._default_thresholds.items():
            if key not in existing:
                self.db.set_threshold_config(
                    key=key,
                    value=definition.default_value,
                    description=definition.description,
                    category=definition.category,
                    updated_by="system_init"
                )

    def get_all_thresholds(self) -> List[Dict]:
        configs = self.db.get_threshold_config()
        result = []
        for key, definition in self._default_thresholds.items():
            value = configs.get(key, definition.default_value)
            result.append({
                "key": key,
                "name": definition.name,
                "description": definition.description,
                "category": definition.category,
                "value": value,
                "default_value": definition.default_value,
                "value_type": definition.value_type,
                "unit": definition.unit,
                "min_value": definition.min_value,
                "max_value": definition.max_value
            })
        return result

    def get_thresholds_by_category(self, category: str) -> List[Dict]:
        all_thresholds = self.get_all_thresholds()
        return [t for t in all_thresholds if t["category"] == category]

    def get_threshold_value(self, key: str) -> Any:
        configs = self.db.get_threshold_config()
        if key in configs:
            return configs[key]
        if key in self._default_thresholds:
            return self._default_thresholds[key].default_value
        return None

    def update_threshold(self, key: str, value: Any, updated_by: str = "admin") -> bool:
        if key not in self._default_thresholds:
            return False
        
        definition = self._default_thresholds[key]
        
        if definition.min_value is not None and float(value) < definition.min_value:
            raise ValueError(f"{definition.name}不能低于{definition.min_value}{definition.unit or ''}")
        if definition.max_value is not None and float(value) > definition.max_value:
            raise ValueError(f"{definition.name}不能高于{definition.max_value}{definition.unit or ''}")
        
        self.db.set_threshold_config(
            key=key,
            value=value,
            description=definition.description,
            category=definition.category,
            updated_by=updated_by
        )
        return True

    def get_categories(self) -> List[str]:
        return sorted(list(set([t.category for t in self._default_thresholds.values()])))

    def validate_fall_response(self, response_minutes: int, quality_score: int) -> Dict:
        max_response = self.get_threshold_value("fall_response_time_max")
        min_quality = self.get_threshold_value("fall_quality_min_score")
        
        return {
            "response_time_compliant": response_minutes <= max_response,
            "response_time_threshold": max_response,
            "quality_compliant": quality_score >= min_quality,
            "quality_threshold": min_quality,
            "overall_compliant": (response_minutes <= max_response) and (quality_score >= min_quality)
        }

    def validate_care_compliance(self, completion_rate: float) -> Dict:
        warning_line = self.get_threshold_value("care_compliance_warning")
        
        return {
            "is_compliant": completion_rate >= 100,
            "is_warning": completion_rate < warning_line,
            "warning_threshold": warning_line
        }

    def validate_rehab_activity(self, weekly_minutes: int, activity_types_count: int) -> Dict:
        min_minutes = self.get_threshold_value("rehab_minutes_per_week")
        min_diversity = self.get_threshold_value("rehab_activity_diversity")
        
        return {
            "minutes_compliant": weekly_minutes >= min_minutes,
            "minutes_required": min_minutes,
            "diversity_compliant": activity_types_count >= min_diversity,
            "diversity_required": min_diversity,
            "overall_compliant": weekly_minutes >= min_minutes and activity_types_count >= min_diversity
        }
