import polars as pl
from datetime import datetime, date
from typing import Optional, List, Dict, Any, Union


def load_dataframe_from_store(
    minio_client,
    object_name: str,
    file_format: str = "parquet",
) -> Optional[pl.DataFrame]:
    return minio_client.get_dataframe(object_name, file_format)


def save_dataframe_to_store(
    minio_client,
    object_name: str,
    df: pl.DataFrame,
    file_format: str = "parquet",
) -> bool:
    return minio_client.put_dataframe(object_name, df, file_format)


def filter_by_date_range(
    df: pl.DataFrame,
    date_col: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> pl.DataFrame:
    if df.is_empty():
        return df

    exprs = []
    if start_date:
        exprs.append(pl.col(date_col) >= pl.lit(start_date))
    if end_date:
        exprs.append(pl.col(date_col) <= pl.lit(end_date))

    if exprs:
        return df.filter(pl.all_horizontal(exprs))
    return df


def calculate_trend(
    df: pl.DataFrame,
    date_col: str,
    value_col: str,
    freq: str = "month",
    agg: str = "count",
) -> pl.DataFrame:
    if df.is_empty():
        return pl.DataFrame(schema={date_col: pl.Date, value_col: pl.Float64})

    freq_map = {
        "day": "1d",
        "week": "1w",
        "month": "1mo",
        "quarter": "3mo",
        "year": "1y",
    }

    if agg == "count":
        return (
            df.group_by_dynamic(date_col, every=freq_map.get(freq, "1mo"))
            .agg(pl.count(value_col).alias(value_col))
            .sort(date_col)
        )
    elif agg == "sum":
        return (
            df.group_by_dynamic(date_col, every=freq_map.get(freq, "1mo"))
            .agg(pl.sum(value_col).alias(value_col))
            .sort(date_col)
        )
    elif agg == "mean":
        return (
            df.group_by_dynamic(date_col, every=freq_map.get(freq, "1mo"))
            .agg(pl.mean(value_col).alias(value_col))
            .sort(date_col)
        )
    else:
        return (
            df.group_by_dynamic(date_col, every=freq_map.get(freq, "1mo"))
            .agg(pl.count(value_col).alias(value_col))
            .sort(date_col)
        )


def compare_dataframes(
    df1: pl.DataFrame,
    df2: pl.DataFrame,
    key_cols: List[str],
    label1: str = "left",
    label2: str = "right",
) -> pl.DataFrame:
    if df1.is_empty() and df2.is_empty():
        return pl.DataFrame()

    joined = df1.join(df2, on=key_cols, how="full", suffix=f"_{label2}")
    value_cols = [c for c in df1.columns if c not in key_cols]

    diff_exprs = []
    for col in value_cols:
        col2 = f"{col}_{label2}"
        if col2 in joined.columns:
            diff_exprs.append(
                pl.when(pl.col(col).is_null() & pl.col(col2).is_not_null())
                .then(pl.lit(f"仅在{label2}存在"))
                .when(pl.col(col).is_not_null() & pl.col(col2).is_null())
                .then(pl.lit(f"仅在{label1}存在"))
                .when(pl.col(col).cast(pl.Utf8) != pl.col(col2).cast(pl.Utf8))
                .then(pl.lit("值不匹配"))
                .otherwise(pl.lit("一致"))
                .alias(f"{col}_diff")
            )

    if diff_exprs:
        joined = joined.with_columns(diff_exprs)

    return joined


def detect_outliers(
    df: pl.DataFrame,
    value_col: str,
    group_cols: Optional[List[str]] = None,
    threshold: float = 2.0,
) -> pl.DataFrame:
    if df.is_empty():
        return df

    if group_cols:
        stats = df.group_by(group_cols).agg(
            pl.mean(value_col).alias("_mean"),
            pl.std(value_col).alias("_std"),
        )
        result = df.join(stats, on=group_cols)
    else:
        mean_val = df[value_col].mean()
        std_val = df[value_col].std()
        result = df.with_columns(
            pl.lit(mean_val).alias("_mean"),
            pl.lit(std_val).alias("_std"),
        )

    result = result.with_columns(
        ((pl.col(value_col) - pl.col("_mean")).abs() / pl.col("_std"))
        .fill_null(0)
        .alias("_zscore")
    )

    return result.filter(pl.col("_zscore") > threshold).drop(["_mean", "_std", "_zscore"])


def summarize_numeric(
    df: pl.DataFrame,
    value_col: str,
    group_cols: Optional[List[str]] = None,
) -> pl.DataFrame:
    if df.is_empty():
        return pl.DataFrame()

    agg_exprs = [
        pl.count(value_col).alias("count"),
        pl.sum(value_col).alias("sum"),
        pl.mean(value_col).alias("mean"),
        pl.min(value_col).alias("min"),
        pl.max(value_col).alias("max"),
        pl.std(value_col).alias("std"),
        pl.median(value_col).alias("median"),
    ]

    if group_cols:
        return df.group_by(group_cols).agg(agg_exprs).sort(group_cols)
    return df.select(agg_exprs)


def safe_cast_date(df: pl.DataFrame, col_names: List[str]) -> pl.DataFrame:
    for col in col_names:
        if col in df.columns:
            df = df.with_columns(
                pl.col(col).cast(pl.Utf8).str.to_date(strict=False).alias(col)
            )
    return df


def safe_cast_datetime(df: pl.DataFrame, col_names: List[str]) -> pl.DataFrame:
    for col in col_names:
        if col in df.columns:
            df = df.with_columns(
                pl.col(col).cast(pl.Utf8).str.to_datetime(strict=False).alias(col)
            )
    return df


def add_period_column(
    df: pl.DataFrame,
    date_col: str,
    period: str = "month",
    new_col: Optional[str] = None,
) -> pl.DataFrame:
    if not new_col:
        new_col = f"{date_col}_{period}"

    period_map = {
        "day": pl.col(date_col).dt.strftime("%Y-%m-%d"),
        "week": pl.col(date_col).dt.strftime("%Y-W%U"),
        "month": pl.col(date_col).dt.strftime("%Y-%m"),
        "quarter": pl.col(date_col).dt.strftime("%Y-Q%q"),
        "year": pl.col(date_col).dt.strftime("%Y"),
    }

    return df.with_columns(period_map.get(period, period_map["month"]).alias(new_col))


def calculate_rate(
    numerator: float,
    denominator: float,
    decimal_places: int = 2,
) -> float:
    if denominator == 0:
        return 0.0
    return round((numerator / denominator) * 100, decimal_places)
