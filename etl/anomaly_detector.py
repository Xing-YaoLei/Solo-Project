import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import logging

from database import (
    SessionLocal,
    AnomalyType,
    AppointmentStatus,
)
from config import settings

logger = logging.getLogger(__name__)


class AnomalyDetector:
    def __init__(self, db_session=None):
        self.db = db_session or SessionLocal()

    def close(self):
        self.db.close()

    def detect_all_anomalies(
        self,
        appointments_df: pd.DataFrame,
        payments_df: pd.DataFrame,
    ) -> List[Dict[str, any]]:
        anomalies = []

        delay_anomalies = self.detect_appointment_delays(appointments_df)
        anomalies.extend(delay_anomalies)

        missing_payment_anomalies = self.detect_missing_payments(
            appointments_df, payments_df
        )
        anomalies.extend(missing_payment_anomalies)

        caliber_anomalies = self.detect_his_caliber_changes(appointments_df)
        anomalies.extend(caliber_anomalies)

        amount_anomalies = self.detect_abnormal_amounts(payments_df)
        anomalies.extend(amount_anomalies)

        inconsistency_anomalies = self.detect_data_inconsistencies(
            appointments_df, payments_df
        )
        anomalies.extend(inconsistency_anomalies)

        return anomalies

    def detect_appointment_delays(
        self,
        appointments_df: pd.DataFrame,
        threshold_hours: Optional[int] = None,
    ) -> List[Dict[str, any]]:
        if appointments_df.empty:
            return []

        threshold_hours = threshold_hours or settings.APPOINTMENT_DELAY_THRESHOLD_HOURS
        threshold_time = datetime.now() - timedelta(hours=threshold_hours)

        df = appointments_df.copy()
        df["his_sync_time"] = pd.to_datetime(df["his_sync_time"])
        df["appointment_date"] = pd.to_datetime(df["appointment_date"])

        mask = (
            (df["is_cleaning"] == True)
            & (df["his_sync_time"] < threshold_time)
            & (df["status"].isin([AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED]))
            & (df["appointment_date"].dt.date <= datetime.now().date())
        )

        delayed = df[mask]
        anomalies = []

        for _, row in delayed.iterrows():
            delay_hours = (datetime.now() - row["his_sync_time"]).total_seconds() / 3600
            anomalies.append(
                {
                    "anomaly_type": AnomalyType.APPOINTMENT_DELAY,
                    "severity": "warning" if delay_hours < 48 else "error",
                    "appointment_no": row["appointment_no"],
                    "description": (
                        f"预约【{row['appointment_no']}】HIS同步延迟 {delay_hours:.1f} 小时，"
                        f"预约日期: {row['appointment_date'].strftime('%Y-%m-%d')}，"
                        f"患者: {row.get('patient_id', '未知')}"
                    ),
                    "data_snapshot": {
                        "appointment_no": row["appointment_no"],
                        "patient_id": row.get("patient_id"),
                        "appointment_date": row["appointment_date"].strftime("%Y-%m-%d"),
                        "his_sync_time": row["his_sync_time"].strftime("%Y-%m-%d %H:%M:%S"),
                        "delay_hours": round(delay_hours, 1),
                        "status": row["status"],
                    },
                }
            )

        logger.info(f"检测到 {len(anomalies)} 条预约延迟异常")
        return anomalies

    def detect_missing_payments(
        self,
        appointments_df: pd.DataFrame,
        payments_df: pd.DataFrame,
        window_days: Optional[int] = None,
    ) -> List[Dict[str, any]]:
        if appointments_df.empty:
            return []

        window_days = window_days or settings.MISSING_PAYMENT_WINDOW_DAYS
        cutoff_date = datetime.now().date() - timedelta(days=window_days)

        df = appointments_df.copy()
        df["appointment_date"] = pd.to_datetime(df["appointment_date"]).dt.date

        appointment_nos_with_payment = set()
        if not payments_df.empty:
            appointment_nos_with_payment = set(
                payments_df[payments_df["is_cleaning_related"] == True]["appointment_no"].dropna()
            )

        mask = (
            (df["is_cleaning"] == True)
            & (df["status"].isin([AppointmentStatus.COMPLETED, AppointmentStatus.ARRIVED]))
            & (df["appointment_date"] <= cutoff_date)
            & (~df["appointment_no"].isin(appointment_nos_with_payment))
        )

        missing = df[mask]
        anomalies = []

        for _, row in missing.iterrows():
            days_passed = (datetime.now().date() - row["appointment_date"]).days
            anomalies.append(
                {
                    "anomaly_type": AnomalyType.MISSING_PAYMENT,
                    "severity": "warning" if days_passed < 14 else "error",
                    "appointment_no": row["appointment_no"],
                    "description": (
                        f"预约【{row['appointment_no']}】已完成 {days_passed} 天但无收费记录，"
                        f"预约金额: {row.get('amount', 0)}元，"
                        f"患者: {row.get('patient_id', '未知')}"
                    ),
                    "data_snapshot": {
                        "appointment_no": row["appointment_no"],
                        "patient_id": row.get("patient_id"),
                        "appointment_date": str(row["appointment_date"]),
                        "amount": float(row.get("amount", 0)),
                        "status": row["status"],
                        "days_passed": days_passed,
                    },
                }
            )

        logger.info(f"检测到 {len(anomalies)} 条收费记录缺失异常")
        return anomalies

    def detect_his_caliber_changes(
        self,
        appointments_df: pd.DataFrame,
        threshold: Optional[float] = None,
        lookback_days: int = 30,
        compare_days: int = 7,
    ) -> List[Dict[str, any]]:
        if appointments_df.empty:
            return []

        threshold = threshold or settings.HIS_CALIBER_CHANGE_THRESHOLD

        df = appointments_df.copy()
        df["appointment_date"] = pd.to_datetime(df["appointment_date"])

        today = datetime.now().date()
        current_start = today - timedelta(days=compare_days)
        baseline_start = current_start - timedelta(days=lookback_days)
        baseline_end = current_start - timedelta(days=1)

        baseline_df = df[
            (df["appointment_date"].dt.date >= baseline_start)
            & (df["appointment_date"].dt.date <= baseline_end)
        ]
        current_df = df[df["appointment_date"].dt.date >= current_start]

        if baseline_df.empty or current_df.empty:
            return []

        anomalies = []

        metrics_to_check = [
            ("status", "状态分布"),
            ("treatment_type", "治疗类型分布"),
            ("source", "来源分布"),
            ("channel", "渠道分布"),
        ]

        for col, display_name in metrics_to_check:
            if col not in df.columns:
                continue

            baseline_dist = baseline_df[col].value_counts(normalize=True)
            current_dist = current_df[col].value_counts(normalize=True)

            for value in set(baseline_dist.index) | set(current_dist.index):
                baseline_pct = baseline_dist.get(value, 0)
                current_pct = current_dist.get(value, 0)
                diff = abs(current_pct - baseline_pct)

                if diff > threshold and baseline_pct > 0.05:
                    anomalies.append(
                        {
                            "anomaly_type": AnomalyType.HIS_CALIBER_CHANGE,
                            "severity": "warning",
                            "description": (
                                f"HIS口径变化检测：{display_name}【{value}】"
                                f"占比从 {baseline_pct*100:.1f}% 变为 {current_pct*100:.1f}%，"
                                f"变化幅度 {diff*100:.1f}%"
                            ),
                            "data_snapshot": {
                                "field": col,
                                "value": value,
                                "baseline_percentage": round(baseline_pct * 100, 2),
                                "current_percentage": round(current_pct * 100, 2),
                                "change_percentage": round(diff * 100, 2),
                                "baseline_period": f"{baseline_start} ~ {baseline_end}",
                                "current_period": f"{current_start} ~ {today}",
                                "baseline_count": len(baseline_df),
                                "current_count": len(current_df),
                            },
                        }
                    )

        if anomalies:
            daily_counts = df.groupby(df["appointment_date"].dt.date).size()
            if len(daily_counts) >= 7:
                recent_avg = daily_counts.tail(7).mean()
                previous_avg = daily_counts.iloc[-14:-7].mean()

                if previous_avg > 0:
                    count_change = abs(recent_avg - previous_avg) / previous_avg
                    if count_change > threshold:
                        anomalies.append(
                            {
                                "anomaly_type": AnomalyType.HIS_CALIBER_CHANGE,
                                "severity": "warning" if count_change < 0.3 else "error",
                                "description": (
                                    f"HIS口径变化检测：日均预约量从 {previous_avg:.1f} "
                                    f"变为 {recent_avg:.1f}，变化幅度 {count_change*100:.1f}%"
                                ),
                                "data_snapshot": {
                                    "field": "daily_volume",
                                    "previous_avg": round(previous_avg, 2),
                                    "recent_avg": round(recent_avg, 2),
                                    "change_percentage": round(count_change * 100, 2),
                                },
                            }
                        )

        logger.info(f"检测到 {len(anomalies)} 条HIS口径变化异常")
        return anomalies

    def detect_abnormal_amounts(
        self,
        payments_df: pd.DataFrame,
        z_threshold: float = 3.0,
    ) -> List[Dict[str, any]]:
        if payments_df.empty:
            return []

        df = payments_df.copy()
        df = df[df["is_cleaning_related"] == True]

        if df.empty:
            return []

        anomalies = []

        numeric_cols = ["unit_price", "total_amount", "actual_amount", "discount_amount"]
        for col in numeric_cols:
            if col not in df.columns:
                continue

            values = pd.to_numeric(df[col], errors="coerce").dropna()
            if len(values) < 10:
                continue

            mean = values.mean()
            std = values.std()

            if std == 0:
                continue

            for _, row in df.iterrows():
                val = pd.to_numeric(row[col], errors="coerce")
                if pd.isna(val):
                    continue

                z_score = abs((val - mean) / std)
                if z_score > z_threshold and val > 0:
                    anomalies.append(
                        {
                            "anomaly_type": AnomalyType.ABNORMAL_AMOUNT,
                            "severity": "warning",
                            "payment_id": row["id"],
                            "description": (
                                f"收费【{row['payment_no']}】{col}异常: "
                                f"{val}元，均值: {mean:.1f}元，Z分数: {z_score:.2f}"
                            ),
                            "data_snapshot": {
                                "payment_no": row["payment_no"],
                                "field": col,
                                "value": float(val),
                                "mean": round(mean, 2),
                                "std": round(std, 2),
                                "z_score": round(z_score, 2),
                                "item_name": row.get("item_name"),
                            },
                        }
                    )

        discount_mask = (df["discount_rate"] > 0.5) & (df["total_amount"] > 100)
        high_discount = df[discount_mask]

        for _, row in high_discount.iterrows():
            anomalies.append(
                {
                    "anomaly_type": AnomalyType.ABNORMAL_AMOUNT,
                    "severity": "warning",
                    "payment_id": row["id"],
                    "description": (
                        f"收费【{row['payment_no']}】异常高折扣: "
                        f"{row['discount_rate']*100:.1f}%，原价: {row['total_amount']}元，"
                        f"实付: {row['actual_amount']}元"
                    ),
                    "data_snapshot": {
                        "payment_no": row["payment_no"],
                        "discount_rate": round(float(row["discount_rate"]), 4),
                        "total_amount": float(row["total_amount"]),
                        "actual_amount": float(row["actual_amount"]),
                        "discount_amount": float(row["discount_amount"]),
                        "item_name": row.get("item_name"),
                    },
                }
            )

        logger.info(f"检测到 {len(anomalies)} 条金额异常")
        return anomalies

    def detect_data_inconsistencies(
        self,
        appointments_df: pd.DataFrame,
        payments_df: pd.DataFrame,
    ) -> List[Dict[str, any]]:
        anomalies = []

        if appointments_df.empty or payments_df.empty:
            return anomalies

        df = appointments_df.copy()
        df["appointment_date"] = pd.to_datetime(df["appointment_date"])
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0)
        df["paid_amount"] = pd.to_numeric(df["paid_amount"], errors="coerce").fillna(0)

        payment_agg = (
            payments_df.groupby("appointment_no")
            .agg({"actual_amount": "sum", "id": "count"})
            .reset_index()
            .rename(columns={"actual_amount": "payment_sum", "id": "payment_count"})
        )

        merged = df.merge(payment_agg, on="appointment_no", how="inner")

        amount_diff_mask = abs(merged["paid_amount"] - merged["payment_sum"]) > 1
        amount_diff = merged[amount_diff_mask]

        for _, row in amount_diff.iterrows():
            diff = row["paid_amount"] - row["payment_sum"]
            anomalies.append(
                {
                    "anomaly_type": AnomalyType.DATA_INCONSISTENCY,
                    "severity": "warning",
                    "appointment_no": row["appointment_no"],
                    "description": (
                        f"预约【{row['appointment_no']}】金额不一致："
                        f"预约表已付 {row['paid_amount']}元，收费表合计 {row['payment_sum']}元，"
                        f"差额 {diff:.2f}元"
                    ),
                    "data_snapshot": {
                        "appointment_no": row["appointment_no"],
                        "appointment_paid_amount": float(row["paid_amount"]),
                        "payment_sum": float(row["payment_sum"]),
                        "difference": round(float(diff), 2),
                        "payment_count": int(row["payment_count"]),
                    },
                }
            )

        completed_without_payment_mask = (
            (merged["status"] == AppointmentStatus.COMPLETED)
            & (merged["payment_sum"] <= 0)
            & (merged["amount"] > 0)
        )
        completed_without_payment = merged[completed_without_payment_mask]

        for _, row in completed_without_payment.iterrows():
            anomalies.append(
                {
                    "anomaly_type": AnomalyType.DATA_INCONSISTENCY,
                    "severity": "warning",
                    "appointment_no": row["appointment_no"],
                    "description": (
                        f"预约【{row['appointment_no']}】状态为已完成但无收费，"
                        f"预约金额 {row['amount']}元"
                    ),
                    "data_snapshot": {
                        "appointment_no": row["appointment_no"],
                        "status": row["status"],
                        "appointment_amount": float(row["amount"]),
                        "payment_sum": float(row["payment_sum"]),
                    },
                }
            )

        logger.info(f"检测到 {len(anomalies)} 条数据不一致异常")
        return anomalies
