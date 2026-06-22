import polars as pl
import numpy as np
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple, List
from dateutil.relativedelta import relativedelta


class TrendAnalyzer:
    @staticmethod
    def calculate_period_over_period(df: pl.DataFrame, date_col: str, value_col: str,
                                   period: str = "month", compare_type: str = "yoy") -> pl.DataFrame:
        if period == "day":
            offset_func = lambda d: d - timedelta(days=1) if compare_type == "mom" else d - relativedelta(years=1)
            group_format = "%Y-%m-%d"
        elif period == "week":
            offset_func = lambda d: d - timedelta(weeks=1) if compare_type == "mom" else d - relativedelta(years=1)
            group_format = "%Y-%W"
        elif period == "month":
            offset_func = lambda d: d - relativedelta(months=1) if compare_type == "mom" else d - relativedelta(years=1)
            group_format = "%Y-%m"
        elif period == "quarter":
            offset_func = lambda d: d - relativedelta(months=3) if compare_type == "mom" else d - relativedelta(years=1)
            group_format = "%Y-Q%q"
        else:
            raise ValueError(f"Invalid period: {period}")

        df = df.with_columns([
            pl.col(date_col).cast(pl.Datetime).alias("date_parsed")
        ])

        df = df.with_columns([
            pl.col("date_parsed").dt.strftime(group_format).alias("period")
        ])

        if df[value_col].dtype in [pl.String, pl.Utf8]:
            agg_expr = pl.col(value_col).count().alias("current_value")
        else:
            agg_expr = pl.col(value_col).sum().alias("current_value")

        agg_df = df.group_by("period").agg([
            agg_expr,
            pl.col("date_parsed").min().alias("period_start")
        ]).sort("period")

        agg_df = agg_df.with_columns([
            pl.col("period_start").map_elements(offset_func, return_dtype=pl.Datetime).alias("compare_period_start")
        ])

        compare_values = []
        for row in agg_df.iter_rows(named=True):
            compare_start = row["compare_period_start"]
            if compare_start is None:
                compare_values.append(None)
                continue

            compare_period = compare_start.strftime(group_format)
            compare_row = agg_df.filter(pl.col("period") == compare_period)
            if len(compare_row) > 0:
                compare_values.append(compare_row["current_value"][0])
            else:
                compare_values.append(None)

        agg_df = agg_df.with_columns([
            pl.Series("compare_value", compare_values)
        ])

        agg_df = agg_df.with_columns([
            ((pl.col("current_value") - pl.col("compare_value")) / pl.col("compare_value") * 100)
            .round(2).alias("growth_rate"),
            (pl.col("current_value") - pl.col("compare_value")).alias("absolute_change")
        ])

        return agg_df.select([
            "period", "period_start", "current_value", "compare_value",
            "growth_rate", "absolute_change"
        ])

    @staticmethod
    def calculate_yoy(df: pl.DataFrame, date_col: str, value_col: str, period: str = "month") -> pl.DataFrame:
        return TrendAnalyzer.calculate_period_over_period(df, date_col, value_col, period, "yoy")

    @staticmethod
    def calculate_mom(df: pl.DataFrame, date_col: str, value_col: str, period: str = "month") -> pl.DataFrame:
        return TrendAnalyzer.calculate_period_over_period(df, date_col, value_col, period, "mom")

    @staticmethod
    def group_by_region(df: pl.DataFrame, value_col: str,
                       region_col: str = "region_name") -> pl.DataFrame:
        return df.group_by(region_col).agg([
            pl.col(value_col).sum().alias("total"),
            pl.col(value_col).count().alias("count")
        ]).sort("total", descending=True)

    @staticmethod
    def group_by_region_and_period(df: pl.DataFrame, date_col: str, value_col: str,
                                   region_col: str = "region_name",
                                   period: str = "month") -> pl.DataFrame:
        if period == "day":
            format_str = "%Y-%m-%d"
        elif period == "week":
            format_str = "%Y-%W"
        elif period == "month":
            format_str = "%Y-%m"
        elif period == "quarter":
            format_str = "%Y-Q%q"
        else:
            raise ValueError(f"Invalid period: {period}")

        return df.with_columns([
            pl.col(date_col).cast(pl.Datetime).dt.strftime(format_str).alias("period")
        ]).group_by([region_col, "period"]).agg([
            pl.col(value_col).sum().alias("total")
        ]).sort(["period", region_col])

    @staticmethod
    def calculate_reoccurrence_rate(df: pl.DataFrame) -> Dict[str, Any]:
        if "is_reoccurrence" not in df.columns:
            return {"error": "Column 'is_reoccurrence' not found in dataframe"}

        total = len(df)
        reoccurred = df.filter(pl.col("is_reoccurrence") == True).height
        rate = (reoccurred / total * 100) if total > 0 else 0

        by_severity = df.group_by("severity").agg([
            pl.count().alias("total"),
            (pl.col("is_reoccurrence") == True).sum().alias("reoccurred")
        ]).with_columns([
            (pl.col("reoccurred") / pl.col("total") * 100).round(2).alias("reoccurrence_rate")
        ])

        return {
            "total_issues": total,
            "reoccurred_issues": reoccurred,
            "reoccurrence_rate": round(rate, 2),
            "by_severity": by_severity.to_dicts()
        }

    @staticmethod
    def get_top_regions_by_growth(df: pl.DataFrame, date_col: str, value_col: str,
                                  region_col: str = "region_name",
                                  top_n: int = 5,
                                  compare_type: str = "yoy") -> pl.DataFrame:
        region_period_df = TrendAnalyzer.group_by_region_and_period(
            df, date_col, value_col, region_col, "month"
        )

        results = []
        for region in region_period_df[region_col].unique().to_list():
            region_df = region_period_df.filter(pl.col(region_col) == region)
            if len(region_df) >= 2:
                latest = region_df.sort("period", descending=True)[0]
                compare_df = TrendAnalyzer.calculate_period_over_period(
                    region_df.with_columns([
                        pl.col("period").str.strptime(pl.Datetime, "%Y-%m").alias("date_col")
                    ]),
                    "date_col", "total", "month", compare_type
                )
                if len(compare_df) > 0:
                    latest_compare = compare_df.sort("period", descending=True)[0]
                    results.append({
                        region_col: region,
                        "current_value": latest_compare["current_value"],
                        "compare_value": latest_compare["compare_value"],
                        "growth_rate": latest_compare["growth_rate"],
                        "absolute_change": latest_compare["absolute_change"]
                    })

        result_df = pl.DataFrame(results)
        if len(result_df) > 0:
            return result_df.sort("growth_rate", descending=True).head(top_n)
        return pl.DataFrame()

    @staticmethod
    def calculate_running_total(df: pl.DataFrame, date_col: str, value_col: str) -> pl.DataFrame:
        return df.sort(date_col).with_columns([
            pl.col(value_col).cum_sum().alias("running_total")
        ])
