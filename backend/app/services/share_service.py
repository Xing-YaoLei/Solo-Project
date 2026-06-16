from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import secrets
from ..core.config import get_settings
from ..services.analytics_service import (
    get_tag_trend,
    get_progress_composition,
    get_grade_feedback,
    get_anomaly_alerts,
    get_chapter_rank
)

settings = get_settings()

_share_tokens: Dict[str, Dict[str, Any]] = {}


def create_share_token(
    chart_type: str,
    permissions: Dict[str, Any],
    created_by: int = 1,
    expire_hours: Optional[int] = None
) -> Dict[str, Any]:
    token = secrets.token_urlsafe(32)
    expire_hours = expire_hours or settings.SHARE_TOKEN_EXPIRE_HOURS
    expires_at = datetime.now() + timedelta(hours=expire_hours)

    effective_permissions = {
        "view_formula": True,
        "view_raw_data": permissions.get("view_raw_data", True),
        "export_data": permissions.get("export_data", False)
    }

    token_data = {
        "token": token,
        "chart_type": chart_type,
        "permissions": effective_permissions,
        "created_by": created_by,
        "expires_at": expires_at,
        "created_at": datetime.now(),
        "is_active": True
    }

    _share_tokens[token] = token_data
    share_url = f"/share/{token}"

    return {
        "token": token,
        "chart_type": chart_type,
        "permissions": effective_permissions,
        "expires_at": expires_at,
        "share_url": share_url
    }


def verify_share_token(token: str) -> Optional[Dict[str, Any]]:
    token_data = _share_tokens.get(token)
    if not token_data:
        return None
    if not token_data["is_active"]:
        return None
    if token_data["expires_at"] < datetime.now():
        token_data["is_active"] = False
        return None
    return token_data


def _strip_sensitive_data(result: Dict[str, Any], chart_type: str) -> Dict[str, Any]:
    stripped = {
        "refreshed_at": result.get("refreshed_at"),
        "completion_rate_formula": settings.COMPLETION_RATE_FORMULA
    }

    if chart_type == "grade_feedback":
        stripped.update({
            "data": [],
            "total": 0,
            "page": 1,
            "page_size": 20,
            "_access_note": "明细数据权限未开启，仅展示统计概览"
        })

    elif chart_type == "anomaly_alerts":
        stripped.update({
            "data": [],
            "total": 0,
            "severity_stats": {},
            "page": 1,
            "page_size": 20,
            "_access_note": "明细数据权限未开启，仅展示统计概览"
        })

    elif chart_type == "tag_trend":
        stripped.update({
            "data": [],
            "tags": [],
            "date_range": [],
            "_access_note": "明细数据权限未开启，仅展示统计概览"
        })

    elif chart_type == "progress_composition":
        stripped.update({
            "data": [],
            "total": 0,
            "_access_note": "明细数据权限未开启，仅展示统计概览"
        })

    elif chart_type == "chapter_rank":
        stripped.update({
            "data": [],
            "total": 0,
            "view_mode": "rate",
            "_access_note": "明细数据权限未开启，仅展示统计概览"
        })

    elif chart_type == "dashboard":
        stripped.update({
            "tag_trend": {
                "data": [],
                "tags": [],
                "date_range": [],
                "refreshed_at": result.get("tag_trend", {}).get("refreshed_at"),
                "completion_rate_formula": settings.COMPLETION_RATE_FORMULA
            },
            "progress_composition": {
                "data": [],
                "total": 0,
                "refreshed_at": result.get("progress_composition", {}).get("refreshed_at"),
                "completion_rate_formula": settings.COMPLETION_RATE_FORMULA
            },
            "anomaly_alerts_summary": {
                "data": [],
                "total": 0,
                "severity_stats": {},
                "refreshed_at": result.get("anomaly_alerts_summary", {}).get("refreshed_at"),
                "completion_rate_formula": settings.COMPLETION_RATE_FORMULA
            },
            "chapter_rank_top10": {
                "data": [],
                "total": 0,
                "view_mode": "rate",
                "refreshed_at": result.get("chapter_rank_top10", {}).get("refreshed_at"),
                "completion_rate_formula": settings.COMPLETION_RATE_FORMULA
            },
            "refreshed_at": result.get("refreshed_at"),
            "completion_rate_formula": settings.COMPLETION_RATE_FORMULA,
            "_access_note": "明细数据权限未开启，仅展示统计概览"
        })

    return stripped


def _enrich_with_formula(result: Dict[str, Any]) -> Dict[str, Any]:
    result["completion_rate_formula"] = settings.COMPLETION_RATE_FORMULA
    return result


def get_shared_data(token: str) -> Optional[Dict[str, Any]]:
    token_data = verify_share_token(token)
    if not token_data:
        return None

    chart_type = token_data["chart_type"]
    permissions = token_data.get("permissions", {})
    view_raw_data = permissions.get("view_raw_data", True)

    data_mapping = {
        "tag_trend": lambda: get_tag_trend(),
        "progress_composition": lambda: get_progress_composition(),
        "grade_feedback": lambda: get_grade_feedback(page=1, page_size=20),
        "anomaly_alerts": lambda: get_anomaly_alerts(page=1, page_size=20),
        "chapter_rank": lambda: get_chapter_rank(sort_by="completion_rate", view_mode="rate"),
        "dashboard": lambda: {
            "tag_trend": get_tag_trend(),
            "progress_composition": get_progress_composition(),
            "anomaly_alerts_summary": get_anomaly_alerts(page=1, page_size=5),
            "chapter_rank_top10": get_chapter_rank(),
            "refreshed_at": datetime.now()
        }
    }

    if chart_type not in data_mapping:
        return None

    raw_result = data_mapping[chart_type]()

    if view_raw_data:
        sanitized_result = _enrich_with_formula(raw_result)
    else:
        sanitized_result = _strip_sensitive_data(raw_result, chart_type)

    effective_permissions = {
        "view_formula": True,
        "view_raw_data": view_raw_data,
        "export_data": permissions.get("export_data", False)
    }

    return {
        "chart_type": chart_type,
        "permissions": effective_permissions,
        "chart_data": sanitized_result,
        "shared_at": token_data["created_at"],
        "expires_at": token_data["expires_at"],
        "completion_rate_formula": settings.COMPLETION_RATE_FORMULA
    }
