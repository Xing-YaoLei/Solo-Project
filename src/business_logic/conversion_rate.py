from typing import Optional, Dict, Any, List, Tuple
from datetime import date, datetime, timedelta
import polars as pl
from src.data_layer.data_repository import DataRepository
from src.data_layer.polars_processor import PolarsProcessor


class ConversionRateCalculator:
    def __init__(self, repository: DataRepository):
        self.repository = repository
        self.processor = PolarsProcessor()
        self._formula_cache: Dict[str, callable] = {}

    def _build_formula(self, formula_str: str) -> callable:
        if formula_str in self._formula_cache:
            return self._formula_cache[formula_str]

        safe_env = {
            "pl": pl,
            "col": pl.col,
            "sum": pl.sum,
            "count": pl.count,
            "mean": pl.mean,
            "max": pl.max,
            "min": pl.min,
            "when": pl.when,
            "lit": pl.lit,
            "n_unique": pl.n_unique,
        }

        def formula_func(df: pl.DataFrame) -> pl.Expr:
            return eval(formula_str, {"__builtins__": {}}, {**safe_env, "df": df})

        self._formula_cache[formula_str] = formula_func
        return formula_func

    def calculate_conversion(
        self,
        orders_df: pl.DataFrame,
        inventory_df: pl.DataFrame,
        version_code: str,
        group_by: Optional[List[str]] = None,
    ) -> pl.DataFrame:
        versions = self.repository.get_conversion_rate_versions(
            is_active=True, version_code=version_code
        )
        if versions.is_empty():
            raise ValueError(f"No active conversion rate version found for code: {version_code}")

        version = versions.row(0, named=True)
        num_formula = self._build_formula(version["numerator_formula"])
        den_formula = self._build_formula(version["denominator_formula"])

        merged_df = orders_df.join(
            inventory_df,
            left_on=["package_id", "order_date"],
            right_on=["package_id", "date"],
            how="left",
        )

        if group_by:
            result = merged_df.group_by(group_by).agg(
                numerator=num_formula(merged_df),
                denominator=den_formula(merged_df),
            )
        else:
            result = pl.DataFrame(
                {
                    "numerator": [num_formula(merged_df)],
                    "denominator": [den_formula(merged_df)],
                }
            )

        result = self.processor.safe_divide(
            result, "numerator", "denominator", "conversion_rate", 0.0
        )
        result = result.with_columns((pl.col("conversion_rate") * 100).alias("conversion_rate"))

        if version["time_range"] == "daily":
            result = result.with_columns(period=pl.lit("daily"))
        elif version["time_range"] == "weekly":
            result = result.with_columns(period=pl.lit("weekly"))
        elif version["time_range"] == "monthly":
            result = result.with_columns(period=pl.lit("monthly"))

        return result.with_columns(
            version_code=pl.lit(version_code),
            version_name=pl.lit(version["version_name"]),
            calculated_at=pl.lit(datetime.now()),
        )

    def compare_versions(
        self,
        orders_df: pl.DataFrame,
        inventory_df: pl.DataFrame,
        version_codes: List[str],
        group_by: Optional[List[str]] = None,
    ) -> pl.DataFrame:
        results = []
        for version_code in version_codes:
            try:
                result = self.calculate_conversion(
                    orders_df, inventory_df, version_code, group_by
                )
                results.append(result)
            except ValueError:
                continue

        if not results:
            return pl.DataFrame()

        return pl.concat(results)

    def get_trend(
        self,
        orders_df: pl.DataFrame,
        inventory_df: pl.DataFrame,
        version_code: str,
        date_col: str = "order_date",
        period: str = "day",
    ) -> pl.DataFrame:
        versions = self.repository.get_conversion_rate_versions(
            is_active=True, version_code=version_code
        )
        if versions.is_empty():
            raise ValueError(f"No active conversion rate version found for code: {version_code}")

        version = versions.row(0, named=True)
        num_formula = self._build_formula(version["numerator_formula"])
        den_formula = self._build_formula(version["denominator_formula"])

        merged_df = orders_df.join(
            inventory_df,
            left_on=["package_id", "order_date"],
            right_on=["package_id", "date"],
            how="left",
        )

        period_map = {
            "day": "1d",
            "week": "1w",
            "month": "1mo",
            "quarter": "3mo",
            "year": "1y",
        }

        grouped = (
            merged_df.sort(date_col)
            .group_by_dynamic(date_col, every=period_map[period])
            .agg(
                numerator=num_formula(merged_df),
                denominator=den_formula(merged_df),
            )
        )

        result = self.processor.safe_divide(
            grouped, "numerator", "denominator", "conversion_rate", 0.0
        )
        result = result.with_columns((pl.col("conversion_rate") * 100).alias("conversion_rate"))

        return result.with_columns(
            version_code=pl.lit(version_code),
            version_name=pl.lit(version["version_name"]),
        )

    def explain_difference(
        self,
        orders_df: pl.DataFrame,
        inventory_df: pl.DataFrame,
        version_code_1: str,
        version_code_2: str,
    ) -> Dict[str, Any]:
        versions_1 = self.repository.get_conversion_rate_versions(version_code=version_code_1)
        versions_2 = self.repository.get_conversion_rate_versions(version_code=version_code_2)

        if versions_1.is_empty() or versions_2.is_empty():
            raise ValueError("One or both version codes not found")

        v1 = versions_1.row(0, named=True)
        v2 = versions_2.row(0, named=True)

        result1 = self.calculate_conversion(orders_df, inventory_df, version_code_1)
        result2 = self.calculate_conversion(orders_df, inventory_df, version_code_2)

        cr1 = result1["conversion_rate"][0] if not result1.is_empty() else 0
        cr2 = result2["conversion_rate"][0] if not result2.is_empty() else 0

        differences = []
        if v1["numerator_formula"] != v2["numerator_formula"]:
            differences.append(
                f"分子公式不同: {v1['numerator_formula']} vs {v2['numerator_formula']}"
            )
        if v1["denominator_formula"] != v2["denominator_formula"]:
            differences.append(
                f"分母公式不同: {v1['denominator_formula']} vs {v2['denominator_formula']}"
            )
        if v1["time_range"] != v2["time_range"]:
            differences.append(f"时间范围不同: {v1['time_range']} vs {v2['time_range']}")
        if v1["filters"] != v2["filters"]:
            differences.append(f"过滤条件不同: {v1['filters']} vs {v2['filters']}")
        if v1["effective_date"] != v2["effective_date"]:
            differences.append(
                f"生效日期不同: {v1['effective_date']} vs {v2['effective_date']}"
            )

        return {
            "version_1": v1,
            "version_2": v2,
            "conversion_rate_1": cr1,
            "conversion_rate_2": cr2,
            "absolute_difference": abs(cr1 - cr2),
            "relative_difference": ((cr2 - cr1) / cr1 * 100) if cr1 != 0 else None,
            "differences": differences,
        }

    def get_version_description(self, version_code: str) -> Optional[str]:
        versions = self.repository.get_conversion_rate_versions(version_code=version_code)
        if versions.is_empty():
            return None

        version = versions.row(0, named=True)
        return (
            f"版本: {version['version_name']} ({version_code})\n"
            f"描述: {version['description']}\n"
            f"分子: {version['numerator_formula']}\n"
            f"分母: {version['denominator_formula']}\n"
            f"时间范围: {version['time_range']}\n"
            f"过滤器: {version['filters'] or '无'}\n"
            f"生效日期: {version['effective_date']}"
            + (f" ~ {version['expiry_date']}" if version["expiry_date"] else "")
        )
