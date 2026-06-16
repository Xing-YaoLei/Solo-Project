import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Optional, Dict


class DataTransformer:
    @staticmethod
    def clean_appointments(df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df

        df = df.copy()

        df["appointment_date"] = pd.to_datetime(df["appointment_date"])
        df["year"] = df["appointment_date"].dt.year
        df["month"] = df["appointment_date"].dt.month
        df["week"] = df["appointment_date"].dt.isocalendar().week
        df["day_of_week"] = df["appointment_date"].dt.day_name()

        df["is_weekend"] = df["day_of_week"].isin(["Saturday", "Sunday"])

        df["wait_days"] = (
            df["appointment_date"] - pd.to_datetime(df["created_at"]).dt.floor("D")
        ).dt.days

        df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0)
        df["paid_amount"] = pd.to_numeric(df["paid_amount"], errors="coerce").fillna(0)
        df["unpaid_amount"] = df["amount"] - df["paid_amount"]

        return df

    @staticmethod
    def clean_payments(df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df

        df = df.copy()

        df["payment_date"] = pd.to_datetime(df["payment_date"])

        numeric_cols = ["quantity", "unit_price", "total_amount", "discount_amount", "actual_amount"]
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

        df["discount_rate"] = np.where(
            df["total_amount"] > 0,
            (df["discount_amount"] / df["total_amount"]).round(4),
            0,
        )

        df["is_discounted"] = df["discount_amount"] > 0

        return df

    @staticmethod
    def merge_appointments_payments(
        appointments_df: pd.DataFrame,
        payments_df: pd.DataFrame,
    ) -> pd.DataFrame:
        if appointments_df.empty:
            return pd.DataFrame()

        if payments_df.empty:
            appointments_df["has_payment"] = False
            appointments_df["payment_amount"] = 0
            appointments_df["payment_count"] = 0
            return appointments_df

        payment_agg = (
            payments_df.groupby("appointment_no")
            .agg(
                {
                    "actual_amount": "sum",
                    "id": "count",
                    "payment_date": "min",
                }
            )
            .reset_index()
            .rename(
                columns={
                    "actual_amount": "payment_amount",
                    "id": "payment_count",
                    "payment_date": "first_payment_date",
                }
            )
        )

        merged = appointments_df.merge(
            payment_agg, on="appointment_no", how="left"
        )

        merged["has_payment"] = merged["payment_count"].fillna(0) > 0
        merged["payment_amount"] = merged["payment_amount"].fillna(0)
        merged["payment_count"] = merged["payment_count"].fillna(0).astype(int)

        return merged

    @staticmethod
    def add_patient_metrics(
        appointments_df: pd.DataFrame,
        patients_df: pd.DataFrame,
    ) -> pd.DataFrame:
        if appointments_df.empty or patients_df.empty:
            return appointments_df

        patient_cols = [
            "patient_id",
            "name",
            "gender",
            "age",
            "phone",
            "first_visit_date",
            "total_visits",
        ]
        available_cols = [c for c in patient_cols if c in patients_df.columns]

        patients_slim = patients_df[available_cols].drop_duplicates(subset=["patient_id"])

        merged = appointments_df.merge(
            patients_slim, on="patient_id", how="left"
        )

        if "first_visit_date" in merged.columns:
            merged["first_visit_date"] = pd.to_datetime(merged["first_visit_date"])
            merged["is_first_visit"] = (
                merged["appointment_date"].dt.date
                == merged["first_visit_date"].dt.date
            )
            merged["days_since_first_visit"] = (
                merged["appointment_date"] - merged["first_visit_date"]
            ).dt.days
        else:
            merged["is_first_visit"] = False
            merged["days_since_first_visit"] = np.nan

        return merged

    @staticmethod
    def calculate_funnel_stages(
        appointments_df: pd.DataFrame,
    ) -> List[Dict[str, any]]:
        if appointments_df.empty:
            return []

        total = len(appointments_df)

        stages = [
            {
                "stage": "预约登记",
                "count": int(total),
                "conversion": 1.0,
                "color": "#6366f1",
            },
        ]

        confirmed_mask = appointments_df["status"].isin(
            ["已确认", "已到院", "已完成"]
        )
        confirmed_count = int(confirmed_mask.sum())
        stages.append(
            {
                "stage": "预约确认",
                "count": confirmed_count,
                "conversion": confirmed_count / total if total > 0 else 0,
                "color": "#8b5cf6",
            }
        )

        arrived_mask = appointments_df["status"].isin(["已到院", "已完成"])
        arrived_count = int(arrived_mask.sum())
        stages.append(
            {
                "stage": "患者到院",
                "count": arrived_count,
                "conversion": arrived_count / total if total > 0 else 0,
                "color": "#06b6d4",
            }
        )

        completed_mask = appointments_df["status"] == "已完成"
        completed_count = int(completed_mask.sum())
        stages.append(
            {
                "stage": "服务完成",
                "count": completed_count,
                "conversion": completed_count / total if total > 0 else 0,
                "color": "#10b981",
            }
        )

        for i in range(1, len(stages)):
            prev_count = stages[i - 1]["count"]
            curr_count = stages[i]["count"]
            stages[i]["step_conversion"] = (
                curr_count / prev_count if prev_count > 0 else 0
            )

        stages[0]["step_conversion"] = 1.0

        return stages

    @staticmethod
    def detect_no_show_impact_periods(
        no_show_df: pd.DataFrame,
        threshold_std: float = 1.5,
    ) -> List[Dict[str, any]]:
        if no_show_df.empty or "no_show_count" not in no_show_df.columns:
            return []

        df = no_show_df.copy()
        df["period"] = pd.to_datetime(df["period"])
        df = df.sort_values("period")

        df["no_show_rate"] = np.where(
            df["total_appointments"] > 0,
            df["no_show_count"] / df["total_appointments"],
            0,
        )

        mean_rate = df["no_show_rate"].mean()
        std_rate = df["no_show_rate"].std()

        if std_rate == 0:
            return []

        anomaly_mask = df["no_show_rate"] > (mean_rate + threshold_std * std_rate)
        anomaly_periods = df[anomaly_mask]

        if anomaly_periods.empty:
            return []

        periods = []
        for _, row in anomaly_periods.iterrows():
            period_start = row["period"]
            period_end = period_start + timedelta(days=6)

            periods.append(
                {
                    "start_date": period_start.strftime("%Y-%m-%d"),
                    "end_date": period_end.strftime("%Y-%m-%d"),
                    "no_show_count": int(row["no_show_count"]),
                    "total_appointments": int(row["total_appointments"]),
                    "no_show_rate": round(row["no_show_rate"] * 100, 2),
                    "deviation_from_mean": round(
                        (row["no_show_rate"] - mean_rate) * 100, 2
                    ),
                }
            )

        return periods

    @staticmethod
    def calculate_revisit_rate(
        appointments_df: pd.DataFrame,
        window_days: int = 180,
    ) -> Dict[str, any]:
        if appointments_df.empty:
            return {
                "revisit_rate": 0,
                "revisit_count": 0,
                "total_patients": 0,
                "window_days": window_days,
                "calculation_rule": "",
            }

        df = appointments_df.copy()
        df["appointment_date"] = pd.to_datetime(df["appointment_date"])
        df = df[df["status"] == "已完成"].sort_values("appointment_date")

        if df.empty:
            return {
                "revisit_rate": 0,
                "revisit_count": 0,
                "total_patients": 0,
                "window_days": window_days,
                "calculation_rule": "",
            }

        patient_groups = df.groupby("patient_id")
        revisit_count = 0
        total_patients = len(patient_groups)

        for patient_id, group in patient_groups:
            if len(group) < 2:
                continue

            visit_dates = sorted(pd.to_datetime(group["appointment_date"].unique()))
            for i in range(1, len(visit_dates)):
                days_between = (visit_dates[i] - visit_dates[i - 1]).days
                if days_between <= window_days:
                    revisit_count += 1
                    break

        revisit_rate = revisit_count / total_patients if total_patients > 0 else 0

        calculation_rule = (
            f"复诊率计算公式：复诊患者数 / 总患者数 × 100%\n"
            f"1. 筛选条件：状态为【已完成】的洁牙预约\n"
            f"2. 时间窗口：{window_days}天内\n"
            f"3. 复诊判定：同一患者在首次完成洁牙后{window_days}天内再次完成洁牙\n"
            f"4. 统计周期内总患者数：{total_patients}人\n"
            f"5. 复诊患者数：{revisit_count}人\n"
            f"6. 复诊率：{revisit_count} / {total_patients} × 100% = {revisit_rate * 100:.2f}%"
        )

        return {
            "revisit_rate": round(revisit_rate * 100, 2),
            "revisit_count": revisit_count,
            "total_patients": total_patients,
            "window_days": window_days,
            "calculation_rule": calculation_rule,
        }

    @staticmethod
    def get_download_data(
        appointments_df: pd.DataFrame,
        payments_df: pd.DataFrame,
        revisit_info: Dict[str, any],
    ) -> Dict[str, pd.DataFrame]:
        data_sheets = {}

        appointments_sheet = appointments_df.copy()
        if not appointments_sheet.empty:
            date_cols = appointments_sheet.select_dtypes(
                include=["datetime64[ns]", "datetime64[ns, UTC]"]
            ).columns
            for col in date_cols:
                appointments_sheet[col] = appointments_sheet[col].dt.strftime("%Y-%m-%d %H:%M:%S")

        data_sheets["预约明细"] = appointments_sheet

        if not payments_df.empty:
            payments_sheet = payments_df.copy()
            date_cols = payments_sheet.select_dtypes(
                include=["datetime64[ns]", "datetime64[ns, UTC]"]
            ).columns
            for col in date_cols:
                payments_sheet[col] = payments_sheet[col].dt.strftime("%Y-%m-%d %H:%M:%S")
            data_sheets["收费明细"] = payments_sheet

        revisit_df = pd.DataFrame(
            [
                {
                    "指标": "总患者数",
                    "数值": revisit_info["total_patients"],
                },
                {
                    "指标": "复诊患者数",
                    "数值": revisit_info["revisit_count"],
                },
                {
                    "指标": "复诊率(%)",
                    "数值": revisit_info["revisit_rate"],
                },
                {
                    "指标": "复诊时间窗口(天)",
                    "数值": revisit_info["window_days"],
                },
                {
                    "指标": "计算规则",
                    "数值": revisit_info["calculation_rule"],
                },
            ]
        )
        data_sheets["复诊率说明"] = revisit_df

        return data_sheets
