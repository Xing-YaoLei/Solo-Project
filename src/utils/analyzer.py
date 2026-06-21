import polars as pl
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass

from src.data.data_loader import data_loader
from src.data.pipeline import pipeline_manager
from config.settings import RISK_WORDS, RISK_WORD_THRESHOLD


@dataclass
class YoYMoMResult:
    current_value: float
    previous_value: float
    change_rate: float
    is_positive: bool

    def get(self, key: str, default=None):
        mapping = {
            "current": self.current_value,
            "current_value": self.current_value,
            "previous": self.previous_value,
            "previous_value": self.previous_value,
            "mom_change_pct": self.change_rate,
            "change_rate": self.change_rate,
            "yoy_change_pct": self.change_rate,
            "is_positive": self.is_positive,
        }
        return mapping.get(key, default)


class RiskAnalyzer:
    def __init__(self):
        self.loader = data_loader
        self.pipeline = pipeline_manager
        self.pipeline.load_mock_status()

    def get_overview_stats(self, date_range: Optional[Tuple[datetime, datetime]] = None) -> Dict[str, Any]:
        case_docs = self.loader.get_table("case_docs")
        if case_docs is None:
            return {}

        df = case_docs
        if date_range:
            start, end = date_range
            df = df.filter(
                (pl.col("submit_date") >= start) & (pl.col("submit_date") <= end)
            )

        total = len(df)
        returned = df.filter(pl.col("status") == "已退回").height
        passed = df.filter(pl.col("status") == "已通过").height
        published = df.filter(pl.col("status") == "已发布").height
        high_risk = df.filter(pl.col("risk_word_count") >= RISK_WORD_THRESHOLD).height
        avg_reviews = df["review_count"].mean() if total > 0 else 0

        return {
            "total_docs": total,
            "returned_count": returned,
            "return_rate": round(returned / total * 100, 2) if total > 0 else 0,
            "passed_count": passed,
            "pass_rate": round(passed / total * 100, 2) if total > 0 else 0,
            "published_count": published,
            "publish_rate": round(published / total * 100, 2) if total > 0 else 0,
            "high_risk_count": high_risk,
            "high_risk_rate": round(high_risk / total * 100, 2) if total > 0 else 0,
            "avg_review_rounds": round(avg_reviews, 2),
        }

    def get_daily_trend(self, days: int = 30) -> pl.DataFrame:
        case_docs = self.loader.get_table("case_docs")
        if case_docs is None:
            return pl.DataFrame()

        end_date = case_docs["submit_date"].max()
        start_date = end_date - timedelta(days=days)

        df = case_docs.filter(pl.col("submit_date") >= start_date)
        df = df.with_columns(pl.col("submit_date").dt.date().alias("date"))

        daily = df.group_by("date").agg(
            pl.len().alias("submit_count"),
            pl.when(pl.col("status") == "已退回").then(1).otherwise(0).sum().alias("return_count"),
            pl.when(pl.col("status") == "已发布").then(1).otherwise(0).sum().alias("publish_count"),
            pl.sum("risk_word_count").alias("total_risk_words"),
        ).sort("date")

        date_series = pl.date_range(
            start=start_date.date(),
            end=end_date.date(),
            interval="1d",
            eager=True
        ).alias("date")
        date_df = pl.DataFrame({"date": date_series})

        result = date_df.join(daily, on="date", how="left").fill_null(0)
        return result

    def _get_metric_value(self, df: pl.DataFrame, m: str) -> float:
        if m == "total":
            return len(df)
        elif m == "return_count":
            return df.filter(pl.col("status") == "已退回").height
        elif m == "return_rate":
            total = len(df)
            returned = df.filter(pl.col("status") == "已退回").height
            return returned / total * 100 if total > 0 else 0
        elif m == "publish_count":
            return df.filter(pl.col("status") == "已发布").height
        elif m == "publish_rate":
            total = len(df)
            published = df.filter(pl.col("status") == "已发布").height
            return published / total * 100 if total > 0 else 0
        elif m == "high_risk":
            return df.filter(pl.col("risk_word_count") >= RISK_WORD_THRESHOLD).height
        return 0

    def _calc_change_result(self, metric: str, current_val: float, prev_val: float) -> YoYMoMResult:
        if prev_val > 0:
            change_rate = (current_val - prev_val) / prev_val * 100
        else:
            change_rate = 100 if current_val > 0 else 0

        is_positive = metric in ["total", "publish_count", "publish_rate"] and change_rate >= 0
        if metric in ["return_count", "return_rate", "high_risk"]:
            is_positive = change_rate <= 0

        return YoYMoMResult(
            current_value=round(current_val, 2),
            previous_value=round(prev_val, 2),
            change_rate=round(change_rate, 2),
            is_positive=is_positive,
        )

    def get_yoy_mom(self, metric: str, current_start: datetime, current_end: datetime,
                    compare_type: str = "mom") -> YoYMoMResult:
        case_docs = self.loader.get_table("case_docs")
        if case_docs is None:
            return YoYMoMResult(0, 0, 0, True)

        current_df = case_docs.filter(
            (pl.col("submit_date") >= current_start) & (pl.col("submit_date") <= current_end)
        )

        period_days = (current_end - current_start).days

        if compare_type == "yoy":
            prev_start = current_start - timedelta(days=365)
            prev_end = current_end - timedelta(days=365)
        else:
            prev_start = current_start - timedelta(days=period_days)
            prev_end = current_start - timedelta(days=1)

        prev_df = case_docs.filter(
            (pl.col("submit_date") >= prev_start) & (pl.col("submit_date") <= prev_end)
        )

        current_val = self._get_metric_value(current_df, metric)
        prev_val = self._get_metric_value(prev_df, metric)

        return self._calc_change_result(metric, current_val, prev_val)

    def get_region_comparison(self, date_range: Optional[Tuple[datetime, datetime]] = None) -> pl.DataFrame:
        case_docs = self.loader.get_table("case_docs")
        if case_docs is None:
            return pl.DataFrame()

        df = case_docs
        if date_range:
            start, end = date_range
            df = df.filter(
                (pl.col("submit_date") >= start) & (pl.col("submit_date") <= end)
            )

        result = df.group_by("region").agg(
            pl.len().alias("total_docs"),
            pl.when(pl.col("status") == "已退回").then(1).otherwise(0).sum().alias("return_count"),
            pl.when(pl.col("status") == "已发布").then(1).otherwise(0).sum().alias("publish_count"),
            pl.mean("risk_word_count").alias("avg_risk_words"),
            pl.mean("review_count").alias("avg_review_rounds"),
        ).with_columns([
            (pl.col("return_count") / pl.col("total_docs") * 100).round(2).alias("return_rate"),
            (pl.col("publish_count") / pl.col("total_docs") * 100).round(2).alias("publish_rate"),
        ]).sort("total_docs", descending=True)

        return result

    def get_doc_type_comparison(self, date_range: Optional[Tuple[datetime, datetime]] = None) -> pl.DataFrame:
        case_docs = self.loader.get_table("case_docs")
        if case_docs is None:
            return pl.DataFrame()

        df = case_docs
        if date_range:
            start, end = date_range
            df = df.filter(
                (pl.col("submit_date") >= start) & (pl.col("submit_date") <= end)
            )

        result = df.group_by("doc_type").agg(
            pl.len().alias("total_docs"),
            pl.when(pl.col("status") == "已退回").then(1).otherwise(0).sum().alias("return_count"),
            pl.when(pl.col("status") == "已发布").then(1).otherwise(0).sum().alias("publish_count"),
            pl.mean("risk_word_count").alias("avg_risk_words"),
        ).with_columns([
            (pl.col("return_count") / pl.col("total_docs") * 100).round(2).alias("return_rate"),
            (pl.col("publish_count") / pl.col("total_docs") * 100).round(2).alias("publish_rate"),
        ]).sort("total_docs", descending=True)

        return result

    def get_content_conversion_funnel(self, date_range: Optional[Tuple[datetime, datetime]] = None) -> pl.DataFrame:
        case_docs = self.loader.get_table("case_docs")
        if case_docs is None:
            return pl.DataFrame()

        df = case_docs
        if date_range:
            start, end = date_range
            df = df.filter(
                (pl.col("submit_date") >= start) & (pl.col("submit_date") <= end)
            )

        total = len(df)
        reviewed = df.filter(pl.col("review_count") > 0).height
        passed = df.filter(pl.col("status") == "已通过").height
        published = df.filter(pl.col("status") == "已发布").height
        archived = df.filter(pl.col("status").is_in(["已发布", "已通过"])).height

        stages = [
            {"stage": "提交", "count": total, "conversion_rate": 100.0},
            {"stage": "审核", "count": reviewed, "conversion_rate": round(reviewed / total * 100, 2) if total > 0 else 0},
            {"stage": "通过", "count": passed, "conversion_rate": round(passed / total * 100, 2) if total > 0 else 0},
            {"stage": "发布", "count": published, "conversion_rate": round(published / total * 100, 2) if total > 0 else 0},
            {"stage": "归档", "count": archived, "conversion_rate": round(archived / total * 100, 2) if total > 0 else 0},
        ]

        return pl.DataFrame(stages)

    def get_risk_word_distribution(self, date_range: Optional[Tuple[datetime, datetime]] = None) -> pl.DataFrame:
        case_docs = self.loader.get_table("case_docs")
        if case_docs is None:
            return pl.DataFrame()

        df = case_docs
        if date_range:
            start, end = date_range
            df = df.filter(
                (pl.col("submit_date") >= start) & (pl.col("submit_date") <= end)
            )

        returned_df = df.filter(pl.col("status") == "已退回")
        all_risk_words = []
        for words in returned_df["risk_words"].to_list():
            if words:
                all_risk_words.extend([w.strip() for w in words.split(",") if w.strip()])

        if not all_risk_words:
            return pl.DataFrame({"word": [], "count": []})

        word_counts: Dict[str, int] = {}
        for w in all_risk_words:
            word_counts[w] = word_counts.get(w, 0) + 1

        result = pl.DataFrame({
            "word": list(word_counts.keys()),
            "count": list(word_counts.values()),
        }).sort("count", descending=True)

        return result

    def get_returned_samples(self, region: Optional[str] = None,
                             doc_type: Optional[str] = None,
                             lawyer: Optional[str] = None,
                             limit: int = 20) -> pl.DataFrame:
        case_docs = self.loader.get_table("case_docs")
        review_records = self.loader.get_table("review_records")
        if case_docs is None or review_records is None:
            return pl.DataFrame()

        df = case_docs.filter(pl.col("status") == "已退回")

        if region:
            df = df.filter(pl.col("region") == region)
        if doc_type:
            df = df.filter(pl.col("doc_type") == doc_type)
        if lawyer:
            df = df.filter(pl.col("lawyer") == lawyer)

        df = df.head(limit)

        latest_reviews = review_records.filter(pl.col("is_return") == True)
        latest_reviews = latest_reviews.sort("review_date", descending=True)
        latest_reviews = latest_reviews.unique(subset=["doc_id"], keep="first")

        result = df.join(
            latest_reviews.select(["doc_id", "review_date", "reviewer", "comments"]),
            on="doc_id",
            how="left"
        )

        return result

    def get_interaction_detail(self, doc_id: str) -> pl.DataFrame:
        interaction_logs = self.loader.get_table("interaction_logs")
        if interaction_logs is None:
            return pl.DataFrame()

        return interaction_logs.filter(pl.col("doc_id") == doc_id).sort("action_time")

    def get_delay_annotations(self) -> List[Dict[str, Any]]:
        annotations = []
        pipeline_status = self.pipeline.get_pipeline_status()
        for p in pipeline_status:
            if p.get("is_delayed"):
                last_sync = p.get("last_sync_time")
                source_name = p.get("source_name", "未知数据源")
                delay_hours = p.get("delay_hours", 0)
                if last_sync:
                    from datetime import date as date_type
                    sync_dt = datetime.fromisoformat(last_sync)
                    sync_date = sync_dt.date()
                    annotations.append({
                        "date": sync_date,
                        "label": f"{source_name}同步截止",
                        "detail": f"最后同步:{sync_dt.strftime('%m-%d %H:%M')} 延迟{int(delay_hours)}h",
                        "source_id": p.get("source_id", ""),
                        "source_name": source_name,
                        "delay_hours": delay_hours,
                        "last_sync_time": sync_dt,
                    })
        return annotations

    def get_sync_delay_info(self) -> List[Dict[str, Any]]:
        return self.pipeline.get_pipeline_status()

    def get_review_yoy_mom(self, current_start: datetime, current_end: datetime,
                           compare_type: str = "mom") -> Dict[str, YoYMoMResult]:
        metrics = ["total", "return_count", "return_rate", "publish_count", "publish_rate", "high_risk"]
        results = {}
        for m in metrics:
            results[m] = self.get_yoy_mom(m, current_start, current_end, compare_type=compare_type)
        return results

    def get_publish_schedule_comparison(self, days: int = 30) -> pl.DataFrame:
        calendar = self.loader.get_table("calendar_events")
        if calendar is None:
            return pl.DataFrame()

        publish_events = calendar.filter(pl.col("event_type") == "发布排期")
        publish_events = publish_events.with_columns(pl.col("event_date").dt.date().alias("date"))

        end_date = publish_events["event_date"].max()
        if end_date is None:
            return pl.DataFrame()

        start_date = end_date - timedelta(days=days)

        df = publish_events.filter(pl.col("event_date") >= start_date)

        daily = df.group_by("date").agg(
            pl.len().alias("scheduled_count"),
            pl.when(pl.col("status") == "已发布").then(1).otherwise(0).sum().alias("published_count"),
        ).sort("date")

        return daily

    def get_publish_yoy_mom(self, current_start: datetime, current_end: datetime,
                           compare_type: str = "mom") -> Dict[str, YoYMoMResult]:
        calendar = self.loader.get_table("calendar_events")
        if calendar is None:
            return {}

        publish_events = calendar.filter(pl.col("event_type") == "发布排期")

        period_days = (current_end - current_start).days
        if compare_type == "yoy":
            prev_start = current_start - timedelta(days=365)
            prev_end = current_end - timedelta(days=365)
        else:
            prev_start = current_start - timedelta(days=period_days)
            prev_end = current_start - timedelta(days=1)

        def _calc_metrics(df: pl.DataFrame) -> Dict[str, float]:
            scheduled = len(df)
            published = df.filter(pl.col("status") == "已发布").height
            result = {
                "scheduled_count": scheduled,
                "published_count": published,
                "publish_rate": (published / scheduled * 100) if scheduled > 0 else 0,
            }
            return result

        current_df = publish_events.filter(
            (pl.col("event_date") >= current_start) & (pl.col("event_date") <= current_end)
        )
        prev_df = publish_events.filter(
            (pl.col("event_date") >= prev_start) & (pl.col("event_date") <= prev_end)
        )

        current_metrics = _calc_metrics(current_df)
        prev_metrics = _calc_metrics(prev_df)

        result = {}
        for metric in ["scheduled_count", "published_count", "publish_rate"]:
            result[metric] = self._calc_change_result(
                "publish_count" if metric == "publish_rate" else metric,
                current_metrics.get(metric, 0),
                prev_metrics.get(metric, 0),
            )
        return result


risk_analyzer = RiskAnalyzer()
