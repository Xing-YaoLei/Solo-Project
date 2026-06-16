import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple


class MetricsCalculator:
    @staticmethod
    def calculate_kpis(
        appointments_df: pd.DataFrame,
        payments_df: pd.DataFrame,
    ) -> Dict[str, any]:
        kpis = {
            "total_appointments": 0,
            "completed_count": 0,
            "completion_rate": 0.0,
            "no_show_count": 0,
            "no_show_rate": 0.0,
            "cancelled_count": 0,
            "cancellation_rate": 0.0,
            "total_revenue": 0.0,
            "avg_revenue_per_appointment": 0.0,
            "new_patient_count": 0,
            "return_patient_count": 0,
            "revisit_rate": 0.0,
        }

        if appointments_df.empty:
            return kpis

        df = appointments_df.copy()
        df["appointment_date"] = pd.to_datetime(df["appointment_date"])

        kpis["total_appointments"] = len(df)

        completed_mask = df["status"] == "已完成"
        kpis["completed_count"] = completed_mask.sum()
        kpis["completion_rate"] = (
            kpis["completed_count"] / kpis["total_appointments"] * 100
            if kpis["total_appointments"] > 0
            else 0
        )

        no_show_mask = df["status"] == "爽约"
        kpis["no_show_count"] = no_show_mask.sum()
        kpis["no_show_rate"] = (
            kpis["no_show_count"] / kpis["total_appointments"] * 100
            if kpis["total_appointments"] > 0
            else 0
        )

        cancelled_mask = df["status"] == "已取消"
        kpis["cancelled_count"] = cancelled_mask.sum()
        kpis["cancellation_rate"] = (
            kpis["cancelled_count"] / kpis["total_appointments"] * 100
            if kpis["total_appointments"] > 0
            else 0
        )

        if not payments_df.empty:
            cleaning_payments = payments_df[payments_df["is_cleaning_related"] == True]
            kpis["total_revenue"] = float(
                pd.to_numeric(cleaning_payments["actual_amount"], errors="coerce").sum()
            )
            kpis["avg_revenue_per_appointment"] = (
                kpis["total_revenue"] / kpis["completed_count"]
                if kpis["completed_count"] > 0
                else 0
            )

        if "is_first_visit" in df.columns:
            first_visit_mask = df["is_first_visit"] == True
            kpis["new_patient_count"] = first_visit_mask.sum()
            kpis["return_patient_count"] = len(df) - kpis["new_patient_count"]

        if "revisit_rate" in df.columns:
            kpis["revisit_rate"] = df["revisit_rate"].iloc[0] if len(df) > 0 else 0

        return kpis

    @staticmethod
    def calculate_period_over_period(
        current_df: pd.DataFrame,
        previous_df: pd.DataFrame,
        metric_name: str = "total_appointments",
    ) -> Dict[str, float]:
        current_count = len(current_df)
        previous_count = len(previous_df)

        if previous_count == 0:
            change_pct = 100.0 if current_count > 0 else 0.0
        else:
            change_pct = (current_count - previous_count) / previous_count * 100

        return {
            "current_value": current_count,
            "previous_value": previous_count,
            "change_pct": round(change_pct, 2),
            "absolute_change": current_count - previous_count,
        }

    @staticmethod
    def calculate_doctor_performance(
        appointments_df: pd.DataFrame,
        top_n: int = 10,
    ) -> pd.DataFrame:
        if appointments_df.empty:
            return pd.DataFrame()

        df = appointments_df.copy()
        df["appointment_date"] = pd.to_datetime(df["appointment_date"])

        doctor_stats = (
            df.groupby("doctor")
            .agg(
                total_appointments=("appointment_no", "count"),
                completed=("status", lambda x: (x == "已完成").sum()),
                no_show=("status", lambda x: (x == "爽约").sum()),
                cancelled=("status", lambda x: (x == "已取消").sum()),
                total_amount=("amount", "sum"),
            )
            .reset_index()
        )

        doctor_stats["completion_rate"] = (
            doctor_stats["completed"] / doctor_stats["total_appointments"] * 100
        ).round(2)
        doctor_stats["no_show_rate"] = (
            doctor_stats["no_show"] / doctor_stats["total_appointments"] * 100
        ).round(2)
        doctor_stats["avg_amount"] = (
            doctor_stats["total_amount"] / doctor_stats["completed"]
        ).round(2)

        doctor_stats = doctor_stats.sort_values("total_appointments", ascending=False).head(top_n)

        return doctor_stats

    @staticmethod
    def calculate_channel_distribution(
        appointments_df: pd.DataFrame,
    ) -> pd.DataFrame:
        if appointments_df.empty:
            return pd.DataFrame()

        df = appointments_df.copy()
        df["channel"] = df["channel"].fillna("未知")

        channel_stats = (
            df.groupby("channel")
            .agg(
                count=("appointment_no", "count"),
                completed=("status", lambda x: (x == "已完成").sum()),
                no_show=("status", lambda x: (x == "爽约").sum()),
            )
            .reset_index()
        )

        total = channel_stats["count"].sum()
        channel_stats["percentage"] = (channel_stats["count"] / total * 100).round(2)
        channel_stats["conversion_rate"] = (
            channel_stats["completed"] / channel_stats["count"] * 100
        ).round(2)

        return channel_stats.sort_values("count", ascending=False)

    @staticmethod
    def calculate_age_distribution(
        appointments_df: pd.DataFrame,
        bins: Optional[List[int]] = None,
    ) -> pd.DataFrame:
        if appointments_df.empty or "age" not in appointments_df.columns:
            return pd.DataFrame()

        bins = bins or [0, 18, 30, 45, 60, 100]
        labels = ["0-17岁", "18-29岁", "30-44岁", "45-59岁", "60岁以上"]

        df = appointments_df.copy()
        df["age_group"] = pd.cut(df["age"], bins=bins, labels=labels, right=False)

        age_stats = (
            df.groupby("age_group", observed=True)
            .agg(
                count=("appointment_no", "count"),
                completed=("status", lambda x: (x == "已完成").sum()),
            )
            .reset_index()
        )

        age_stats["percentage"] = (
            age_stats["count"] / age_stats["count"].sum() * 100
        ).round(2)

        return age_stats

    @staticmethod
    def calculate_time_distribution(
        appointments_df: pd.DataFrame,
    ) -> pd.DataFrame:
        if appointments_df.empty or "appointment_time" not in appointments_df.columns:
            return pd.DataFrame()

        df = appointments_df.copy()
        df["appointment_time"] = df["appointment_time"].fillna("")

        def get_time_slot(time_str):
            if not time_str:
                return "未指定"
            try:
                hour = int(str(time_str).split(":")[0])
                if 8 <= hour < 12:
                    return "上午(8:00-12:00)"
                elif 12 <= hour < 14:
                    return "中午(12:00-14:00)"
                elif 14 <= hour < 18:
                    return "下午(14:00-18:00)"
                elif 18 <= hour < 21:
                    return "晚上(18:00-21:00)"
                else:
                    return "其他时段"
            except (ValueError, IndexError):
                return "未指定"

        df["time_slot"] = df["appointment_time"].apply(get_time_slot)

        time_stats = (
            df.groupby("time_slot")
            .agg(
                count=("appointment_no", "count"),
                completed=("status", lambda x: (x == "已完成").sum()),
                no_show=("status", lambda x: (x == "爽约").sum()),
            )
            .reset_index()
        )

        slot_order = [
            "上午(8:00-12:00)",
            "中午(12:00-14:00)",
            "下午(14:00-18:00)",
            "晚上(18:00-21:00)",
            "其他时段",
            "未指定",
        ]
        time_stats["order"] = time_stats["time_slot"].apply(
            lambda x: slot_order.index(x) if x in slot_order else 999
        )
        time_stats = time_stats.sort_values("order").drop("order", axis=1)

        return time_stats

    @staticmethod
    def get_date_ranges(
        base_date: Optional[datetime] = None,
    ) -> Dict[str, Tuple[datetime, datetime]]:
        base_date = base_date or datetime.now()

        today = base_date.replace(hour=0, minute=0, second=0, microsecond=0)

        this_month_start = today.replace(day=1)
        if this_month_start.month == 12:
            next_month_start = this_month_start.replace(year=this_month_start.year + 1, month=1)
        else:
            next_month_start = this_month_start.replace(month=this_month_start.month + 1)
        this_month_end = next_month_start - timedelta(days=1)

        last_month_end = this_month_start - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)

        this_week_start = today - timedelta(days=today.weekday())
        this_week_end = this_week_start + timedelta(days=6)

        last_week_start = this_week_start - timedelta(days=7)
        last_week_end = this_week_start - timedelta(days=1)

        quarter = (today.month - 1) // 3 + 1
        this_quarter_start = today.replace(month=(quarter - 1) * 3 + 1, day=1)
        if quarter == 4:
            next_quarter_start = this_quarter_start.replace(year=this_quarter_start.year + 1, month=1)
        else:
            next_quarter_start = this_quarter_start.replace(month=quarter * 3 + 1, day=1)
        this_quarter_end = next_quarter_start - timedelta(days=1)

        this_year_start = today.replace(month=1, day=1)
        this_year_end = today.replace(month=12, day=31)

        return {
            "today": (today, today),
            "this_week": (this_week_start, this_week_end),
            "last_week": (last_week_start, last_week_end),
            "this_month": (this_month_start, this_month_end),
            "last_month": (last_month_start, last_month_end),
            "this_quarter": (this_quarter_start, this_quarter_end),
            "this_year": (this_year_start, this_year_end),
        }
