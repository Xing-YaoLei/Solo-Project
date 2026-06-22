import polars as pl
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import numpy as np


class DataReconciliation:
    def __init__(self, case_df: pl.DataFrame, payment_df: pl.DataFrame, email_df: pl.DataFrame):
        self.case_df = case_df
        self.payment_df = payment_df
        self.email_df = email_df

    def field_level_comparison(self) -> pl.DataFrame:
        case_agg = self.case_df.group_by("case_id").agg(
            pl.col("submit_date").first().alias("case_submit_date"),
            pl.col("status").first().alias("case_status"),
            pl.col("case_type").first().alias("case_type"),
            pl.col("department").first().alias("department"),
        )

        payment_agg = self.payment_df.filter(
            pl.col("related_case_id") != ""
        ).group_by("related_case_id").agg(
            pl.col("amount").sum().alias("payment_amount"),
            pl.col("payment_id").count().alias("payment_count"),
            pl.col("payment_date").min().alias("first_payment_date"),
            pl.col("fee_type").unique().alias("fee_types"),
        )

        email_agg = self.email_df.filter(
            pl.col("related_case_id") != ""
        ).group_by("related_case_id").agg(
            pl.col("email_id").count().alias("email_count"),
            pl.col("file_size_mb").sum().alias("total_file_size_mb"),
            pl.col("doc_type").unique().alias("doc_types"),
            pl.col("archived").sum().alias("archived_count"),
        )

        merged = case_agg.join(
            payment_agg,
            left_on="case_id",
            right_on="related_case_id",
            how="left",
        ).join(
            email_agg,
            left_on="case_id",
            right_on="related_case_id",
            how="left",
        )

        merged = merged.with_columns([
            pl.col("payment_amount").fill_null(0).alias("payment_amount"),
            pl.col("payment_count").fill_null(0).alias("payment_count"),
            pl.col("email_count").fill_null(0).alias("email_count"),
            pl.col("total_file_size_mb").fill_null(0).alias("total_file_size_mb"),
            pl.col("archived_count").fill_null(0).alias("archived_count"),
            pl.when(pl.col("payment_count") > 0)
            .then(pl.lit("已匹配"))
            .otherwise(pl.lit("未匹配"))
            .alias("payment_match_status"),
            pl.when(pl.col("email_count") > 0)
            .then(pl.lit("已关联"))
            .otherwise(pl.lit("未关联"))
            .alias("email_relation_status"),
        ])

        return merged

    def calibre_conflict_report(self) -> Dict:
        case_count = self.case_df.height
        payment_case_count = self.payment_df.filter(
            pl.col("related_case_id") != ""
        )["related_case_id"].n_unique()
        email_case_count = self.email_df.filter(
            pl.col("related_case_id") != ""
        )["related_case_id"].n_unique()

        payment_total = self.payment_df["amount"].sum()
        matched_payment = self.payment_df.filter(
            pl.col("related_case_id") != ""
        )["amount"].sum()

        archived_cases = self.case_df.filter(pl.col("status") == "已归档").height
        archived_rate = archived_cases / case_count * 100 if case_count > 0 else 0

        email_archived = self.email_df.filter(pl.col("archived")).height
        email_archived_rate = email_archived / self.email_df.height * 100 if self.email_df.height > 0 else 0

        conflict_fields = [
            {
                "field": "案件数量",
                "case_system": case_count,
                "payment_system": payment_case_count,
                "email_system": email_case_count,
                "diff_payment": case_count - payment_case_count,
                "diff_email": case_count - email_case_count,
                "conflict_type": "口径差异",
                "explanation": "案件系统统计所有案件，收款流水仅统计已关联案件，邮件仅统计已关联案件",
            },
            {
                "field": "归档率",
                "case_system": round(archived_rate, 2),
                "payment_system": None,
                "email_system": round(email_archived_rate, 2),
                "diff_payment": None,
                "diff_email": round(archived_rate - email_archived_rate, 2),
                "conflict_type": "定义不同",
                "explanation": "案件系统按案件状态归档，邮件按附件是否归档统计",
            },
            {
                "field": "金额统计",
                "case_system": None,
                "payment_system": round(payment_total, 2),
                "email_system": None,
                "diff_payment": None,
                "diff_email": None,
                "conflict_type": "口径差异",
                "explanation": "收款流水统计全部收款，其中已关联案件金额占比需单独核算",
            },
        ]

        return {
            "summary": {
                "total_cases": case_count,
                "total_payments": self.payment_df.height,
                "total_emails": self.email_df.height,
                "matched_payment_ratio": round(payment_case_count / case_count * 100, 2) if case_count > 0 else 0,
                "matched_email_ratio": round(email_case_count / case_count * 100, 2) if case_count > 0 else 0,
            },
            "conflict_fields": conflict_fields,
        }

    def audit_rejection_gaps(self) -> pl.DataFrame:
        rejected = self.case_df.filter(pl.col("status") == "已退回")

        gaps = rejected.with_columns([
            pl.when(pl.col("review_comments").str.contains("证据"))
            .then(pl.lit("证据材料缺口"))
            .when(pl.col("review_comments").str.contains("格式"))
            .then(pl.lit("格式规范缺口"))
            .when(pl.col("review_comments").str.contains("信息"))
            .then(pl.lit("信息完整性缺口"))
            .when(pl.col("review_comments").str.contains("请求"))
            .then(pl.lit("诉求明确性缺口"))
            .when(pl.col("review_comments").str.contains("法律"))
            .then(pl.lit("法律依据缺口"))
            .otherwise(pl.lit("其他缺口"))
            .alias("gap_type"),
            pl.col("review_comments").alias("gap_description"),
        ])

        return gaps.select([
            "case_id", "case_type", "department", "lawyer",
            "submit_date", "version", "gap_type", "gap_description", "tags",
        ])

    def gap_summary(self) -> pl.DataFrame:
        gaps = self.audit_rejection_gaps()
        summary = gaps.group_by("gap_type").agg(
            pl.col("case_id").count().alias("gap_count"),
            pl.col("case_type").unique().alias("affected_types"),
            pl.col("department").unique().alias("affected_departments"),
        ).sort("gap_count", descending=True)
        return summary


class ConversionAnalytics:
    def __init__(self, schedule_df: pl.DataFrame):
        self.schedule_df = schedule_df

    def _get_period_data(self, date_col: str, period: str) -> pl.DataFrame:
        df = self.schedule_df.with_columns([
            pl.col(date_col).str.to_date().alias("date"),
        ])

        if period == "day":
            df = df.with_columns(pl.col("date").alias("period"))
        elif period == "week":
            df = df.with_columns(
                pl.col("date").dt.truncate("1w").alias("period")
            )
        elif period == "month":
            df = df.with_columns(
                pl.col("date").dt.truncate("1mo").alias("period")
            )
        else:
            df = df.with_columns(pl.col("date").alias("period"))

        return df

    def conversion_trend(self, period: str = "month") -> pl.DataFrame:
        df = self._get_period_data("publish_date", period)

        trend = df.group_by("period").agg([
            pl.col("views").sum().alias("total_views"),
            pl.col("conversions").sum().alias("total_conversions"),
            pl.col("conversion_rate").mean().round(2).alias("avg_conversion_rate"),
            pl.col("target_rate").mean().round(2).alias("avg_target_rate"),
            pl.col("schedule_id").count().alias("content_count"),
        ]).sort("period")

        return trend

    def yo_y_comparison(self, period: str = "month") -> pl.DataFrame:
        df = self._get_period_data("publish_date", period)

        current = df.filter(
            pl.col("date").dt.year() == datetime.now().year
        ).group_by("period").agg([
            pl.col("conversions").sum().alias("current_conversions"),
            pl.col("views").sum().alias("current_views"),
            pl.col("conversion_rate").mean().alias("current_rate"),
        ])

        last_year = df.filter(
            pl.col("date").dt.year() == datetime.now().year - 1
        ).group_by("period").agg([
            pl.col("conversions").sum().alias("last_year_conversions"),
            pl.col("views").sum().alias("last_year_views"),
            pl.col("conversion_rate").mean().alias("last_year_rate"),
        ])

        current = current.with_columns(
            pl.col("period").dt.offset_by("-1y").alias("period_last_year")
        )

        merged = current.join(
            last_year,
            left_on="period_last_year",
            right_on="period",
            how="left",
        )

        merged = merged.with_columns([
            (
                (pl.col("current_conversions") - pl.col("last_year_conversions"))
                / pl.col("last_year_conversions") * 100
            ).round(2).alias("yoy_conversion_pct"),
            (
                (pl.col("current_rate") - pl.col("last_year_rate"))
                / pl.col("last_year_rate") * 100
            ).round(2).alias("yoy_rate_pct"),
        ])

        return merged.select([
            "period", "current_conversions", "last_year_conversions",
            "yoy_conversion_pct", "current_rate", "last_year_rate", "yoy_rate_pct",
        ]).sort("period")

    def mom_comparison(self, period: str = "month") -> pl.DataFrame:
        df = self._get_period_data("publish_date", period)

        monthly = df.group_by("period").agg([
            pl.col("conversions").sum().alias("conversions"),
            pl.col("views").sum().alias("views"),
            pl.col("conversion_rate").mean().alias("conversion_rate"),
        ]).sort("period")

        monthly = monthly.with_columns([
            pl.col("conversions").shift(1).alias("prev_period_conversions"),
            pl.col("conversion_rate").shift(1).alias("prev_period_rate"),
        ])

        monthly = monthly.with_columns([
            (
                (pl.col("conversions") - pl.col("prev_period_conversions"))
                / pl.col("prev_period_conversions") * 100
            ).round(2).alias("mom_conversion_pct"),
            (
                (pl.col("conversion_rate") - pl.col("prev_period_rate"))
                / pl.col("prev_period_rate") * 100
            ).round(2).alias("mom_rate_pct"),
        ])

        return monthly

    def target_comparison(self, period: str = "month") -> pl.DataFrame:
        df = self._get_period_data("publish_date", period)

        target_df = df.group_by("period").agg([
            pl.col("conversion_rate").mean().round(2).alias("actual_rate"),
            pl.col("target_rate").mean().round(2).alias("target_rate"),
            pl.col("conversions").sum().alias("actual_conversions"),
            pl.col("schedule_id").count().alias("content_count"),
        ]).sort("period")

        target_df = target_df.with_columns([
            (pl.col("actual_rate") - pl.col("target_rate")).round(2).alias("rate_gap"),
            (
                (pl.col("actual_rate") - pl.col("target_rate")) / pl.col("target_rate") * 100
            ).round(2).alias("target_achievement_pct"),
            pl.when(pl.col("actual_rate") >= pl.col("target_rate"))
            .then(pl.lit("达标"))
            .otherwise(pl.lit("未达标"))
            .alias("target_status"),
        ])

        return target_df

    def abnormal_points(self) -> pl.DataFrame:
        abnormal = self.schedule_df.filter(pl.col("is_abnormal")).select([
            "schedule_id", "publish_date", "title", "content_type",
            "views", "conversions", "conversion_rate",
            "abnormal_reason", "target_rate",
        ]).sort("publish_date", descending=True)
        return abnormal


class VersionAnalytics:
    def __init__(self, version_df: pl.DataFrame, case_df: pl.DataFrame):
        self.version_df = version_df
        self.case_df = case_df

    def version_overview(self) -> Dict:
        version_dist = self.case_df.group_by("version").agg(
            pl.col("case_id").count().alias("case_count")
        ).sort("version")

        avg_versions = self.case_df["version"].mean()
        max_versions = self.case_df["version"].max()
        single_version_count = self.case_df.filter(
            pl.col("version") == 1
        ).height
        multi_version_count = self.case_df.filter(
            pl.col("version") > 1
        ).height

        return {
            "distribution": version_dist,
            "avg_versions": round(avg_versions, 2),
            "max_versions": max_versions,
            "single_version_count": single_version_count,
            "multi_version_count": multi_version_count,
            "multi_version_ratio": round(
                multi_version_count / self.case_df.height * 100, 2
            ) if self.case_df.height > 0 else 0,
        }

    def version_by_type(self) -> pl.DataFrame:
        result = self.case_df.group_by("case_type").agg([
            pl.col("case_id").count().alias("total_cases"),
            pl.col("version").mean().round(2).alias("avg_versions"),
            pl.col("version").max().alias("max_versions"),
            (pl.col("version") > 1).sum().alias("multi_version_count"),
        ]).sort("avg_versions", descending=True)
        return result

    def review_outcome_analysis(self) -> pl.DataFrame:
        review_stats = self.version_df.group_by("review_status").agg(
            pl.col("case_id").count().alias("version_count")
        )

        pass_rate = self.version_df.filter(
            pl.col("review_status") == "通过"
        ).height / self.version_df.height * 100 if self.version_df.height > 0 else 0

        return review_stats

    def tag_review_correlation(self, tags_col: str = "tags") -> pl.DataFrame:
        case_with_tags = self.case_df.select(["case_id", "status", "tags"])
        version_review = self.version_df.filter(
            pl.col("review_status") != "通过"
        ).group_by("case_id").agg(
            pl.col("version").count().alias("reject_count")
        )

        merged = case_with_tags.join(
            version_review, on="case_id", how="left"
        ).with_columns(
            pl.col("reject_count").fill_null(0).alias("reject_count")
        )

        exploded = merged.with_columns(
            pl.col("tags").str.split(",").alias("tag_list")
        ).explode("tag_list")

        result = exploded.group_by("tag_list").agg([
            pl.col("case_id").n_unique().alias("case_count"),
            pl.col("reject_count").mean().round(2).alias("avg_rejects"),
            pl.col("reject_count").sum().alias("total_rejects"),
        ]).sort("total_rejects", descending=True).rename({"tag_list": "tag"})

        return result
