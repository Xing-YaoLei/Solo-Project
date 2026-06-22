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


class VersionConversionLinkage:
    def __init__(self, case_df: pl.DataFrame, version_df: pl.DataFrame, schedule_df: pl.DataFrame):
        self.case_df = case_df
        self.version_df = version_df
        self.schedule_df = schedule_df

    def _enrich_cases(self) -> pl.DataFrame:
        version_stats = self.version_df.group_by("case_id").agg([
            pl.col("version").max().alias("total_versions"),
            (pl.col("review_status") == "退回修改").sum().alias("reject_times"),
            (pl.col("review_status") == "通过").sum().alias("pass_times"),
            pl.col("version_date").min().alias("first_version_date"),
            pl.col("version_date").max().alias("final_version_date"),
            pl.col("word_count_delta").sum().alias("total_word_delta"),
        ])

        enriched = self.case_df.join(
            version_stats, on="case_id", how="left"
        ).with_columns([
            pl.col("total_versions").fill_null(1).alias("total_versions"),
            pl.col("reject_times").fill_null(0).alias("reject_times"),
            pl.col("pass_times").fill_null(0).alias("pass_times"),
            pl.col("total_word_delta").fill_null(0).alias("total_word_delta"),
        ])

        enriched = enriched.with_columns([
            (pl.col("total_versions") > 1).alias("has_iteration"),
            pl.when(pl.col("reject_times") >= 3)
            .then(pl.lit("多次退回"))
            .when(pl.col("reject_times") >= 1)
            .then(pl.lit("少量退回"))
            .otherwise(pl.lit("一次通过"))
            .alias("review_quality"),
        ])

        return enriched

    def _build_conversion_index(self, period: str = "month") -> pl.DataFrame:
        df = self.schedule_df.with_columns(
            pl.col("publish_date").str.to_date().alias("date")
        )
        if period == "day":
            df = df.with_columns(pl.col("date").alias("period"))
        elif period == "week":
            df = df.with_columns(pl.col("date").dt.truncate("1w").alias("period"))
        else:
            df = df.with_columns(pl.col("date").dt.truncate("1mo").alias("period"))

        conv_index = df.group_by("period").agg([
            pl.col("conversion_rate").mean().alias("period_avg_conversion_rate"),
            pl.col("conversions").sum().alias("period_total_conversions"),
            pl.col("views").sum().alias("period_total_views"),
            pl.col("schedule_id").count().alias("period_content_count"),
            pl.col("target_rate").mean().alias("period_avg_target_rate"),
        ]).sort("period")

        return conv_index

    def _attach_period(self, df: pl.DataFrame, date_col: str, period: str) -> pl.DataFrame:
        result = df.with_columns(pl.col(date_col).str.to_date().alias("_date_tmp"))
        if period == "day":
            result = result.with_columns(pl.col("_date_tmp").alias("period"))
        elif period == "week":
            result = result.with_columns(pl.col("_date_tmp").dt.truncate("1w").alias("period"))
        else:
            result = result.with_columns(pl.col("_date_tmp").dt.truncate("1mo").alias("period"))
        return result.drop("_date_tmp")

    def version_iteration_vs_conversion(self, period: str = "month") -> pl.DataFrame:
        conv_index = self._build_conversion_index(period)
        enriched_cases = self._enrich_cases()
        cases_with_period = self._attach_period(enriched_cases, "submit_date", period)

        case_stats = cases_with_period.group_by("period").agg([
            pl.col("case_id").count().alias("case_count"),
            pl.col("total_versions").mean().round(2).alias("avg_case_versions"),
            pl.col("reject_times").mean().round(2).alias("avg_reject_times"),
            (pl.col("has_iteration")).mean().round(4).alias("iteration_ratio"),
            (pl.col("review_quality") == "一次通过").mean().round(4).alias("one_pass_ratio"),
            (pl.col("status") == "已归档").mean().round(4).alias("archived_ratio"),
        ])

        merged = case_stats.join(conv_index, on="period", how="inner").sort("period")

        merged = merged.with_columns([
            (pl.col("iteration_ratio") * 100).round(2).alias("iteration_ratio_pct"),
            (pl.col("one_pass_ratio") * 100).round(2).alias("one_pass_ratio_pct"),
            (pl.col("archived_ratio") * 100).round(2).alias("archived_ratio_pct"),
        ])

        return merged

    def conversion_improvement_by_version_group(self) -> pl.DataFrame:
        conv_index = self._build_conversion_index("month")
        enriched_cases = self._enrich_cases()
        cases_with_period = self._attach_period(enriched_cases, "submit_date", "month")

        cases_with_period = cases_with_period.with_columns([
            pl.when(pl.col("total_versions") == 1)
            .then(pl.lit("V1 一次成型"))
            .when(pl.col("total_versions") == 2)
            .then(pl.lit("V2 小范围优化"))
            .when(pl.col("total_versions") == 3)
            .then(pl.lit("V3 中度迭代"))
            .otherwise(pl.lit("V4+ 深度打磨"))
            .alias("version_group"),
        ])

        grouped = cases_with_period.group_by(["period", "version_group"]).agg([
            pl.col("case_id").count().alias("group_case_count"),
            pl.col("reject_times").mean().round(2).alias("group_avg_rejects"),
            pl.col("total_word_delta").mean().round(0).alias("group_avg_word_delta"),
        ]).join(conv_index, on="period", how="inner").sort(["version_group", "period"])

        summary = grouped.group_by("version_group").agg([
            pl.col("group_case_count").sum().alias("total_cases"),
            pl.col("period_avg_conversion_rate").mean().round(2).alias("avg_conversion_rate"),
            pl.col("period_total_conversions").mean().round(0).alias("avg_period_conversions"),
            pl.col("group_avg_rejects").mean().round(2).alias("avg_reject_times"),
            pl.col("group_avg_word_delta").mean().round(0).alias("avg_word_delta"),
        ])

        baseline = summary.filter(pl.col("version_group") == "V1 一次成型")
        if baseline.height > 0:
            baseline_rate = baseline["avg_conversion_rate"][0]
            summary = summary.with_columns([
                (pl.col("avg_conversion_rate") - baseline_rate).round(2).alias("conversion_rate_diff"),
                ((pl.col("avg_conversion_rate") - baseline_rate) / baseline_rate * 100).round(2).alias("conversion_improvement_pct"),
            ])
        else:
            summary = summary.with_columns([
                pl.lit(0.0).alias("conversion_rate_diff"),
                pl.lit(0.0).alias("conversion_improvement_pct"),
            ])

        return summary.sort("version_group")

    def improvement_trend(self, period: str = "month") -> pl.DataFrame:
        trend = self.version_iteration_vs_conversion(period)

        trend = trend.with_columns([
            pl.col("avg_case_versions").shift(1).alias("prev_versions"),
            pl.col("period_avg_conversion_rate").shift(1).alias("prev_conversion_rate"),
        ])

        trend = trend.with_columns([
            (pl.col("avg_case_versions") - pl.col("prev_versions")).round(2).alias("version_change"),
            (pl.col("period_avg_conversion_rate") - pl.col("prev_conversion_rate")).round(2).alias("conversion_rate_change"),
        ])

        trend = trend.with_columns([
            pl.when(
                (pl.col("version_change").is_not_null()) & (pl.col("version_change") != 0)
            )
            .then((pl.col("conversion_rate_change") / pl.col("version_change").abs()).round(4))
            .otherwise(None)
            .alias("improvement_per_version"),
        ])

        return trend

    def quality_review_conversion_matrix(self) -> pl.DataFrame:
        conv_index = self._build_conversion_index("month")
        enriched_cases = self._enrich_cases()
        cases_with_period = self._attach_period(enriched_cases, "submit_date", "month")

        matrix = cases_with_period.group_by(["period", "review_quality"]).agg([
            pl.col("case_id").count().alias("case_count"),
        ]).join(conv_index, on="period", how="inner")

        pivot = matrix.group_by("review_quality").agg([
            pl.col("case_count").sum().alias("total_cases"),
            pl.col("period_avg_conversion_rate").mean().round(2).alias("avg_conversion_rate"),
            pl.col("period_total_conversions").mean().round(0).alias("avg_period_conversions"),
        ]).sort("avg_conversion_rate", descending=True)

        baseline = pivot["avg_conversion_rate"].min() if pivot.height > 0 else 0
        pivot = pivot.with_columns([
            (pl.col("avg_conversion_rate") - baseline).round(2).alias("vs_baseline_diff"),
        ])

        return pivot

    def core_retrospective_metrics(self) -> Dict:
        enriched = self._enrich_cases()

        total_cases = enriched.height
        one_pass_count = enriched.filter(pl.col("review_quality") == "一次通过").height
        one_pass_rate = round(one_pass_count / total_cases * 100, 2) if total_cases > 0 else 0

        iter_cases = enriched.filter(pl.col("has_iteration")).height
        iter_ratio = round(iter_cases / total_cases * 100, 2) if total_cases > 0 else 0

        avg_versions = round(enriched["total_versions"].mean(), 2) if total_cases > 0 else 0
        avg_rejects = round(enriched["reject_times"].mean(), 2) if total_cases > 0 else 0

        version_conv = self.conversion_improvement_by_version_group()
        if version_conv.height > 0:
            best_row = version_conv.sort("conversion_improvement_pct", descending=True).head(1)
            best_group = best_row["version_group"][0] if best_row.height > 0 else "N/A"
            best_improvement = best_row["conversion_improvement_pct"][0] if best_row.height > 0 else 0
        else:
            best_group = "N/A"
            best_improvement = 0

        quality_matrix = self.quality_review_conversion_matrix()
        if quality_matrix.height > 0:
            best_quality = quality_matrix.head(1)["review_quality"][0]
            best_quality_rate = quality_matrix.head(1)["avg_conversion_rate"][0]
        else:
            best_quality = "N/A"
            best_quality_rate = 0

        return {
            "overview": {
                "total_cases": total_cases,
                "one_pass_rate": one_pass_rate,
                "iteration_ratio": iter_ratio,
                "avg_versions": avg_versions,
                "avg_reject_times": avg_rejects,
            },
            "best_version_group": {
                "group": best_group,
                "improvement_pct": best_improvement,
            },
            "best_quality": {
                "quality": best_quality,
                "avg_conversion_rate": best_quality_rate,
            },
            "version_group_detail": version_conv,
            "quality_matrix": quality_matrix,
        }
