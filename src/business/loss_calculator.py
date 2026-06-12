from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Optional

import polars as pl

from src.business.metric_versions import apply_metric_filter, get_metric_version


@dataclass
class LossMetricsResult:
    loss_rate: float
    loss_amount: float
    denominator: float
    loss_quantity: float
    report_count: int
    metric_version: str
    formula: str
    note: str = ""


class LossCalculator:
    def __init__(self, metric_version: str = "v2.0"):
        self.metric_version = metric_version
        mv = get_metric_version(metric_version)
        self.formula = mv.formula if mv else "损耗率 = 报损金额 ÷ 销售金额"

    def compute_denominator(
        self,
        receipts_df: pl.DataFrame,
        delivery_df: pl.DataFrame,
        inventory_df: Optional[pl.DataFrame] = None,
    ) -> float:
        sales_amount = 0.0
        if not receipts_df.is_empty() and "total_amount" in receipts_df.columns:
            sales_amount += receipts_df["total_amount"].sum() or 0.0
        if not delivery_df.is_empty() and "total_amount" in delivery_df.columns:
            sales_amount += delivery_df["total_amount"].sum() or 0.0

        if self.metric_version in ("v1.1", "v2.0"):
            if inventory_df is not None and not inventory_df.is_empty():
                if "unit_price" in inventory_df.columns and "quantity" in inventory_df.columns:
                    inv_cost = (inventory_df["quantity"] * inventory_df["unit_price"]).sum() or 0.0
                    sales_amount += float(inv_cost)
        return float(sales_amount)

    def compute(
        self,
        loss_df: pl.DataFrame,
        receipts_df: pl.DataFrame,
        delivery_df: pl.DataFrame,
        inventory_df: Optional[pl.DataFrame] = None,
    ) -> LossMetricsResult:
        filtered_loss = apply_metric_filter(loss_df, self.metric_version)
        loss_amount = 0.0
        loss_quantity = 0.0
        report_count = 0

        if not filtered_loss.is_empty():
            if "loss_amount" in filtered_loss.columns:
                loss_amount = float(filtered_loss["loss_amount"].sum() or 0.0)
            if "loss_quantity" in filtered_loss.columns:
                loss_quantity = float(filtered_loss["loss_quantity"].sum() or 0.0)
            report_count = filtered_loss.height

        denominator = self.compute_denominator(receipts_df, delivery_df, inventory_df)
        loss_rate = (loss_amount / denominator) if denominator > 0 else 0.0

        note = ""
        if self.metric_version == "v2.0" and loss_df.height != filtered_loss.height:
            note = f"已过滤未通过复核的报损单：原始 {loss_df.height} 条，计入 {filtered_loss.height} 条"
        elif denominator == 0:
            note = "分母（销售+库存）为 0，损耗率显示为 0"

        return LossMetricsResult(
            loss_rate=float(loss_rate),
            loss_amount=float(loss_amount),
            denominator=float(denominator),
            loss_quantity=float(loss_quantity),
            report_count=int(report_count),
            metric_version=self.metric_version,
            formula=self.formula,
            note=note,
        )


def compute_trend(
    loss_df: pl.DataFrame,
    receipts_df: pl.DataFrame,
    delivery_df: pl.DataFrame,
    inventory_df: Optional[pl.DataFrame],
    freq: str = "day",
    metric_version: str = "v2.0",
) -> pl.DataFrame:
    calculator = LossCalculator(metric_version)
    filtered_loss = apply_metric_filter(loss_df, metric_version)

    if filtered_loss.is_empty():
        return pl.DataFrame(schema={
            "period": pl.Date,
            "loss_amount": pl.Float64,
            "report_count": pl.Int64,
            "denominator": pl.Float64,
            "loss_rate": pl.Float64,
        })

    date_col = "report_date"
    if freq == "day":
        trunc_expr = pl.col(date_col).dt.truncate("1d")
    elif freq == "week":
        trunc_expr = pl.col(date_col).dt.truncate("1w")
    elif freq == "month":
        trunc_expr = pl.col(date_col).dt.truncate("1mo")
    else:
        trunc_expr = pl.col(date_col).dt.truncate("1d")

    loss_grouped = (
        filtered_loss
        .with_columns(period=trunc_expr)
        .group_by("period")
        .agg(
            pl.col("loss_amount").sum().alias("loss_amount"),
            pl.col("id").count().alias("report_count"),
        )
        .sort("period")
    )

    all_dates = []
    if not loss_grouped.is_empty():
        min_p = loss_grouped["period"].min()
        max_p = loss_grouped["period"].max()
        if freq == "day":
            from datetime import timedelta
            cur = min_p
            while cur <= max_p:
                all_dates.append(cur)
                cur += timedelta(days=1)
        elif freq == "week":
            from datetime import timedelta
            cur = min_p
            while cur <= max_p:
                all_dates.append(cur)
                cur += timedelta(days=7)
        else:
            cur = min_p
            while cur <= max_p:
                if cur.month == 12:
                    nxt = date(cur.year + 1, 1, 1)
                else:
                    nxt = date(cur.year, cur.month + 1, 1)
                all_dates.append(cur)
                cur = nxt

    result_rows = []
    for p in all_dates:
        if freq == "day":
            p_end = p
        elif freq == "week":
            from datetime import timedelta
            p_end = date.fromordinal(p.toordinal() + 6)
        else:
            if p.month == 12:
                p_end = date(p.year, 12, 31)
            else:
                p_end = date(p.year, p.month + 1, 1).fromordinal(date(p.year, p.month + 1, 1).toordinal() - 1)

        period_loss = filtered_loss.filter(
            (pl.col("report_date") >= p) & (pl.col("report_date") <= p_end)
        )
        period_receipts = receipts_df.filter(
            (pl.col("sale_date") >= p) & (pl.col("sale_date") <= p_end)
        ) if not receipts_df.is_empty() else receipts_df
        period_delivery = delivery_df.filter(
            (pl.col("order_date") >= p) & (pl.col("order_date") <= p_end)
        ) if not delivery_df.is_empty() else delivery_df
        period_inv = inventory_df.filter(
            (pl.col("record_date") >= p) & (pl.col("record_date") <= p_end)
        ) if inventory_df is not None and not inventory_df.is_empty() else inventory_df

        m = calculator.compute(period_loss, period_receipts, period_delivery, period_inv)
        result_rows.append({
            "period": p,
            "loss_amount": m.loss_amount,
            "report_count": m.report_count,
            "denominator": m.denominator,
            "loss_rate": m.loss_rate,
        })

    return pl.DataFrame(result_rows)


def compute_reason_composition(loss_df: pl.DataFrame, metric_version: str = "v2.0") -> pl.DataFrame:
    filtered = apply_metric_filter(loss_df, metric_version)
    if filtered.is_empty() or "loss_reason" not in filtered.columns:
        return pl.DataFrame(schema={"loss_reason": pl.Utf8, "loss_amount": pl.Float64, "pct": pl.Float64})

    total = filtered["loss_amount"].sum() or 0.0
    grouped = (
        filtered
        .group_by("loss_reason")
        .agg(pl.col("loss_amount").sum().alias("loss_amount"))
        .sort("loss_amount", descending=True)
    )
    if total > 0:
        grouped = grouped.with_columns((pl.col("loss_amount") / total).alias("pct"))
    else:
        grouped = grouped.with_columns(pl.lit(0.0).alias("pct"))
    return grouped


def detect_store_exceptions(
    loss_df: pl.DataFrame,
    receipts_df: pl.DataFrame,
    delivery_df: pl.DataFrame,
    threshold_pct: float = 0.05,
    metric_version: str = "v2.0",
) -> pl.DataFrame:
    filtered = apply_metric_filter(loss_df, metric_version)
    if filtered.is_empty() or "store_id" not in filtered.columns:
        return pl.DataFrame(schema={
            "store_id": pl.Utf8,
            "store_name": pl.Utf8,
            "loss_amount": pl.Float64,
            "denominator": pl.Float64,
            "loss_rate": pl.Float64,
            "is_exception": pl.Boolean,
            "report_count": pl.Int64,
        })

    calculator = LossCalculator(metric_version)
    stores = filtered.select(["store_id", "store_name"]).unique()

    rows = []
    for row in stores.iter_rows(named=True):
        sid = row["store_id"]
        sname = row["store_name"]
        s_loss = filtered.filter(pl.col("store_id") == sid)
        s_receipts = receipts_df.filter(pl.col("store_id") == sid) if not receipts_df.is_empty() else receipts_df
        s_delivery = delivery_df.filter(pl.col("store_id") == sid) if not delivery_df.is_empty() else delivery_df
        m = calculator.compute(s_loss, s_receipts, s_delivery, None)
        rows.append({
            "store_id": sid,
            "store_name": sname,
            "loss_amount": m.loss_amount,
            "denominator": m.denominator,
            "loss_rate": m.loss_rate,
            "is_exception": m.loss_rate > threshold_pct,
            "report_count": m.report_count,
        })

    result = pl.DataFrame(rows).sort("loss_rate", descending=True)
    return result
