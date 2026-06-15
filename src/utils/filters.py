from typing import Dict, Optional, Any, Tuple
from datetime import datetime


def build_filter_conditions(filters: Optional[Dict]) -> Tuple[str, Dict]:
    if not filters:
        return "", {}

    conditions = []
    params = {}
    param_idx = 1

    cleaned = {}
    for key, value in filters.items():
        if value is None or value == "" or value == "全部":
            continue
        if isinstance(value, list) and len(value) == 0:
            continue
        if key == "search_text" and (value is None or value == ""):
            continue
        if key in ["price_min", "price_max"]:
            if key == "price_min" and (value is None or value <= 0):
                continue
            if key == "price_max" and (value is None or value >= 200):
                continue
        cleaned[key] = value

    if not cleaned:
        return "", {}

    for key, value in cleaned.items():
        if key == "term_id":
            conditions.append(f"o.term_id = ${param_idx}")
            params[str(param_idx)] = value
            param_idx += 1
        elif key == "dept_id":
            conditions.append(f"c.dept_id = ${param_idx}")
            params[str(param_idx)] = value
            param_idx += 1
        elif key == "course_id":
            conditions.append(f"o.course_id = ${param_idx}")
            params[str(param_idx)] = value
            param_idx += 1
        elif key == "grade":
            conditions.append(f"c.grade = ${param_idx}")
            params[str(param_idx)] = value
            param_idx += 1
        elif key == "major":
            conditions.append(f"c.major LIKE ${param_idx}")
            params[str(param_idx)] = f"%{value}%"
            param_idx += 1
        elif key == "course_type":
            conditions.append(f"c.course_type = ${param_idx}")
            params[str(param_idx)] = value
            param_idx += 1
        elif key == "order_status":
            conditions.append(f"o.order_status = ${param_idx}")
            params[str(param_idx)] = value
            param_idx += 1
        elif key == "publisher":
            conditions.append(f"o.publisher = ${param_idx}")
            params[str(param_idx)] = value
            param_idx += 1
        elif key == "data_source":
            conditions.append(f"o.data_source = ${param_idx}")
            params[str(param_idx)] = value
            param_idx += 1
        elif key == "textbook_name":
            conditions.append(f"o.textbook_name LIKE ${param_idx}")
            params[str(param_idx)] = f"%{value}%"
            param_idx += 1
        elif key == "textbook_isbn":
            conditions.append(f"o.textbook_isbn LIKE ${param_idx}")
            params[str(param_idx)] = f"%{value}%"
            param_idx += 1
        elif key == "price_min":
            conditions.append(f"o.price >= ${param_idx}")
            params[str(param_idx)] = float(value)
            param_idx += 1
        elif key == "price_max":
            conditions.append(f"o.price <= ${param_idx}")
            params[str(param_idx)] = float(value)
            param_idx += 1
        elif key == "search_text":
            conditions.append(f"(o.textbook_name LIKE ${param_idx} OR o.textbook_isbn LIKE ${param_idx + 1})")
            params[str(param_idx)] = f"%{value}%"
            params[str(param_idx + 1)] = f"%{value}%"
            param_idx += 2
        elif key == "approval_step":
            conditions.append(f"a.approval_step = ${param_idx}")
            params[str(param_idx)] = int(value)
            param_idx += 1
        elif key == "approval_result":
            conditions.append(f"a.approval_result = ${param_idx}")
            params[str(param_idx)] = value
            param_idx += 1
        elif key == "approver":
            conditions.append(f"a.approver = ${param_idx}")
            params[str(param_idx)] = value
            param_idx += 1
        elif key == "date_from":
            conditions.append(f"a.approval_time >= ${param_idx}")
            params[str(param_idx)] = value
            param_idx += 1
        elif key == "date_to":
            conditions.append(f"a.approval_time <= ${param_idx}")
            params[str(param_idx)] = f"{value} 23:59:59"
            param_idx += 1
        elif key == "severity":
            conditions.append(f"g.severity = ${param_idx}")
            params[str(param_idx)] = value
            param_idx += 1
        elif key == "gap_type":
            conditions.append(f"g.gap_type = ${param_idx}")
            params[str(param_idx)] = value
            param_idx += 1
        elif key == "gap_status":
            conditions.append(f"g.status = ${param_idx}")
            params[str(param_idx)] = value
            param_idx += 1
        elif key == "anomaly_type":
            conditions.append(f"an.anomaly_type = ${param_idx}")
            params[str(param_idx)] = value
            param_idx += 1

    where_sql = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    return where_sql, params


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
