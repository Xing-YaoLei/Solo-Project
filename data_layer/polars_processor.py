import polars as pl
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
from enum import Enum


class CompletenessCalculator:
    @staticmethod
    def calculate_row_completeness(row: dict, required_fields: List[str]) -> float:
        filled = sum(1 for f in required_fields if row.get(f) is not None and row.get(f) != "")
        return round((filled / len(required_fields)) * 100, 2) if required_fields else 100.0

    @staticmethod
    def find_missing_fields(row: dict, required_fields: List[str]) -> List[str]:
        return [f for f in required_fields if row.get(f) is None or row.get(f) == ""]


class PolarsProcessor:
    REQUIRED_FIELDS = {
        "design_exports": ["project_id", "project_name", "design_version", "export_time"],
        "payment_records": ["project_id", "payment_amount", "payment_time", "payment_status"],
        "purchase_orders": ["project_id", "supplier_name", "material_name", "order_amount"],
    }

    def __init__(self):
        self.completeness_calc = CompletenessCalculator()

    def clean_data(self, df: pl.DataFrame, data_source: str) -> pl.DataFrame:
        required = self.REQUIRED_FIELDS.get(data_source, [])
        if not required:
            if "is_missing" not in df.columns:
                df = df.with_columns(pl.lit(False).alias("is_missing"))
            if "missing_fields" not in df.columns:
                df = df.with_columns(pl.lit(None).alias("missing_fields"))
            if "data_completeness" not in df.columns:
                df = df.with_columns(pl.lit(100.0).alias("data_completeness"))
            return df

        available_required = [f for f in required if f in df.columns]

        if available_required:
            missing_conditions = []
            for f in available_required:
                missing_conditions.append(
                    pl.col(f).is_null() | (pl.col(f).cast(pl.Utf8) == "")
                )
            is_missing_any = missing_conditions[0]
            for cond in missing_conditions[1:]:
                is_missing_any = is_missing_any | cond

            field_missing_list = []
            for f in available_required:
                field_missing_list.append(
                    pl.when(
                        pl.col(f).is_null() | (pl.col(f).cast(pl.Utf8) == "")
                    ).then(pl.lit(f)).otherwise(pl.lit(""))
                )

            filled_count = pl.lit(0)
            for f in available_required:
                filled_count = filled_count + pl.when(
                    pl.col(f).is_not_null() & (pl.col(f).cast(pl.Utf8) != "")
                ).then(1).otherwise(0)

            df = df.with_columns([
                is_missing_any.alias("is_missing"),
                pl.concat_str(field_missing_list, separator=",").str.replace_all(r"^,+|,+$", "").str.replace_all(r",,+", ",").alias("missing_fields"),
                (filled_count.cast(pl.Float64) / len(available_required) * 100).round(2).alias("data_completeness"),
            ])
        else:
            df = df.with_columns([
                pl.lit(True).alias("is_missing"),
                pl.lit(",".join(required)).alias("missing_fields"),
                pl.lit(0.0).alias("data_completeness"),
            ])

        return df

    def calculate_overall_completeness(
        self,
        design_df: pl.DataFrame,
        payment_df: pl.DataFrame,
        purchase_df: pl.DataFrame,
    ) -> pl.DataFrame:
        all_projects = set()
        if "project_id" in design_df.columns:
            all_projects.update(design_df["project_id"].to_list())
        if "project_id" in payment_df.columns:
            all_projects.update(payment_df["project_id"].to_list())
        if "project_id" in purchase_df.columns:
            all_projects.update(purchase_df["project_id"].to_list())

        results = []
        for pid in all_projects:
            design_row = design_df.filter(pl.col("project_id") == pid) if "project_id" in design_df.columns else pl.DataFrame()
            payment_row = payment_df.filter(pl.col("project_id") == pid) if "project_id" in payment_df.columns else pl.DataFrame()
            purchase_row = purchase_df.filter(pl.col("project_id") == pid) if "project_id" in purchase_df.columns else pl.DataFrame()

            design_ok = len(design_row) > 0 and not design_row["is_missing"].any() if "is_missing" in design_row.columns else len(design_row) > 0
            payment_ok = len(payment_row) > 0 and not payment_row["is_missing"].any() if "is_missing" in payment_row.columns else len(payment_row) > 0
            purchase_ok = len(purchase_row) > 0 and not purchase_row["is_missing"].any() if "is_missing" in purchase_row.columns else len(purchase_row) > 0

            total = 3
            filled = sum([design_ok, payment_ok, purchase_ok])
            completeness = round((filled / total) * 100, 2)

            if completeness >= 90:
                risk = "低风险"
            elif completeness >= 70:
                risk = "中风险"
            elif completeness >= 50:
                risk = "高风险"
            else:
                risk = "极高风险"

            project_name = None
            region = None
            customer_name = None
            customer_id = None
            for d in [design_row, payment_row, purchase_row]:
                if len(d) > 0:
                    if "project_name" in d.columns and project_name is None:
                        project_name = d["project_name"][0]
                    if "region" in d.columns and region is None:
                        region = d["region"][0]
                    if "customer_name" in d.columns and customer_name is None:
                        customer_name = d["customer_name"][0]
                    if "customer_id" in d.columns and customer_id is None:
                        customer_id = d["customer_id"][0]

            results.append({
                "project_id": pid,
                "project_name": project_name,
                "region": region,
                "customer_id": customer_id,
                "customer_name": customer_name,
                "design_confirmed": design_ok,
                "payment_confirmed": payment_ok,
                "purchase_confirmed": purchase_ok,
                "overall_completeness": completeness,
                "risk_level": risk,
            })

        return pl.DataFrame(results)

    def compare_by_region(self, df: pl.DataFrame) -> pl.DataFrame:
        if "region" not in df.columns or "overall_completeness" not in df.columns:
            return pl.DataFrame()
        return df.group_by("region").agg([
            pl.count("project_id").alias("project_count"),
            pl.mean("overall_completeness").round(2).alias("avg_completeness"),
            pl.min("overall_completeness").alias("min_completeness"),
            pl.max("overall_completeness").alias("max_completeness"),
        ]).sort("avg_completeness", descending=True)

    def compare_by_date(self, df: pl.DataFrame, date_col: str = "confirmation_date") -> pl.DataFrame:
        if date_col not in df.columns:
            return pl.DataFrame()
        return df.with_columns(
            pl.col(date_col).dt.truncate("1d").alias("date")
        ).group_by("date").agg([
            pl.count("project_id").alias("project_count"),
            pl.mean("overall_completeness").round(2).alias("avg_completeness"),
        ]).sort("date")

    def calculate_mom_yoy(
        self,
        df: pl.DataFrame,
        date_col: str,
        value_col: str,
        group_cols: Optional[List[str]] = None,
    ) -> pl.DataFrame:
        if group_cols is None:
            group_cols = []

        df = df.with_columns(
            pl.col(date_col).dt.truncate("1mo").alias("month")
        )

        monthly = df.group_by(group_cols + ["month"]).agg(
            pl.mean(value_col).round(2).alias("current_value")
        ).sort(group_cols + ["month"])

        result_dfs = []
        if group_cols:
            for keys, group in monthly.partition_by(group_cols, as_dict=True).items():
                group = group.sort("month")
                group = group.with_columns([
                    pl.col("current_value").shift(1).alias("prev_month_value"),
                    pl.col("current_value").shift(12).alias("prev_year_value"),
                ])
                result_dfs.append(group)
            if result_dfs:
                monthly = pl.concat(result_dfs)
        else:
            monthly = monthly.sort("month").with_columns([
                pl.col("current_value").shift(1).alias("prev_month_value"),
                pl.col("current_value").shift(12).alias("prev_year_value"),
            ])

        monthly = monthly.with_columns([
            ((pl.col("current_value") - pl.col("prev_month_value")) / pl.col("prev_month_value") * 100
             ).round(2).alias("mom_rate"),
            ((pl.col("current_value") - pl.col("prev_year_value")) / pl.col("prev_year_value") * 100
             ).round(2).alias("yoy_rate"),
        ])

        return monthly

    def get_completeness_distribution(self, df: pl.DataFrame) -> Dict[str, int]:
        bins = [
            ("0-50%", (0, 50)),
            ("50-70%", (50, 70)),
            ("70-90%", (70, 90)),
            ("90-100%", (90, 101)),
        ]
        result = {}
        for label, (low, high) in bins:
            count = df.filter(
                (pl.col("overall_completeness") >= low) & (pl.col("overall_completeness") < high)
            ).height if "overall_completeness" in df.columns else 0
            result[label] = count
        return result

    def filter_by_auth_scope(
        self,
        df: pl.DataFrame,
        allowed_regions: Optional[List[str]] = None,
        allowed_project_ids: Optional[List[str]] = None,
    ) -> pl.DataFrame:
        if allowed_regions and "region" in df.columns:
            df = df.filter(pl.col("region").is_in(allowed_regions))
        if allowed_project_ids and "project_id" in df.columns:
            df = df.filter(pl.col("project_id").is_in(allowed_project_ids))
        return df
