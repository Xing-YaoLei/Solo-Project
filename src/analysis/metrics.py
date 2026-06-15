from typing import Optional, Tuple, Dict, List
from datetime import datetime, timedelta
import polars as pl
import numpy as np
from src.storage.duckdb_client import DuckDBClient

class MetricAnalyzer:
    def __init__(self, db_client: DuckDBClient):
        self.db = db_client

    def calculate_yoy_mom(self, df: pl.DataFrame, date_col: str, value_col: str, 
                          group_cols: Optional[List[str]] = None) -> pl.DataFrame:
        if group_cols is None:
            group_cols = []
        
        df = df.sort([*group_cols, date_col])
        
        window_spec = pl.col(value_col)
        
        result = df.with_columns([
            window_spec.shift(1).over(group_cols).alias(f"{value_col}_mom"),
            window_spec.shift(12).over(group_cols).alias(f"{value_col}_yoy")
        ]).with_columns([
            ((pl.col(value_col) - pl.col(f"{value_col}_mom")) / pl.col(f"{value_col}_mom") * 100)
                .alias(f"{value_col}_mom_pct"),
            ((pl.col(value_col) - pl.col(f"{value_col}_yoy")) / pl.col(f"{value_col}_yoy") * 100)
                .alias(f"{value_col}_yoy_pct")
        ])
        
        return result

    def calculate_period_comparison(self, df: pl.DataFrame, date_col: str, value_col: str,
                                    current_start: datetime, current_end: datetime,
                                    previous_start: datetime, previous_end: datetime,
                                    group_cols: Optional[List[str]] = None) -> Dict[str, any]:
        if group_cols is None:
            group_cols = []
        
        current_df = df.filter(
            (pl.col(date_col) >= current_start) & (pl.col(date_col) <= current_end)
        )
        previous_df = df.filter(
            (pl.col(date_col) >= previous_start) & (pl.col(date_col) <= previous_end)
        )
        
        if group_cols:
            current_agg = current_df.group_by(group_cols).agg(pl.sum(value_col).alias("current_value"))
            previous_agg = previous_df.group_by(group_cols).agg(pl.sum(value_col).alias("previous_value"))
            merged = current_agg.join(previous_agg, on=group_cols, how="full", coalesce=True)
        else:
            current_value = current_df[value_col].sum() if len(current_df) > 0 else 0
            previous_value = previous_df[value_col].sum() if len(previous_df) > 0 else 0
            merged = pl.DataFrame([{"current_value": current_value, "previous_value": previous_value}])
        
        merged = merged.with_columns([
            (pl.col("current_value") - pl.col("previous_value")).alias("absolute_change"),
            ((pl.col("current_value") - pl.col("previous_value")) / 
             pl.when(pl.col("previous_value") == 0).then(None).otherwise(pl.col("previous_value")) * 100)
                .alias("percentage_change")
        ])
        
        return {
            "current_period": {"start": current_start, "end": current_end},
            "previous_period": {"start": previous_start, "end": previous_end},
            "comparison": merged
        }

    def detect_level_gaps(self) -> pl.DataFrame:
        query = """
            WITH level_changes_ordered AS (
                SELECT 
                    change_id,
                    student_id,
                    student_name,
                    old_level,
                    new_level,
                    change_reason,
                    change_time,
                    region,
                    has_data_gap,
                    gap_days,
                    LAG(change_time) OVER (PARTITION BY student_id ORDER BY change_time) as prev_change_time
                FROM level_changes
            )
            SELECT 
                *,
                CASE 
                    WHEN prev_change_time IS NOT NULL 
                    THEN DATE_DIFF('day', prev_change_time, change_time)
                    ELSE NULL 
                END as days_since_last_change,
                CASE 
                    WHEN prev_change_time IS NOT NULL 
                    AND DATE_DIFF('day', prev_change_time, change_time) > 30
                    THEN TRUE 
                    ELSE FALSE 
                END as has_calculated_gap
            FROM level_changes_ordered
            ORDER BY student_id, change_time
        """
        df = self.db.query_to_polars(query)
        
        df = df.with_columns([
            pl.when(pl.col("has_data_gap").is_null())
              .then(pl.col("has_calculated_gap"))
              .otherwise(pl.col("has_data_gap"))
              .alias("has_data_gap"),
            pl.when(pl.col("gap_days").is_null())
              .then(pl.col("days_since_last_change"))
              .otherwise(pl.col("gap_days"))
              .alias("gap_days")
        ])
        
        return df

    def get_risk_summary(self) -> Dict[str, any]:
        queries = {
            "plagiarism_risk": """
                SELECT 
                    COUNT(*) as total_attempts,
                    SUM(CASE WHEN is_plagiarized THEN 1 ELSE 0 END) as plagiarized_count,
                    AVG(plagiarism_score) as avg_plagiarism_score,
                    region
                FROM question_bank_records
                WHERE attempt_time >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY region
            """,
            "dropout_risk": """
                SELECT 
                    COUNT(DISTINCT student_id) as total_students,
                    COUNT(DISTINCT CASE WHEN new_level < old_level THEN student_id END) as dropped_students,
                    region
                FROM level_changes
                WHERE change_time >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY region
            """,
            "refund_risk": """
                SELECT 
                    COUNT(*) as total_transactions,
                    SUM(CASE WHEN transaction_type = 'refund' THEN 1 ELSE 0 END) as refund_count,
                    SUM(CASE WHEN transaction_type = 'refund' THEN amount ELSE 0 END) as refund_amount,
                    region
                FROM account_transactions
                WHERE transaction_time >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY region
            """,
            "engagement_risk": """
                SELECT 
                    COUNT(DISTINCT student_id) as active_students,
                    AVG(watch_duration) as avg_watch_duration,
                    AVG(interaction_count) as avg_interactions,
                    region
                FROM live_platform_logs
                WHERE join_time >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY region
            """
        }
        
        results = {}
        for key, query in queries.items():
            try:
                results[key] = self.db.query_to_polars(query)
            except Exception as e:
                results[key] = pl.DataFrame()
        
        return results

    def get_pass_rate_trend(self, days: int = 90, region: Optional[str] = None) -> pl.DataFrame:
        conditions = [f"exam_date >= CURRENT_DATE - INTERVAL '{days} days'"]
        if region:
            conditions.append(f"region = '{region}'")
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        query = f"""
            SELECT 
                exam_date,
                region,
                exam_name,
                SUM(total_students) as total_students,
                SUM(passed_students) as passed_students,
                CASE WHEN SUM(total_students) > 0 
                     THEN CAST(SUM(passed_students) AS DOUBLE) / SUM(total_students) 
                     ELSE 0 END as pass_rate,
                AVG(average_score) as average_score
            FROM exam_pass_rates
            WHERE {where_clause}
            GROUP BY exam_date, region, exam_name
            ORDER BY exam_date, region
        """
        df = self.db.query_to_polars(query)
        return df

    def get_account_transactions_with_mom_yoy(self, days: int = 90) -> pl.DataFrame:
        query = f"""
            SELECT 
                DATE_TRUNC('month', transaction_time) as transaction_month,
                region,
                transaction_type,
                COUNT(*) as transaction_count,
                SUM(amount) as total_amount
            FROM account_transactions
            WHERE transaction_time >= CURRENT_DATE - INTERVAL '{days + 365} days'
            GROUP BY transaction_month, region, transaction_type
            ORDER BY transaction_month, region, transaction_type
        """
        df = self.db.query_to_polars(query)
        
        if len(df) > 0:
            df = self.calculate_yoy_mom(df, "transaction_month", "total_amount", ["region", "transaction_type"])
            df = self.calculate_yoy_mom(df, "transaction_month", "transaction_count", ["region", "transaction_type"])
        
        return df

    def get_level_changes_with_gaps(self) -> pl.DataFrame:
        df = self.detect_level_gaps()
        
        df = df.with_columns([
            (pl.col("new_level") - pl.col("old_level")).alias("level_change"),
            pl.when(pl.col("new_level") > pl.col("old_level")).then(1)
              .when(pl.col("new_level") < pl.col("old_level")).then(-1)
              .otherwise(0).alias("change_direction")
        ])
        
        return df
