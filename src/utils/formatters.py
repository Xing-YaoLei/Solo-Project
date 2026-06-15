from typing import Optional, Any
from datetime import datetime, date
import polars as pl


def format_currency(value: Optional[float]) -> str:
    if value is None:
        return "-"
    return f"¥{value:,.2f}"


def format_percentage(value: Optional[float], decimals: int = 1) -> str:
    if value is None:
        return "-"
    return f"{value:.{decimals}f}%"


def format_number(value: Optional[int]) -> str:
    if value is None:
        return "-"
    return f"{value:,}"


def format_date(value: Optional[Any]) -> str:
    if value is None:
        return "-"
    if isinstance(value, str):
        try:
            dt = datetime.fromisoformat(value)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            return value
    if isinstance(value, (datetime, date)):
        return value.strftime("%Y-%m-%d")
    return str(value)


def format_datetime(value: Optional[Any]) -> str:
    if value is None:
        return "-"
    if isinstance(value, str):
        try:
            dt = datetime.fromisoformat(value)
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        except ValueError:
            return value
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    return str(value)


def format_status(value: str) -> str:
    status_map = {
        "pending": "待处理",
        "submitted": "已提交",
        "approved": "已通过",
        "rejected": "已拒绝",
        "purchased": "已采购",
        "stocked": "已入库",
        "distributed": "已发放",
        "completed": "已完成",
        "open": "待处理",
        "in_progress": "处理中",
        "closed": "已关闭",
        "resolved": "已解决",
    }
    return status_map.get(value, value)


def format_severity(value: str) -> str:
    severity_map = {
        "high": "高",
        "medium": "中",
        "low": "低",
    }
    return severity_map.get(value, value)


def get_status_color(value: str) -> str:
    color_map = {
        "pending": "#F59E0B",
        "submitted": "#3B82F6",
        "approved": "#10B981",
        "rejected": "#EF4444",
        "purchased": "#8B5CF6",
        "stocked": "#06B6D4",
        "distributed": "#84CC16",
        "completed": "#10B981",
        "open": "#F97316",
        "in_progress": "#3B82F6",
        "closed": "#6B7280",
        "resolved": "#10B981",
    }
    return color_map.get(value, "#6B7280")


def get_severity_color(value: str) -> str:
    color_map = {
        "high": "#EF4444",
        "medium": "#F97316",
        "low": "#10B981",
    }
    return color_map.get(value, "#6B7280")


def add_formatting_columns(df: pl.DataFrame) -> pl.DataFrame:
    if "price" in df.columns:
        df = df.with_columns(
            pl.col("price").map_elements(format_currency, return_dtype=str).alias("price_formatted")
        )
    if "amount" in df.columns:
        df = df.with_columns(
            pl.col("amount").map_elements(format_currency, return_dtype=str).alias("amount_formatted")
        )
    if "total_conversion" in df.columns:
        df = df.with_columns(
            pl.col("total_conversion").map_elements(format_percentage, return_dtype=str).alias("total_conversion_formatted")
        )
    if "stage_conversion" in df.columns:
        df = df.with_columns(
            pl.col("stage_conversion").map_elements(format_percentage, return_dtype=str).alias("stage_conversion_formatted")
        )
    if "coverage_rate" in df.columns:
        df = df.with_columns(
            pl.col("coverage_rate").map_elements(format_percentage, return_dtype=str).alias("coverage_rate_formatted")
        )
    if "quantity" in df.columns:
        df = df.with_columns(
            pl.col("quantity").map_elements(format_number, return_dtype=str).alias("quantity_formatted")
        )
    if "student_count" in df.columns:
        df = df.with_columns(
            pl.col("student_count").map_elements(format_number, return_dtype=str).alias("student_count_formatted")
        )
    if "status" in df.columns:
        df = df.with_columns(
            pl.col("status").map_elements(format_status, return_dtype=str).alias("status_formatted"),
            pl.col("status").map_elements(get_status_color, return_dtype=str).alias("status_color")
        )
    if "severity" in df.columns:
        df = df.with_columns(
            pl.col("severity").map_elements(format_severity, return_dtype=str).alias("severity_formatted"),
            pl.col("severity").map_elements(get_severity_color, return_dtype=str).alias("severity_color")
        )
    return df
