from typing import Dict, List, Optional
from datetime import datetime, timedelta

import polars as pl


class DataMatcher:
    def __init__(self):
        self.match_stats = {}

    def match_fall_events_with_care(self, fall_events: pl.DataFrame, nursing_records: pl.DataFrame) -> pl.DataFrame:
        if fall_events.is_empty() or nursing_records.is_empty():
            return pl.DataFrame()

        fall_within_window = fall_events.with_columns([
            pl.col("record_time").alias("fall_time"),
            (pl.col("record_time") - timedelta(minutes=15)).alias("fall_window_start"),
            (pl.col("record_time") + timedelta(hours=2)).alias("fall_window_end"),
        ])

        fall_responses = nursing_records.filter(
            pl.col("activity_code") == "fall_response"
        )

        result = fall_within_window.join(
            fall_responses,
            on="elder_id",
            how="left"
        ).filter(
            (pl.col("activity_start_time") >= pl.col("fall_window_start")) &
            (pl.col("activity_start_time") <= pl.col("fall_window_end"))
        )

        result = result.select([
            "elder_id",
            "fall_time",
            "activity_start_time",
            "activity_end_time",
            "activity_duration",
            "nurse_id",
            "quality_score",
            "notes"
        ]).with_columns([
            (pl.col("activity_start_time") - pl.col("fall_time")).dt.total_minutes().alias("response_minutes")
        ])

        return result

    def calculate_daily_care_minutes(self, nursing_records: pl.DataFrame, elder_profiles: pl.DataFrame) -> pl.DataFrame:
        if nursing_records.is_empty():
            return pl.DataFrame()

        daily_summary = nursing_records.group_by(["elder_id", "activity_date"]).agg([
            pl.sum("activity_duration").alias("total_care_minutes"),
            pl.count("activity_code").alias("total_activities"),
            pl.col("activity_category").value_counts().alias("category_distribution"),
            pl.mean("quality_score").alias("avg_quality_score").round(1)
        ])

        if not elder_profiles.is_empty():
            daily_summary = daily_summary.join(
                elder_profiles.select(["elder_id", "name", "care_level", "care_level_name", "standard_daily_minutes"]),
                on="elder_id",
                how="left"
            )

            daily_summary = daily_summary.with_columns([
                (pl.col("total_care_minutes") >= pl.col("standard_daily_minutes")).alias("is_care_达标"),
                (pl.col("total_care_minutes") / pl.col("standard_daily_minutes") * 100).round(1).alias("care_completion_rate")
            ])

        return daily_summary

    def correlate_access_with_activity(self, access_records: pl.DataFrame, nursing_records: pl.DataFrame) -> pl.DataFrame:
        if access_records.is_empty() or nursing_records.is_empty():
            return pl.DataFrame()

        nurse_access = access_records.filter(pl.col("person_type") == "staff")
        
        result = nursing_records.join(
            nurse_access.select(["person_id", "timestamp", "direction", "device_id"]),
            left_on=["nurse_id", "activity_date"],
            right_on=[pl.col("person_id"), pl.col("timestamp").dt.date()],
            how="left"
        )

        return result

    def match_health_alerts(self, health_data: pl.DataFrame, nursing_records: pl.DataFrame) -> pl.DataFrame:
        if health_data.is_empty() or nursing_records.is_empty():
            return pl.DataFrame()

        alerts = health_data.filter(pl.col("is_alert") == True) if "is_alert" in health_data.columns else health_data

        alerts_with_window = alerts.with_columns([
            pl.col("record_time").alias("alert_time"),
            (pl.col("record_time") - timedelta(minutes=30)).alias("window_start"),
            (pl.col("record_time") + timedelta(hours=1)).alias("window_end"),
        ])

        result = alerts_with_window.join(
            nursing_records,
            on="elder_id",
            how="left"
        ).filter(
            (pl.col("activity_start_time") >= pl.col("window_start")) &
            (pl.col("activity_start_time") <= pl.col("window_end"))
        )

        return result

    def create_unified_view(self, elder_profiles: pl.DataFrame, 
                            nursing_records: pl.DataFrame,
                            health_data: pl.DataFrame) -> pl.DataFrame:
        if elder_profiles.is_empty():
            return pl.DataFrame()

        latest_health = self._get_latest_health_metrics(health_data)
        latest_care = self._get_latest_care_summary(nursing_records)

        unified = elder_profiles.join(
            latest_health,
            on="elder_id",
            how="left"
        ).join(
            latest_care,
            on="elder_id",
            how="left"
        )

        return unified

    def _get_latest_health_metrics(self, health_data: pl.DataFrame) -> pl.DataFrame:
        if health_data.is_empty():
            return pl.DataFrame()

        latest_records = health_data.sort("record_time", descending=True).group_by("elder_id").head(1)
        
        pivot = latest_records.pivot(
            index="elder_id",
            columns="metric_type",
            values="metric_value",
            aggregate_function="first"
        )

        return pivot

    def _get_latest_care_summary(self, nursing_records: pl.DataFrame) -> pl.DataFrame:
        if nursing_records.is_empty():
            return pl.DataFrame()

        return nursing_records.sort("activity_start_time", descending=True).group_by("elder_id").agg([
            pl.first("activity_date").alias("last_care_date"),
            pl.first("activity_name").alias("last_activity_name"),
            pl.first("nurse_id").alias("last_nurse_id"),
            pl.first("quality_score").alias("last_quality_score"),
            pl.count("activity_code").over("elder_id").alias("total_activities_7d")
        ])
