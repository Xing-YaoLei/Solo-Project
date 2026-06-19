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

    def _build_safe_env(self) -> Dict[str, Any]:
        def _smart_count(*args):
            if len(args) == 0:
                return pl.count()
            result = None
            for arg in args:
                if isinstance(arg, str):
                    expr = pl.col(arg).count()
                elif isinstance(arg, pl.Expr):
                    expr = arg.count()
                else:
                    raise TypeError(f"count() expects str or Expr, got {type(arg)}")
                result = expr if result is None else result + expr
            return result

        def _smart_sum(*args):
            if len(args) == 0:
                raise TypeError("sum() requires at least one argument")
            result = None
            for arg in args:
                if isinstance(arg, str):
                    expr = pl.col(arg).sum()
                elif isinstance(arg, pl.Expr):
                    expr = arg.sum()
                else:
                    raise TypeError(f"sum() expects str or Expr, got {type(arg)}")
                result = expr if result is None else result + expr
            return result

        def _smart_mean(*args):
            if len(args) == 0:
                raise TypeError("mean() requires at least one argument")
            result = None
            for arg in args:
                if isinstance(arg, str):
                    expr = pl.col(arg).mean()
                elif isinstance(arg, pl.Expr):
                    expr = arg.mean()
                else:
                    raise TypeError(f"mean() expects str or Expr, got {type(arg)}")
                result = expr if result is None else result + expr
            return result

        def _smart_max(*args):
            if len(args) == 0:
                raise TypeError("max() requires at least one argument")
            result = None
            for arg in args:
                if isinstance(arg, str):
                    expr = pl.col(arg).max()
                elif isinstance(arg, pl.Expr):
                    expr = arg.max()
                else:
                    raise TypeError(f"max() expects str or Expr, got {type(arg)}")
                result = expr if result is None else pl.max_horizontal(result, expr)
            return result

        def _smart_min(*args):
            if len(args) == 0:
                raise TypeError("min() requires at least one argument")
            result = None
            for arg in args:
                if isinstance(arg, str):
                    expr = pl.col(arg).min()
                elif isinstance(arg, pl.Expr):
                    expr = arg.min()
                else:
                    raise TypeError(f"min() expects str or Expr, got {type(arg)}")
                result = expr if result is None else pl.min_horizontal(result, expr)
            return result

        def _smart_n_unique(*args):
            if len(args) == 0:
                raise TypeError("n_unique() requires at least one argument")
            result = None
            for arg in args:
                if isinstance(arg, str):
                    expr = pl.col(arg).n_unique()
                elif isinstance(arg, pl.Expr):
                    expr = arg.n_unique()
                else:
                    raise TypeError(f"n_unique() expects str or Expr, got {type(arg)}")
                result = expr if result is None else result + expr
            return result

        return {
            "pl": pl,
            "col": pl.col,
            "count": _smart_count,
            "sum": _smart_sum,
            "mean": _smart_mean,
            "max": _smart_max,
            "min": _smart_min,
            "when": pl.when,
            "lit": pl.lit,
            "n_unique": _smart_n_unique,
        }

    def _build_formula(self, formula_str: str) -> callable:
        if formula_str in self._formula_cache:
            return self._formula_cache[formula_str]

        safe_env = self._build_safe_env()

        def formula_func(df: pl.DataFrame) -> pl.Expr:
            return eval(formula_str, {"__builtins__": {}}, {**safe_env, "df": df})

        self._formula_cache[formula_str] = formula_func
        return formula_func

    def _apply_filters(self, df: pl.DataFrame, filters: Optional[str]) -> pl.DataFrame:
        if not filters:
            return df
        try:
            safe_env = self._build_safe_env()
            filter_expr = eval(filters, {"__builtins__": {}}, safe_env)
            return df.filter(filter_expr)
        except Exception:
            return df

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

        merged_df = self._apply_filters(merged_df, version["filters"])

        if group_by:
            valid_group_cols = [c for c in group_by if c in merged_df.columns]
            if not valid_group_cols:
                valid_group_cols = None

            if valid_group_cols:
                try:
                    num_expr = num_formula(merged_df).alias("numerator")
                    den_expr = den_formula(merged_df).alias("denominator")
                    result = merged_df.group_by(valid_group_cols).agg([num_expr, den_expr])
                except Exception as e:
                    result = merged_df.group_by(valid_group_cols).agg(
                        [
                            pl.count("order_id").alias("numerator"),
                            pl.sum("available_rooms").alias("denominator"),
                        ]
                    )
            else:
                result = self._calc_no_group(merged_df, num_formula, den_formula)
        else:
            result = self._calc_no_group(merged_df, num_formula, den_formula)

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

    def _calc_no_group(
        self,
        merged_df: pl.DataFrame,
        num_formula: callable,
        den_formula: callable,
    ) -> pl.DataFrame:
        try:
            num_expr = num_formula(merged_df)
            den_expr = den_formula(merged_df)
            result = merged_df.select(
                [
                    num_expr.alias("numerator"),
                    den_expr.alias("denominator"),
                ]
            )
            num_val = result["numerator"][0] if len(result) > 0 else 0
            den_val = result["denominator"][0] if len(result) > 0 else 0
        except Exception:
            num_val = merged_df.select(pl.count("order_id")).item() if "order_id" in merged_df.columns else 0
            den_val = merged_df.select(pl.sum("available_rooms")).item() if "available_rooms" in merged_df.columns else 0
            if den_val is None:
                den_val = 0

        return pl.DataFrame(
            {
                "numerator": [num_val if num_val is not None else 0],
                "denominator": [den_val if den_val is not None else 0],
            }
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
            except Exception as e:
                continue

        if not results:
            return pl.DataFrame(
                schema={
                    "numerator": pl.Float64,
                    "denominator": pl.Float64,
                    "conversion_rate": pl.Float64,
                    "period": pl.Utf8,
                    "version_code": pl.Utf8,
                    "version_name": pl.Utf8,
                    "calculated_at": pl.Datetime,
                }
            )

        normalized = []
        for r in results:
            normalized.append(
                r.with_columns(
                    [
                        pl.col("numerator").cast(pl.Float64),
                        pl.col("denominator").cast(pl.Float64),
                    ]
                )
            )

        return pl.concat(normalized, how="diagonal")

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

        merged_df = self._apply_filters(merged_df, version["filters"])

        period_map = {
            "day": "1d",
            "week": "1w",
            "month": "1mo",
            "quarter": "3mo",
            "year": "1y",
        }

        if date_col not in merged_df.columns:
            return pl.DataFrame()

        try:
            num_expr = num_formula(merged_df).alias("numerator")
            den_expr = den_formula(merged_df).alias("denominator")
            grouped = (
                merged_df.sort(date_col)
                .group_by_dynamic(date_col, every=period_map[period])
                .agg([num_expr, den_expr])
            )
        except Exception:
            grouped = (
                merged_df.sort(date_col)
                .group_by_dynamic(date_col, every=period_map[period])
                .agg(
                    [
                        pl.count("order_id").alias("numerator"),
                        pl.sum("available_rooms").alias("denominator"),
                    ]
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

        try:
            result1 = self.calculate_conversion(orders_df, inventory_df, version_code_1)
        except Exception:
            result1 = pl.DataFrame({"numerator": [0], "denominator": [0], "conversion_rate": [0]})

        try:
            result2 = self.calculate_conversion(orders_df, inventory_df, version_code_2)
        except Exception:
            result2 = pl.DataFrame({"numerator": [0], "denominator": [0], "conversion_rate": [0]})

        cr1 = result1["conversion_rate"][0] if not result1.is_empty() else 0
        cr2 = result2["conversion_rate"][0] if not result2.is_empty() else 0
        num1 = result1["numerator"][0] if not result1.is_empty() else 0
        den1 = result1["denominator"][0] if not result1.is_empty() else 0
        num2 = result2["numerator"][0] if not result2.is_empty() else 0
        den2 = result2["denominator"][0] if not result2.is_empty() else 0

        differences = []
        if v1["numerator_formula"] != v2["numerator_formula"]:
            differences.append({
                "field": "分子公式",
                "value_1": v1["numerator_formula"],
                "value_2": v2["numerator_formula"],
                "impact": f"分子口径差异: {num1} vs {num2}",
            })
        if v1["denominator_formula"] != v2["denominator_formula"]:
            differences.append({
                "field": "分母公式",
                "value_1": v1["denominator_formula"],
                "value_2": v2["denominator_formula"],
                "impact": f"分母口径差异: {den1} vs {den2}",
            })
        if v1["time_range"] != v2["time_range"]:
            differences.append({
                "field": "时间范围",
                "value_1": v1["time_range"],
                "value_2": v2["time_range"],
                "impact": "聚合粒度不同",
            })
        if (v1["filters"] or None) != (v2["filters"] or None):
            differences.append({
                "field": "过滤条件",
                "value_1": v1["filters"] or "无",
                "value_2": v2["filters"] or "无",
                "impact": "数据筛选范围不同",
            })
        if str(v1["effective_date"]) != str(v2["effective_date"]):
            differences.append({
                "field": "生效日期",
                "value_1": str(v1["effective_date"]),
                "value_2": str(v2["effective_date"]),
                "impact": "生效时间不同",
            })

        abs_diff = abs(cr1 - cr2) if cr1 is not None and cr2 is not None else 0
        rel_diff = None
        if cr1 not in (None, 0):
            rel_diff = ((cr2 - cr1) / cr1 * 100) if cr2 is not None else None

        return {
            "version_1": v1,
            "version_2": v2,
            "metrics_1": {
                "conversion_rate": round(cr1, 2) if cr1 is not None else 0,
                "numerator": num1,
                "denominator": den1,
            },
            "metrics_2": {
                "conversion_rate": round(cr2, 2) if cr2 is not None else 0,
                "numerator": num2,
                "denominator": den2,
            },
            "absolute_difference": round(abs_diff, 2),
            "relative_difference": round(rel_diff, 2) if rel_diff is not None else None,
            "differences": differences,
            "summary": self._build_diff_summary(cr1, cr2, differences),
        }

    def _build_diff_summary(
        self, cr1: float, cr2: float, differences: List[Dict]
    ) -> str:
        if cr1 is None or cr2 is None:
            return "数据不完整，无法生成对比总结"

        direction = "上升" if cr2 > cr1 else "下降" if cr2 < cr1 else "持平"
        abs_diff = abs(cr2 - cr1)

        if not differences:
            return f"两个版本口径完全一致，转化率{direction} {abs_diff:.2f} 个百分点，差异来自数据波动"

        parts = [
            f"从 {cr1:.2f}% {direction}至 {cr2:.2f}%，",
            f"差值 {abs_diff:.2f} 个百分点。",
            f"共发现 {len(differences)} 处口径差异：",
        ]
        for i, d in enumerate(differences, 1):
            parts.append(f"{i}. {d['field']}: {d['impact']}")

        return "".join(parts)

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
