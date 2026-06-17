from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta

import polars as pl

from src.config import ACTIVITY_TYPES, CARE_LEVELS


class DataCleaner:
    def __init__(self):
        self.cleaning_stats = {}

    def clean_nursing_records(self, df: pl.DataFrame) -> Tuple[pl.DataFrame, Dict]:
        if df.is_empty():
            return df, {"total": 0, "cleaned": 0, "removed": 0}

        stats = {"total": len(df), "duplicates_removed": 0, "invalid_removed": 0}

        df = df.with_columns([
            pl.col("record_time").str.to_datetime(strict=False) if "record_time" in df.columns else pl.lit(None).alias("record_time"),
            pl.col("activity_start_time").str.to_datetime(strict=False) if "activity_start_time" in df.columns else pl.lit(None).alias("activity_start_time"),
            pl.col("activity_end_time").str.to_datetime(strict=False) if "activity_end_time" in df.columns else pl.lit(None).alias("activity_end_time"),
        ])

        dedup_cols = ["elder_id", "activity_code", "activity_start_time", "nurse_id"]
        existing_dedup_cols = [c for c in dedup_cols if c in df.columns]
        if existing_dedup_cols:
            before = len(df)
            df = df.unique(subset=existing_dedup_cols, keep="last")
            stats["duplicates_removed"] = before - len(df)

        if "activity_duration" in df.columns and "activity_start_time" in df.columns and "activity_end_time" in df.columns:
            df = df.with_columns([
                pl.when(pl.col("activity_duration").is_null() | (pl.col("activity_duration") <= 0))
                .then((pl.col("activity_end_time") - pl.col("activity_start_time")).dt.total_minutes())
                .otherwise(pl.col("activity_duration"))
                .alias("activity_duration")
            ])

        if "elder_id" in df.columns:
            before = len(df)
            df = df.filter(pl.col("elder_id").is_not_null() & (pl.col("elder_id") != ""))
            stats["invalid_removed"] += before - len(df)

        if "activity_duration" in df.columns:
            before = len(df)
            df = df.filter((pl.col("activity_duration") >= 1) & (pl.col("activity_duration") <= 480))
            stats["invalid_removed"] += before - len(df)

        df = self._normalize_activity_codes(df)

        if "activity_date" not in df.columns and "activity_start_time" in df.columns:
            df = df.with_columns(pl.col("activity_start_time").dt.date().alias("activity_date"))

        stats["cleaned"] = len(df)
        stats["removed"] = stats["total"] - stats["cleaned"]
        self.cleaning_stats["nursing_records"] = stats

        return df, stats

    def clean_access_records(self, df: pl.DataFrame) -> Tuple[pl.DataFrame, Dict]:
        if df.is_empty():
            return df, {"total": 0, "cleaned": 0, "removed": 0}

        stats = {"total": len(df), "duplicates_removed": 0, "invalid_removed": 0}

        if "timestamp" in df.columns:
            df = df.with_columns(pl.col("timestamp").str.to_datetime(strict=False).alias("timestamp"))

        dedup_cols = ["person_id", "timestamp", "device_id", "direction"]
        existing_dedup_cols = [c for c in dedup_cols if c in df.columns]
        if existing_dedup_cols:
            before = len(df)
            df = df.unique(subset=existing_dedup_cols, keep="first")
            stats["duplicates_removed"] = before - len(df)

        if "person_id" in df.columns and "timestamp" in df.columns:
            before = len(df)
            df = df.filter(
                pl.col("person_id").is_not_null() & 
                (pl.col("person_id") != "") &
                pl.col("timestamp").is_not_null()
            )
            stats["invalid_removed"] = before - len(df)

        if "access_date" not in df.columns and "timestamp" in df.columns:
            df = df.with_columns(pl.col("timestamp").dt.date().alias("access_date"))

        stats["cleaned"] = len(df)
        stats["removed"] = stats["total"] - stats["cleaned"]
        self.cleaning_stats["access_records"] = stats

        return df, stats

    def clean_health_data(self, df: pl.DataFrame) -> Tuple[pl.DataFrame, Dict]:
        if df.is_empty():
            return df, {"total": 0, "cleaned": 0, "removed": 0}

        stats = {"total": len(df), "duplicates_removed": 0, "invalid_removed": 0}

        if "record_time" in df.columns:
            df = df.with_columns(pl.col("record_time").str.to_datetime(strict=False).alias("record_time"))

        dedup_cols = ["elder_id", "record_time", "device_type", "metric_type"]
        existing_dedup_cols = [c for c in dedup_cols if c in df.columns]
        if existing_dedup_cols:
            before = len(df)
            df = df.unique(subset=existing_dedup_cols, keep="last")
            stats["duplicates_removed"] = before - len(df)

        if "metric_value" in df.columns:
            before = len(df)
            df = df.filter(pl.col("metric_value").is_not_null())
            stats["invalid_removed"] += before - len(df)

        if "elder_id" in df.columns:
            before = len(df)
            df = df.filter(pl.col("elder_id").is_not_null() & (pl.col("elder_id") != ""))
            stats["invalid_removed"] += before - len(df)

        df = self._normalize_health_metrics(df)

        if "record_date" not in df.columns and "record_time" in df.columns:
            df = df.with_columns(pl.col("record_time").dt.date().alias("record_date"))

        stats["cleaned"] = len(df)
        stats["removed"] = stats["total"] - stats["cleaned"]
        self.cleaning_stats["health_data"] = stats

        return df, stats

    def _normalize_activity_codes(self, df: pl.DataFrame) -> pl.DataFrame:
        if "activity_code" not in df.columns:
            return df

        valid_codes = set(ACTIVITY_TYPES.keys())
        
        code_mapping = {
            "早晨护理": "morning_care",
            "晚上护理": "evening_care",
            "喂饭": "meal_assist",
            "洗澡": "bathing",
            "康复训练": "rehab_exercise",
            "理疗": "physical_therapy",
            "益智": "mental_activity",
            "社交": "social_activity",
            "吃药提醒": "medication_reminder",
            "量血压": "vital_signs",
            "换药": "wound_care",
            "跌倒处理": "fall_response",
        }

        df = df.with_columns([
            pl.col("activity_code").replace(code_mapping).alias("activity_code")
        ])

        if "activity_name" not in df.columns:
            df = df.with_columns([
                pl.col("activity_code").map_dict(
                    {k: v.name for k, v in ACTIVITY_TYPES.items()},
                    default=pl.col("activity_code")
                ).alias("activity_name")
            ])

        if "activity_category" not in df.columns:
            df = df.with_columns([
                pl.col("activity_code").map_dict(
                    {k: v.category for k, v in ACTIVITY_TYPES.items()},
                    default="其他"
                ).alias("activity_category")
            ])

        return df

    def _normalize_health_metrics(self, df: pl.DataFrame) -> pl.DataFrame:
        if "metric_type" not in df.columns:
            return df

        metric_mapping = {
            "heart_rate": "heart_rate",
            "心率": "heart_rate",
            "blood_pressure_systolic": "bp_systolic",
            "收缩压": "bp_systolic",
            "blood_pressure_diastolic": "bp_diastolic",
            "舒张压": "bp_diastolic",
            "blood_oxygen": "blood_oxygen",
            "血氧": "blood_oxygen",
            "blood_glucose": "blood_glucose",
            "血糖": "blood_glucose",
            "temperature": "temperature",
            "体温": "temperature",
            "sleep_score": "sleep_score",
            "睡眠评分": "sleep_score",
            "activity_steps": "activity_steps",
            "步数": "activity_steps",
            "fall_detected": "fall_detected",
            "跌倒检测": "fall_detected",
        }

        df = df.with_columns([
            pl.col("metric_type").replace(metric_mapping).alias("metric_type")
        ])

        if "fall_detected" in df.select(pl.col("metric_type")).to_series().to_list():
            df = df.with_columns([
                pl.when((pl.col("metric_type") == "fall_detected") & (pl.col("metric_value") >= 1))
                .then(True)
                .otherwise(False)
                .alias("is_fall_alert")
            ])

        return df

    def normalize_elder_profiles(self, df: pl.DataFrame) -> Tuple[pl.DataFrame, Dict]:
        if df.is_empty():
            return df, {"total": 0, "cleaned": 0}

        stats = {"total": len(df)}

        if "care_level" in df.columns:
            level_mapping = {
                "一级": "level_1",
                "二级": "level_2", 
                "三级": "level_3",
                "四级": "level_4",
                "五级": "level_5",
                "自理": "level_1",
                "半自理": "level_2",
                "半失能": "level_3",
                "失能": "level_4",
                "特护": "level_5",
            }
            
            df = df.with_columns([
                pl.col("care_level").replace(level_mapping).alias("care_level")
            ])

            df = df.with_columns([
                pl.col("care_level").map_dict(
                    {k: v.name for k, v in CARE_LEVELS.items()},
                    default=pl.col("care_level")
                ).alias("care_level_name"),
                pl.col("care_level").map_dict(
                    {k: v.daily_care_minutes for k, v in CARE_LEVELS.items()},
                    default=30
                ).alias("standard_daily_minutes")
            ])

        if "birth_date" in df.columns and "age" not in df.columns:
            df = df.with_columns([
                pl.col("birth_date").str.to_date(strict=False).alias("birth_date")
            ])
            df = df.with_columns([
                ((datetime.now().date() - pl.col("birth_date")).dt.total_days() / 365.25)
                .floor()
                .cast(pl.Int32)
                .alias("age")
            ])

        stats["cleaned"] = len(df)
        return df, stats

    def get_cleaning_report(self) -> Dict:
        return self.cleaning_stats
