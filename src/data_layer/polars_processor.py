from typing import Optional, List, Dict, Any, Tuple
from datetime import date, datetime, timedelta
import polars as pl
import numpy as np


class PolarsProcessor:
    @staticmethod
    def filter_by_date_range(
        df: pl.DataFrame,
        date_col: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> pl.DataFrame:
        if start_date:
            df = df.filter(pl.col(date_col) >= start_date)
        if end_date:
            df = df.filter(pl.col(date_col) <= end_date)
        return df

    @staticmethod
    def aggregate_by_period(
        df: pl.DataFrame,
        date_col: str,
        value_cols: List[str],
        period: str = "day",
        agg_func: str = "sum",
    ) -> pl.DataFrame:
        period_map = {
            "day": "1d",
            "week": "1w",
            "month": "1mo",
            "quarter": "3mo",
            "year": "1y",
        }

        if agg_func == "sum":
            agg_exprs = [pl.sum(col).alias(col) for col in value_cols]
        elif agg_func == "mean":
            agg_exprs = [pl.mean(col).alias(col) for col in value_cols]
        elif agg_func == "count":
            agg_exprs = [pl.count(col).alias(col) for col in value_cols]
        elif agg_func == "max":
            agg_exprs = [pl.max(col).alias(col) for col in value_cols]
        elif agg_func == "min":
            agg_exprs = [pl.min(col).alias(col) for col in value_cols]
        else:
            raise ValueError(f"Unsupported aggregation function: {agg_func}")

        return (
            df.sort(date_col)
            .group_by_dynamic(date_col, every=period_map[period])
            .agg(agg_exprs)
        )

    @staticmethod
    def calculate_growth_rate(
        df: pl.DataFrame,
        value_col: str,
        date_col: str,
        period: int = 1,
    ) -> pl.DataFrame:
        df_sorted = df.sort(date_col)
        return df_sorted.with_columns(
            (
                (pl.col(value_col) - pl.col(value_col).shift(period))
                / pl.col(value_col).shift(period)
                * 100
            ).alias(f"{value_col}_growth_rate")
        )

    @staticmethod
    def calculate_moving_average(
        df: pl.DataFrame,
        value_col: str,
        date_col: str,
        window: int = 7,
    ) -> pl.DataFrame:
        df_sorted = df.sort(date_col)
        return df_sorted.with_columns(
            pl.col(value_col).rolling_mean(window).alias(f"{value_col}_ma{window}")
        )

    @staticmethod
    def pivot_by_category(
        df: pl.DataFrame,
        index_col: str,
        category_col: str,
        value_col: str,
        agg_func: str = "sum",
    ) -> pl.DataFrame:
        if agg_func == "sum":
            return df.pivot(
                index=index_col,
                columns=category_col,
                values=value_col,
                aggregate_function="sum",
            ).fill_null(0)
        elif agg_func == "count":
            return df.pivot(
                index=index_col,
                columns=category_col,
                values=value_col,
                aggregate_function="count",
            ).fill_null(0)
        else:
            raise ValueError(f"Unsupported pivot aggregation function: {agg_func}")

    @staticmethod
    def calculate_conversion_rate(
        df: pl.DataFrame,
        numerator_col: str,
        denominator_col: str,
        result_col: str = "conversion_rate",
    ) -> pl.DataFrame:
        return df.with_columns(
            (pl.col(numerator_col) / pl.col(denominator_col) * 100).alias(result_col)
        )

    @staticmethod
    def detect_outliers(
        df: pl.DataFrame,
        value_col: str,
        threshold: float = 3.0,
    ) -> pl.DataFrame:
        mean = df[value_col].mean()
        std = df[value_col].std()
        if std is None or std == 0:
            return df.with_columns(pl.lit(False).alias("is_outlier"))

        return df.with_columns(
            ((pl.col(value_col) - mean).abs() > threshold * std).alias("is_outlier")
        )

    @staticmethod
    def merge_with_lag(
        df: pl.DataFrame,
        date_col: str,
        value_cols: List[str],
        lag_days: int = 365,
    ) -> pl.DataFrame:
        df_lag = df.select([date_col] + value_cols).clone()
        df_lag = df_lag.with_columns((pl.col(date_col) + timedelta(days=lag_days)).alias(date_col))
        lag_cols = {col: f"{col}_lag_{lag_days}" for col in value_cols}
        df_lag = df_lag.rename(lag_cols)

        return df.join(df_lag, on=date_col, how="left")

    @staticmethod
    def generate_summary_stats(
        df: pl.DataFrame,
        value_cols: List[str],
        group_cols: Optional[List[str]] = None,
    ) -> pl.DataFrame:
        if group_cols:
            return df.group_by(group_cols).agg(
                [
                    *[pl.count(col).alias(f"{col}_count") for col in value_cols],
                    *[pl.sum(col).alias(f"{col}_sum") for col in value_cols],
                    *[pl.mean(col).alias(f"{col}_mean") for col in value_cols],
                    *[pl.median(col).alias(f"{col}_median") for col in value_cols],
                    *[pl.std(col).alias(f"{col}_std") for col in value_cols],
                    *[pl.min(col).alias(f"{col}_min") for col in value_cols],
                    *[pl.max(col).alias(f"{col}_max") for col in value_cols],
                ]
            )
        else:
            stats = []
            for col in value_cols:
                col_stats = {
                    "column": col,
                    "count": df[col].count(),
                    "sum": df[col].sum(),
                    "mean": df[col].mean(),
                    "median": df[col].median(),
                    "std": df[col].std(),
                    "min": df[col].min(),
                    "max": df[col].max(),
                }
                stats.append(col_stats)
            return pl.DataFrame(stats)

    @staticmethod
    def cohort_analysis(
        df: pl.DataFrame,
        user_id_col: str,
        order_date_col: str,
        value_col: Optional[str] = None,
    ) -> pl.DataFrame:
        cohort_df = df.with_columns(
            pl.col(order_date_col).dt.truncate("1mo").alias("order_month"),
            pl.col(order_date_col)
            .over(user_id_col)
            .min()
            .dt.truncate("1mo")
            .alias("cohort_month"),
        )

        cohort_df = cohort_df.with_columns(
            (
                (pl.col("order_month").dt.year() - pl.col("cohort_month").dt.year()) * 12
                + (pl.col("order_month").dt.month() - pl.col("cohort_month").dt.month())
            ).alias("cohort_period")
        )

        if value_col:
            return cohort_df.group_by(["cohort_month", "cohort_period"]).agg(
                pl.n_unique(user_id_col).alias("user_count"),
                pl.sum(value_col).alias("total_value"),
            )
        else:
            return cohort_df.group_by(["cohort_month", "cohort_period"]).agg(
                pl.n_unique(user_id_col).alias("user_count")
            )

    @staticmethod
    def safe_divide(
        df: pl.DataFrame,
        numerator_col: str,
        denominator_col: str,
        result_col: str,
        default_value: float = 0.0,
    ) -> pl.DataFrame:
        return df.with_columns(
            pl.when(pl.col(denominator_col) != 0)
            .then(pl.col(numerator_col) / pl.col(denominator_col))
            .otherwise(default_value)
            .alias(result_col)
        )
