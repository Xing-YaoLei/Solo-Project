from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import secrets
from ..core.config import get_settings
from ..core.duckdb_conn import get_duckdb_connection
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

    token_data = {
        "token": token,
        "chart_type": chart_type,
        "permissions": permissions,
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
        "permissions": permissions,
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


def get_shared_data(token: str) -> Optional[Dict[str, Any]]:
    token_data = verify_share_token(token)
    if not token_data:
        return None

    chart_type = token_data["chart_type"]
    permissions = token_data.get("permissions", {})

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
            "chapter_rank_top10": {k: v[:10] if isinstance(v, list) else v for k, v in get_chapter_rank().items()},
            "completion_rate_formula": settings.COMPLETION_RATE_FORMULA,
            "refreshed_at": datetime.now()
        }
    }

    if chart_type not in data_mapping:
        return None

    result = data_mapping[chart_type]()

    if not permissions.get("view_formula", True):
        if isinstance(result, dict) and "completion_rate_formula" in result:
            del result["completion_rate_formula"]

    if not permissions.get("view_raw_data", True):
        if isinstance(result, dict) and "data" in result:
            result["data"] = []

    return {
        "chart_type": chart_type,
        "permissions": permissions,
        "data": result,
        "shared_at": token_data["created_at"],
        "expires_at": token_data["expires_at"]
    }
