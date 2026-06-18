from __future__ import annotations

from datetime import datetime, timezone, date, timedelta
from enum import Enum
from typing import Any, Optional, Type, TypeVar, Dict, List


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def local_now(tz_name: str = "Asia/Shanghai") -> datetime:
    try:
        from zoneinfo import ZoneInfo
        return datetime.now(ZoneInfo(tz_name))
    except Exception:
        from datetime import timedelta
        return datetime.now(timezone.utc) + timedelta(hours=8)


def format_datetime(
    dt: Optional[datetime],
    fmt: str = "%Y-%m-%d %H:%M:%S",
    default: str = "",
) -> str:
    if dt is None:
        return default
    if isinstance(dt, datetime):
        if dt.tzinfo is not None:
            try:
                from zoneinfo import ZoneInfo
                dt = dt.astimezone(ZoneInfo("Asia/Shanghai"))
            except Exception:
                pass
        return dt.strftime(fmt)
    return str(dt)


def format_date(
    d: Optional[date],
    fmt: str = "%Y-%m-%d",
    default: str = "",
) -> str:
    if d is None:
        return default
    if isinstance(d, datetime):
        return d.strftime(fmt)
    if isinstance(d, date):
        return d.strftime(fmt)
    return str(d)


def parse_datetime(
    value: Any,
    default: Optional[datetime] = None,
) -> Optional[datetime]:
    if value is None or value == "":
        return default
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return datetime(value.year, value.month, value.day)
    if isinstance(value, (int, float)):
        try:
            if value > 1e12:
                return datetime.fromtimestamp(value / 1000, tz=timezone.utc)
            return datetime.fromtimestamp(value, tz=timezone.utc)
        except Exception:
            return default
    if isinstance(value, str):
        for fmt in [
            "%Y-%m-%dT%H:%M:%S.%f%z",
            "%Y-%m-%dT%H:%M:%S.%fZ",
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S.%f",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d %H:%M",
            "%Y-%m-%d",
            "%Y/%m/%d %H:%M:%S",
            "%Y/%m/%d",
        ]:
            try:
                return datetime.strptime(value.strip(), fmt)
            except (ValueError, TypeError):
                continue
    return default


def parse_date(
    value: Any,
    default: Optional[date] = None,
) -> Optional[date]:
    dt = parse_datetime(value, None)
    if dt is not None:
        return dt.date()
    return default


def enum_to_value(value: Any) -> Any:
    if isinstance(value, Enum):
        return value.value
    return value


def enum_list_to_values(values: List[Any]) -> List[Any]:
    return [enum_to_value(v) for v in values]


T = TypeVar("T", bound=Enum)


def parse_enum(
    value: Any,
    enum_cls: Type[T],
    default: Optional[T] = None,
) -> Optional[T]:
    if value is None:
        return default
    if isinstance(value, enum_cls):
        return value
    raw = str(value).strip().lower()
    for member in enum_cls:
        if member.value.lower() == raw or member.name.lower() == raw:
            return member
    return default


def stock_age_bucket(days: int) -> str:
    if days <= 7:
        return "0-7"
    if days <= 15:
        return "8-15"
    if days <= 30:
        return "16-30"
    return "31+"


def completion_bucket(pct: float) -> str:
    if pct is None:
        return "0-25"
    if pct <= 25:
        return "0-25"
    if pct <= 50:
        return "26-50"
    if pct <= 75:
        return "51-75"
    return "76-100"


def risk_level_for(stock_days: int, completion_pct: float) -> str:
    high_risk = (stock_days > 30) or (completion_pct < 25)
    medium = (stock_days > 15) or (completion_pct < 50)
    low = (stock_days <= 7) and (completion_pct >= 75)
    if high_risk:
        if stock_days > 60 or completion_pct == 0:
            return "critical"
        return "high"
    if medium:
        return "medium"
    if low:
        return "low"
    return "low"


def humanize_duration(seconds: float) -> str:
    if seconds < 0:
        seconds = 0
    hours, rem = divmod(int(seconds), 3600)
    minutes, secs = divmod(rem, 60)
    if hours > 0:
        if minutes > 0:
            return f"{hours}h {minutes}m"
        return f"{hours}h"
    if minutes > 0:
        return f"{minutes}m {secs}s"
    return f"{secs}s"


def mask_phone(phone: Optional[str]) -> str:
    if not phone or not isinstance(phone, str):
        return ""
    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) < 7:
        return phone
    return f"{digits[:3]}****{digits[-4:]}"


def generate_batch_no(source: str = "SYNC") -> str:
    now = local_now()
    import random
    rnd = f"{random.randint(0, 999999):06d}"
    return f"{source.upper()}-{now.strftime('%Y%m%d%H%M%S')}-{rnd}"


def chunk_list(lst: List[Any], size: int) -> List[List[Any]]:
    if size <= 0:
        return [lst]
    return [lst[i : i + size] for i in range(0, len(lst), size)]


def to_snake_case(name: str) -> str:
    import re
    s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1).lower()


__all__ = [
    "utc_now",
    "local_now",
    "format_datetime",
    "format_date",
    "parse_datetime",
    "parse_date",
    "enum_to_value",
    "enum_list_to_values",
    "parse_enum",
    "stock_age_bucket",
    "completion_bucket",
    "risk_level_for",
    "humanize_duration",
    "mask_phone",
    "generate_batch_no",
    "chunk_list",
    "to_snake_case",
]
