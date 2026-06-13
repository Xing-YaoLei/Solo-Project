"""
风险预警引擎：阈值配置、耗材异常检测、消课率计算、点评延迟标注
"""
import uuid
import logging
from dataclasses import dataclass, asdict, field
from datetime import datetime, date, timedelta
from typing import Optional, Dict, List, Tuple, Any

import polars as pl
import numpy as np

from src.config import config
from src.data import duckdb_manager

logger = logging.getLogger(__name__)


@dataclass
class ThresholdConfig:
    """预警阈值配置 - 业务人员可自行调整"""
    low_course_consumption_rate: float = config.thresholds.low_course_consumption_rate
    high_material_usage_ratio: float = config.thresholds.high_material_usage_ratio
    negative_review_ratio: float = config.thresholds.negative_review_ratio
    overdue_visit_days: int = config.thresholds.overdue_visit_days
    review_delay_hours: int = config.thresholds.review_delay_hours
    high_refund_ratio: float = 0.05
    low_tech_rating: float = 3.5

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class AlertRecord:
    """预警记录"""
    alert_id: str
    alert_type: str
    alert_level: str
    store_id: Optional[str]
    customer_id: Optional[str]
    order_id: Optional[str]
    related_data: Optional[str]
    triggered_value: float
    threshold_value: float
    alert_message: str

    @classmethod
    def create(cls, alert_type: str, alert_level: str,
               triggered_value: float, threshold_value: float,
               alert_message: str, **kwargs) -> "AlertRecord":
        return cls(
            alert_id=str(uuid.uuid4()),
            alert_type=alert_type,
            alert_level=alert_level,
            triggered_value=triggered_value,
            threshold_value=threshold_value,
            alert_message=alert_message,
            store_id=kwargs.get("store_id"),
            customer_id=kwargs.get("customer_id"),
            order_id=kwargs.get("order_id"),
            related_data=kwargs.get("related_data"),
        )

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class RiskEngine:
    """风险预警引擎"""

    ALERT_LEVEL_LOW = "LOW"
    ALERT_LEVEL_MEDIUM = "MEDIUM"
    ALERT_LEVEL_HIGH = "HIGH"

    def __init__(self, threshold_config: Optional[ThresholdConfig] = None):
        self.thresholds = threshold_config or ThresholdConfig()
        self.alerts: List[AlertRecord] = []

    def _generate_id(self) -> str:
        return str(uuid.uuid4())

    def mark_review_delays(self, reviews_df: Optional[pl.DataFrame] = None) -> pl.DataFrame:
        """标注点评延迟：服务日期到点评提交时间超过阈值的标记为延迟

        Args:
            reviews_df: 点评记录DataFrame，不传则从数据库读取

        Returns:
            标记了延迟的点评DataFrame
        """
        if reviews_df is None:
            reviews_df = duckdb_manager.query("SELECT * FROM reviews")

        if reviews_df.height == 0:
            return reviews_df

        required_cols = {"service_date", "review_submit_date", "sync_date"}
        if not required_cols.issubset(set(reviews_df.columns)):
            logger.warning("点评数据缺少延迟标注所需字段")
            return reviews_df

        threshold_hours = self.thresholds.review_delay_hours

        df = reviews_df.with_columns([
            (
                (pl.col("review_submit_date") - pl.col("service_date"))
                .dt.total_seconds() / 3600
            ).alias("_hours_diff"),
        ])

        df = df.with_columns([
            pl.col("_hours_diff").alias("delay_hours"),
            (pl.col("_hours_diff") > threshold_hours).alias("is_delayed"),
        ]).drop("_hours_diff")

        df = df.with_columns([
            pl.col("delay_hours").fill_null(0.0),
            pl.col("is_delayed").fill_null(False),
        ])

        delayed_count = df.filter(pl.col("is_delayed")).height
        if delayed_count > 0:
            logger.info("检测到 %d 条延迟点评 (阈值: %d小时)", delayed_count, threshold_hours)

        self._persist_review_delays(df)
        return df

    def _persist_review_delays(self, df: pl.DataFrame) -> None:
        """将延迟标注结果持久化到数据库"""
        if df.height == 0:
            return
        try:
            update_cols = [c for c in ["review_id", "is_delayed", "delay_hours"] if c in df.columns]
            if len(update_cols) < 3:
                return
            update_df = df.select(update_cols)
            for row in update_df.iter_rows(named=True):
                rid = row["review_id"]
                delayed = row["is_delayed"]
                delay_h = row["delay_hours"]
                duckdb_manager.execute(
                    """
                    UPDATE reviews SET is_delayed = ?, delay_hours = ?
                    WHERE review_id = ?
                    """,
                    [bool(delayed), float(delay_h) if delay_h is not None else 0.0, rid]
                )
        except Exception as e:
            logger.warning("持久化点评延迟标注失败: %s", e)

    def calculate_course_consumption_rate(
        self,
        course_items_df: Optional[pl.DataFrame] = None,
        customer_id: Optional[str] = None,
        store_id: Optional[str] = None,
        period_start: Optional[date] = None,
        period_end: Optional[date] = None,
    ) -> pl.DataFrame:
        """计算消课率

        消课率 = 已使用次数 / 总购买次数（考虑有效期内的卡项）

        Returns:
            包含 customer_id, store_id, total_sessions, used_sessions,
            consumption_rate 的 DataFrame
        """
        if course_items_df is None:
            sql = "SELECT * FROM course_items"
            conditions = []
            params = []
            if customer_id:
                conditions.append("customer_id = ?")
                params.append(customer_id)
            if store_id:
                conditions.append("store_id = ?")
                params.append(store_id)
            if period_start:
                conditions.append("purchase_date >= ?")
                params.append(period_start)
            if period_end:
                conditions.append("purchase_date <= ?")
                params.append(period_end)
            if conditions:
                sql += " WHERE " + " AND ".join(conditions)
            course_items_df = duckdb_manager.query(sql, params)

        if course_items_df.height == 0:
            return pl.DataFrame(schema={
                "customer_id": pl.Utf8, "store_id": pl.Utf8,
                "total_sessions": pl.Int64, "used_sessions": pl.Int64,
                "remaining_sessions": pl.Int64, "consumption_rate": pl.Float64,
            })

        today = datetime.now().date()
        df = course_items_df.with_columns([
            pl.col("expiry_date").fill_null(
                pl.lit(today + timedelta(days=365)).cast(pl.Date)
            ).alias("_valid_expiry"),
        ])

        df = df.filter(pl.col("_valid_expiry") >= today)

        if "used_sessions" not in df.columns:
            df = df.with_columns(used_sessions=pl.lit(0))
        if "remaining_sessions" not in df.columns:
            df = df.with_columns(
                remaining_sessions=(pl.col("total_sessions") - pl.col("used_sessions"))
            )

        grouped = df.group_by(["customer_id", "store_id"]).agg([
            pl.col("total_sessions").sum().alias("total_sessions"),
            pl.col("used_sessions").sum().alias("used_sessions"),
            pl.col("remaining_sessions").sum().alias("remaining_sessions"),
        ])

        grouped = grouped.with_columns([
            pl.when(pl.col("total_sessions") > 0)
            .then(pl.col("used_sessions") / pl.col("total_sessions"))
            .otherwise(0.0)
            .round(4)
            .alias("consumption_rate"),
        ])

        return grouped.sort("consumption_rate")

    def detect_material_abnormalities(
        self,
        material_usage_df: Optional[pl.DataFrame] = None,
        threshold_ratio: Optional[float] = None,
    ) -> Tuple[pl.DataFrame, List[AlertRecord]]:
        """耗材异常检测：实际用量/标准用量超过阈值的标记为异常

        Args:
            material_usage_df: 耗材使用记录DataFrame
            threshold_ratio: 异常阈值倍数，默认使用配置值

        Returns:
            (标记了异常的耗材使用记录DataFrame, 预警记录列表)
        """
        if material_usage_df is None:
            material_usage_df = duckdb_manager.query("SELECT * FROM material_usage")

        if material_usage_df.height == 0:
            return material_usage_df, []

        ratio_threshold = threshold_ratio or self.thresholds.high_material_usage_ratio
        alerts: List[AlertRecord] = []

        df = material_usage_df.with_columns([
            pl.when((pl.col("standard_usage_quantity").is_not_null()) &
                    (pl.col("standard_usage_quantity") > 0))
            .then(pl.col("usage_quantity") / pl.col("standard_usage_quantity"))
            .otherwise(1.0)
            .alias("usage_ratio"),
        ])

        df = df.with_columns([
            (pl.col("usage_ratio") > ratio_threshold).alias("is_abnormal"),
            pl.when(pl.col("usage_ratio") > ratio_threshold)
            .then(pl.concat_str([
                pl.lit("用量超出标准"),
                pl.col("usage_ratio").round(2).cast(pl.Utf8),
                pl.lit("倍"),
            ]))
            .otherwise(None)
            .alias("anomaly_reason"),
        ])

        abnormal_df = df.filter(pl.col("is_abnormal"))
        for row in abnormal_df.iter_rows(named=True):
            alert_level = self.ALERT_LEVEL_HIGH if row["usage_ratio"] >= ratio_threshold * 2 else self.ALERT_LEVEL_MEDIUM
            alerts.append(AlertRecord.create(
                alert_type="MATERIAL_ABNORMAL",
                alert_level=alert_level,
                triggered_value=float(row["usage_ratio"]),
                threshold_value=ratio_threshold,
                alert_message=(
                    f"耗材异常: {row.get('material_name', '未知')} "
                    f"用量{row.get('usage_quantity', 0)}{row.get('unit', '')} "
                    f"超出标准{row['usage_ratio']:.1f}倍"
                ),
                store_id=row.get("store_id"),
                order_id=row.get("order_id"),
                related_data=f"material_code={row.get('material_code')},"
                           f"technician={row.get('technician_name')}",
            ))

        self.alerts.extend(alerts)
        self._persist_material_abnormalities(df, alerts)
        return df, alerts

    def _persist_material_abnormalities(self, df: pl.DataFrame, alerts: List[AlertRecord]) -> None:
        """持久化耗材异常检测结果：回写 usage_ratio、is_abnormal、anomaly_reason 到 material_usage 表"""
        try:
            update_cols = [c for c in [
                "usage_id", "usage_ratio", "is_abnormal", "anomaly_reason"
            ] if c in df.columns]

            if len(update_cols) >= 2 and "usage_id" in update_cols:
                try:
                    update_df = df.select(update_cols)
                    duckdb_manager.insert_dataframe(
                        "material_usage", update_df, if_exists="upsert"
                    )
                except Exception as e:
                    logger.warning("批量 upsert 耗材异常失败，降级为逐条更新: %s", e)
                    for row in df.select(update_cols).iter_rows(named=True):
                        duckdb_manager.execute(
                            """
                            UPDATE material_usage
                               SET usage_ratio = ?,
                                   is_abnormal = ?,
                                   anomaly_reason = ?
                             WHERE usage_id = ?
                            """,
                            [row.get("usage_ratio"),
                             bool(row.get("is_abnormal", False)),
                             row.get("anomaly_reason"),
                             row.get("usage_id")]
                        )

            for alert in alerts:
                existing = duckdb_manager.query(
                    "SELECT COUNT(*) as cnt FROM risk_alerts WHERE alert_id = ?",
                    [alert.alert_id]
                )
                if existing["cnt"][0] == 0:
                    alert_df = pl.DataFrame([alert.to_dict()])
                    duckdb_manager.insert_dataframe("risk_alerts", alert_df)
        except Exception as e:
            logger.warning("持久化耗材异常检测结果失败: %s", e)

    def detect_course_consumption_risks(
        self,
        consumption_df: Optional[pl.DataFrame] = None,
        threshold_rate: Optional[float] = None,
    ) -> List[AlertRecord]:
        """消课率风险检测：低于阈值的客户标记为风险

        Args:
            consumption_df: 消课率计算结果DataFrame
            threshold_rate: 消课率阈值

        Returns:
            预警记录列表
        """
        if consumption_df is None:
            consumption_df = self.calculate_course_consumption_rate()

        if consumption_df.height == 0:
            return []

        rate_threshold = threshold_rate or self.thresholds.low_course_consumption_rate
        alerts: List[AlertRecord] = []

        low_consumption_df = consumption_df.filter(
            pl.col("consumption_rate") < rate_threshold
        )

        for row in low_consumption_df.iter_rows(named=True):
            rate = float(row["consumption_rate"])
            level = self.ALERT_LEVEL_HIGH if rate < rate_threshold * 0.5 else self.ALERT_LEVEL_MEDIUM
            alerts.append(AlertRecord.create(
                alert_type="LOW_CONSUMPTION_RATE",
                alert_level=level,
                triggered_value=rate,
                threshold_value=rate_threshold,
                alert_message=(
                    f"消课率仅 {rate*100:.1f}%，低于阈值 {rate_threshold*100:.0f}%。"
                    f"已用{row['used_sessions']}/{row['total_sessions']}次"
                ),
                store_id=row.get("store_id"),
                customer_id=row.get("customer_id"),
            ))

        self.alerts.extend(alerts)
        self._persist_alerts(alerts)
        return alerts

    def detect_overdue_visits(
        self,
        transactions_df: Optional[pl.DataFrame] = None,
        overdue_days: Optional[int] = None,
        ref_date: Optional[date] = None,
    ) -> Tuple[pl.DataFrame, List[AlertRecord]]:
        """逾期回访检测：超过指定天数未到店的客户

        Returns:
            (客户逾期信息DataFrame, 预警记录列表)
        """
        ref = ref_date or datetime.now().date()
        days = overdue_days or self.thresholds.overdue_visit_days

        if transactions_df is None:
            transactions_df = duckdb_manager.query("""
                SELECT customer_id, store_id, MAX(transaction_date) as last_visit_date
                FROM cashier_transactions
                WHERE transaction_type IN ('CONSUMPTION', 'PRODUCT')
                GROUP BY customer_id, store_id
            """)

        if transactions_df.height == 0:
            schema = {
                "customer_id": pl.Utf8, "store_id": pl.Utf8,
                "last_visit_date": pl.Date, "days_since_visit": pl.Int64,
                "is_overdue": pl.Boolean,
            }
            return pl.DataFrame(schema=schema), []

        if "last_visit_date" not in transactions_df.columns:
            if "transaction_date" in transactions_df.columns:
                transactions_df = transactions_df.with_columns(
                    pl.col("transaction_date").alias("last_visit_date")
                )
            else:
                return transactions_df, []

        df = transactions_df.with_columns([
            (pl.col("last_visit_date").cast(pl.Date)).alias("last_visit_date"),
        ]).with_columns([
            ((ref - pl.col("last_visit_date")).dt.total_days()).alias("days_since_visit"),
        ]).with_columns([
            (pl.col("days_since_visit") > days).alias("is_overdue"),
        ])

        alerts: List[AlertRecord] = []
        overdue_df = df.filter(pl.col("is_overdue"))
        for row in overdue_df.iter_rows(named=True):
            days_away = int(row["days_since_visit"])
            level = self.ALERT_LEVEL_HIGH if days_away > days * 2 else self.ALERT_LEVEL_MEDIUM
            alerts.append(AlertRecord.create(
                alert_type="OVERDUE_VISIT",
                alert_level=level,
                triggered_value=float(days_away),
                threshold_value=float(days),
                alert_message=f"客户已{days_away}天未到店，超过{days}天回访阈值，请主动联系回访",
                store_id=row.get("store_id"),
                customer_id=row.get("customer_id"),
            ))

        self.alerts.extend(alerts)
        self._persist_alerts(alerts)
        return df, alerts

    def detect_negative_review_risks(
        self,
        reviews_df: Optional[pl.DataFrame] = None,
        negative_ratio_threshold: Optional[float] = None,
    ) -> Tuple[Dict[str, Any], List[AlertRecord]]:
        """差评风险检测

        Returns:
            (差评统计信息, 预警记录列表)
        """
        if reviews_df is None:
            reviews_df = duckdb_manager.query("SELECT * FROM reviews")

        if reviews_df.height == 0:
            return {"total": 0, "negative": 0, "ratio": 0.0}, []

        ratio_threshold = negative_ratio_threshold or self.thresholds.negative_review_ratio
        alerts: List[AlertRecord] = []

        df = reviews_df.with_columns([
            pl.col("rating").cast(pl.Int32).alias("rating"),
            (pl.col("rating") <= 3).alias("is_negative"),
        ])

        stats = {
            "total": df.height,
            "negative": df.filter(pl.col("is_negative")).height,
            "ratio": round(df.filter(pl.col("is_negative")).height / df.height, 4) if df.height > 0 else 0.0,
        }
        stats["negative_df"] = df.filter(pl.col("is_negative"))

        if stats["ratio"] >= ratio_threshold:
            level = self.ALERT_LEVEL_HIGH if stats["ratio"] >= ratio_threshold * 2 else self.ALERT_LEVEL_MEDIUM
            alerts.append(AlertRecord.create(
                alert_type="NEGATIVE_REVIEW_RATIO",
                alert_level=level,
                triggered_value=stats["ratio"],
                threshold_value=ratio_threshold,
                alert_message=(
                    f"差评率 {stats['ratio']*100:.1f}%，超过阈值 {ratio_threshold*100:.0f}%。"
                    f"共{stats['negative']}/{stats['total']}条差评"
                ),
            ))

        for row in stats["negative_df"].iter_rows(named=True):
            rating = int(row["rating"])
            if rating <= 2:
                alerts.append(AlertRecord.create(
                    alert_type="HIGH_NEGATIVE_REVIEW",
                    alert_level=self.ALERT_LEVEL_HIGH,
                    triggered_value=float(rating),
                    threshold_value=3.0,
                    alert_message=(
                        f"收到{rating}星差评：{row.get('review_content', '')[:50]}..."
                    ),
                    store_id=row.get("store_id"),
                    customer_id=row.get("customer_id"),
                    order_id=row.get("order_id"),
                ))

        self.alerts.extend(alerts)
        self._persist_alerts(alerts)
        return stats, alerts

    def _persist_alerts(self, alerts: List[AlertRecord]) -> None:
        """持久化预警记录"""
        if not alerts:
            return
        try:
            for alert in alerts:
                existing = duckdb_manager.query(
                    "SELECT COUNT(*) as cnt FROM risk_alerts WHERE alert_id = ?",
                    [alert.alert_id]
                )
                if existing["cnt"][0] == 0:
                    alert_df = pl.DataFrame([alert.to_dict()])
                    duckdb_manager.insert_dataframe("risk_alerts", alert_df)
        except Exception as e:
            logger.warning("持久化预警记录失败: %s", e)

    def run_full_risk_scan(self) -> Dict[str, Any]:
        """执行完整的风险扫描，返回所有检测结果"""
        results: Dict[str, Any] = {
            "scan_time": datetime.now(),
            "alerts": [],
            "reviews_with_delay": None,
            "consumption_rates": None,
            "materials_with_abnormal": None,
            "overdue_visits": None,
            "review_stats": None,
        }

        results["reviews_with_delay"] = self.mark_review_delays()
        results["consumption_rates"] = self.calculate_course_consumption_rate()
        results["materials_with_abnormal"], mat_alerts = self.detect_material_abnormalities()
        results["alerts"].extend(mat_alerts)

        cons_alerts = self.detect_course_consumption_risks(results["consumption_rates"])
        results["alerts"].extend(cons_alerts)

        results["overdue_visits"], overdue_alerts = self.detect_overdue_visits()
        results["alerts"].extend(overdue_alerts)

        results["review_stats"], review_alerts = self.detect_negative_review_risks()
        results["alerts"].extend(review_alerts)

        logger.info("完整风险扫描完成，共产生 %d 条预警", len(results["alerts"]))
        return results

    def get_pending_alerts(self, store_id: Optional[str] = None) -> pl.DataFrame:
        """获取未处理的预警列表"""
        sql = """
            SELECT * FROM risk_alerts WHERE is_resolved = FALSE
        """
        params = []
        if store_id:
            sql += " AND store_id = ?"
            params.append(store_id)
        sql += " ORDER BY CASE alert_level "
        sql += " WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END, trigger_date DESC"
        return duckdb_manager.query(sql, params)

    def resolve_alert(self, alert_id: str) -> bool:
        """标记预警为已处理"""
        try:
            duckdb_manager.execute(
                """
                UPDATE risk_alerts SET is_resolved = TRUE, resolved_date = CURRENT_TIMESTAMP
                WHERE alert_id = ?
                """,
                [alert_id]
            )
            return True
        except Exception as e:
            logger.error("处理预警失败 %s: %s", alert_id, e)
            return False
