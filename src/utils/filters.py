from typing import Dict, Optional, Any
from datetime import datetime


def build_filter_conditions(filters: Optional[Dict]) -> Dict:
    if not filters:
        return {}

    cleaned = {}
    for key, value in filters.items():
        if value is None or value == "":
            continue
        if isinstance(value, list) and len(value) == 0:
            continue
        cleaned[key] = value

    return cleaned


def generate_filter_description(filters: Optional[Dict]) -> str:
    if not filters:
        return "无筛选条件"

    descriptions = []
    filter_labels = {
        "dept_id": "院系",
        "grade": "年级",
        "major": "专业",
        "course_type": "课程类型",
        "order_status": "订购状态",
        "term_id": "学期",
        "severity": "严重程度",
        "gap_type": "缺口类型",
        "anomaly_type": "异常类型",
    }

    for key, value in filters.items():
        if value is None or value == "":
            continue
        label = filter_labels.get(key, key)
        if isinstance(value, list):
            value_str = ", ".join(str(v) for v in value)
            descriptions.append(f"{label}: [{value_str}]")
        else:
            descriptions.append(f"{label}: {value}")

    return " | ".join(descriptions) if descriptions else "无筛选条件"


def generate_filter_metadata(filters: Optional[Dict]) -> Dict:
    metadata = {
        "generated_at": datetime.now().isoformat(),
        "filter_count": len(filters) if filters else 0,
        "filters": filters or {},
        "description": generate_filter_description(filters),
    }
    return metadata


def serialize_filters(filters: Optional[Dict]) -> str:
    if not filters:
        return ""

    parts = []
    for key, value in filters.items():
        if value is None or value == "":
            continue
        if isinstance(value, list):
            value_str = "_".join(str(v) for v in value)
        else:
            value_str = str(value)
        parts.append(f"{key}_{value_str}")

    return "_".join(parts)
