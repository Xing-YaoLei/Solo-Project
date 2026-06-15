from typing import Optional, List, Dict, Tuple
from datetime import datetime, timedelta
import polars as pl
import numpy as np
from src.storage.duckdb_client import DuckDBClient

class AnomalyDetector:
    def __init__(self, db_client: DuckDBClient):
        self.db = db_client

    def z_score_detection(self, values: np.ndarray, threshold: float = 3.0) -> np.ndarray:
        if len(values) < 2:
            return np.array([False] * len(values))
        
        mean = np.mean(values)
        std = np.std(values)
        
        if std == 0:
            return np.array([False] * len(values))
        
        z_scores = np.abs((values - mean) / std)
        return z_scores > threshold

    def iqr_detection(self, values: np.ndarray, k: float = 1.5) -> np.ndarray:
        if len(values) < 4:
            return np.array([False] * len(values))
        
        q1 = np.percentile(values, 25)
        q3 = np.percentile(values, 75)
        iqr = q3 - q1
        
        lower_bound = q1 - k * iqr
        upper_bound = q3 + k * iqr
        
        return (values < lower_bound) | (values > upper_bound)

    def detect_plagiarism_anomalies(self, days: int = 30) -> pl.DataFrame:
        query = f"""
            SELECT 
                DATE_TRUNC('day', attempt_time) as attempt_date,
                region,
                COUNT(*) as total_attempts,
                SUM(CASE WHEN is_plagiarized THEN 1 ELSE 0 END) as plagiarized_count,
                AVG(plagiarism_score) as avg_plagiarism_score
            FROM question_bank_records
            WHERE attempt_time >= CURRENT_DATE - INTERVAL '{days} days'
            GROUP BY attempt_date, region
            ORDER BY attempt_date, region
        """
        df = self.db.query_to_polars(query)
        
        if len(df) == 0:
            return df
        
        for region in df["region"].unique().to_list():
            region_mask = df["region"] == region
            if region_mask.sum() > 5:
                rates = df.filter(region_mask)["avg_plagiarism_score"].to_numpy()
                anomalies = self.z_score_detection(rates, threshold=2.5)
                df = df.with_columns([
                    pl.when(region_mask).then(pl.Series(anomalies)).otherwise(False).alias("is_anomaly")
                ])
            else:
                df = df.with_columns([
                    pl.when(region_mask).then(False).otherwise(pl.col("is_anomaly")).alias("is_anomaly")
                ]) if "is_anomaly" in df.columns else df.with_columns([
                    pl.lit(False).alias("is_anomaly")
                ])
        
        return df

    def detect_level_drop_anomalies(self, days: int = 30) -> pl.DataFrame:
        query = f"""
            SELECT 
                DATE_TRUNC('day', change_time) as change_date,
                region,
                COUNT(*) as total_changes,
                SUM(CASE WHEN new_level < old_level THEN 1 ELSE 0 END) as drop_count,
                AVG(CASE WHEN new_level < old_level THEN old_level - new_level ELSE 0 END) as avg_drop_magnitude
            FROM level_changes
            WHERE change_time >= CURRENT_DATE - INTERVAL '{days} days'
            GROUP BY change_date, region
            ORDER BY change_date, region
        """
        df = self.db.query_to_polars(query)
        
        if len(df) == 0:
            return df
        
        df = df.with_columns([
            (pl.col("drop_count") / pl.col("total_changes")).alias("drop_rate")
        ])
        
        df = df.with_columns([
            pl.lit(False).alias("is_anomaly_zscore"),
            pl.lit(False).alias("is_anomaly_iqr")
        ])
        
        for region in df["region"].unique().to_list():
            region_mask = df["region"] == region
            if region_mask.sum() > 5:
                rates = df.filter(region_mask)["drop_rate"].to_numpy()
                z_anomalies = self.z_score_detection(rates, threshold=2.0)
                iqr_anomalies = self.iqr_detection(rates, k=1.5)
                
                df = df.with_columns([
                    pl.when(region_mask).then(pl.Series(z_anomalies)).otherwise(pl.col("is_anomaly_zscore")).alias("is_anomaly_zscore"),
                    pl.when(region_mask).then(pl.Series(iqr_anomalies)).otherwise(pl.col("is_anomaly_iqr")).alias("is_anomaly_iqr")
                ])
        
        df = df.with_columns([
            (pl.col("is_anomaly_zscore") | pl.col("is_anomaly_iqr")).alias("is_anomaly")
        ])
        
        return df

    def detect_refund_anomalies(self, days: int = 30) -> pl.DataFrame:
        query = f"""
            SELECT 
                DATE_TRUNC('day', transaction_time) as transaction_date,
                region,
                COUNT(*) as total_transactions,
                SUM(CASE WHEN transaction_type = 'refund' THEN 1 ELSE 0 END) as refund_count,
                SUM(CASE WHEN transaction_type = 'refund' THEN amount ELSE 0 END) as refund_amount,
                SUM(amount) as total_amount
            FROM account_transactions
            WHERE transaction_time >= CURRENT_DATE - INTERVAL '{days} days'
            GROUP BY transaction_date, region
            ORDER BY transaction_date, region
        """
        df = self.db.query_to_polars(query)
        
        if len(df) == 0:
            return df
        
        df = df.with_columns([
            pl.when(pl.col("total_transactions") > 0)
              .then(pl.col("refund_count") / pl.col("total_transactions"))
              .otherwise(0).alias("refund_rate")
        ])
        
        df = df.with_columns([pl.lit(False).alias("is_anomaly")])
        
        for region in df["region"].unique().to_list():
            region_mask = df["region"] == region
            if region_mask.sum() > 5:
                rates = df.filter(region_mask)["refund_rate"].to_numpy()
                anomalies = self.z_score_detection(rates, threshold=2.5)
                df = df.with_columns([
                    pl.when(region_mask).then(pl.Series(anomalies)).otherwise(pl.col("is_anomaly")).alias("is_anomaly")
                ])
        
        return df

    def get_data_gap_colored_level_changes(self, days: int = 90) -> pl.DataFrame:
        query = f"""
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
                created_at
            FROM level_changes
            WHERE change_time >= CURRENT_DATE - INTERVAL '{days} days'
            ORDER BY student_id, change_time
        """
        df = self.db.query_to_polars(query)
        
        if len(df) == 0:
            return df
        
        df = df.with_columns([
            pl.when(pl.col("has_data_gap") == True).then("#FF6B6B")
              .when(pl.col("new_level") < pl.col("old_level")).then("#FFA07A")
              .when(pl.col("new_level") > pl.col("old_level")).then("#98D8C8")
              .otherwise("#E8E8E8").alias("row_color"),
            pl.when(pl.col("has_data_gap") == True).then("data_gap")
              .when(pl.col("new_level") < pl.col("old_level")).then("level_drop")
              .when(pl.col("new_level") > pl.col("old_level")).then("level_up")
              .otherwise("no_change").alias("change_type"),
            pl.when(pl.col("has_data_gap") == True).then(True).otherwise(False).alias("highlight")
        ])
        
        return df

    def get_overall_risk_score(self, days: int = 30) -> Dict[str, float]:
        risk_factors = {}
        
        plagiarism_query = f"""
            SELECT 
                SUM(CASE WHEN is_plagiarized THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as plagiarism_rate
            FROM question_bank_records
            WHERE attempt_time >= CURRENT_DATE - INTERVAL '{days} days'
        """
        try:
            plag_df = self.db.query_to_polars(plagiarism_query)
            risk_factors["plagiarism"] = float(plag_df["plagiarism_rate"][0]) if len(plag_df) > 0 else 0.0
        except:
            risk_factors["plagiarism"] = 0.0
        
        refund_query = f"""
            SELECT 
                SUM(CASE WHEN transaction_type = 'refund' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as refund_rate
            FROM account_transactions
            WHERE transaction_time >= CURRENT_DATE - INTERVAL '{days} days'
        """
        try:
            refund_df = self.db.query_to_polars(refund_query)
            risk_factors["refund"] = float(refund_df["refund_rate"][0]) if len(refund_df) > 0 else 0.0
        except:
            risk_factors["refund"] = 0.0
        
        dropout_query = f"""
            SELECT 
                COUNT(DISTINCT CASE WHEN new_level < old_level THEN student_id END) * 100.0 / 
                NULLIF(COUNT(DISTINCT student_id), 0) as dropout_rate
            FROM level_changes
            WHERE change_time >= CURRENT_DATE - INTERVAL '{days} days'
        """
        try:
            dropout_df = self.db.query_to_polars(dropout_query)
            risk_factors["dropout"] = float(dropout_df["dropout_rate"][0]) if len(dropout_df) > 0 else 0.0
        except:
            risk_factors["dropout"] = 0.0
        
        gap_query = f"""
            SELECT 
                SUM(CASE WHEN has_data_gap THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as gap_rate
            FROM level_changes
            WHERE change_time >= CURRENT_DATE - INTERVAL '{days} days'
        """
        try:
            gap_df = self.db.query_to_polars(gap_query)
            risk_factors["data_gap"] = float(gap_df["gap_rate"][0]) if len(gap_df) > 0 else 0.0
        except:
            risk_factors["data_gap"] = 0.0
        
        weights = {"plagiarism": 0.3, "refund": 0.3, "dropout": 0.25, "data_gap": 0.15}
        overall_score = sum(risk_factors[k] * weights[k] for k in weights)
        
        risk_factors["overall_score"] = overall_score
        
        return risk_factors
