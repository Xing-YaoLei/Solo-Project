import logging

import pandas as pd
from sqlalchemy import create_engine

from config import config

logger = logging.getLogger(__name__)


def compute_settlement_comparison(start_date=None, end_date=None, region_code=None):
    engine = create_engine(config.DATABASE_URL)
    conditions = []
    params = []
    if start_date:
        conditions.append("settlement_date >= %s")
        params.append(start_date)
    if end_date:
        conditions.append("settlement_date <= %s")
        params.append(end_date)
    if region_code:
        conditions.append("region_code = %s")
        params.append(region_code)

    where_clause = (" WHERE " + " AND ".join(conditions)) if conditions else ""
    query = f"""
        SELECT
            settlement_date,
            region_code,
            sku_code,
            sku_name,
            SUM(settled_qty) AS settled_qty,
            SUM(settled_amount) AS settled_amount
        FROM settlement
        {where_clause}
        GROUP BY settlement_date, region_code, sku_code, sku_name
        ORDER BY settlement_date, sku_code
    """
    df = pd.read_sql(query, engine, params=params)

    if df.empty:
        return df

    df["settlement_date"] = pd.to_datetime(df["settlement_date"])
    df["period"] = df["settlement_date"].dt.to_period("W")
    weekly = (
        df.groupby(["period", "region_code", "sku_code", "sku_name"])
        .agg({"settled_qty": "sum", "settled_amount": "sum"})
        .reset_index()
    )
    weekly["period_str"] = weekly["period"].astype(str)

    weekly = weekly.sort_values(["sku_code", "region_code", "period"])
    weekly["qty_wow_change"] = weekly.groupby(["sku_code", "region_code"])["settled_qty"].pct_change()
    weekly["amount_wow_change"] = weekly.groupby(["sku_code", "region_code"])["settled_amount"].pct_change()

    weekly["period_prev"] = weekly["period"] - 52
    weekly["period_prev_str"] = weekly["period_prev"].astype(str)

    yoy = weekly[["sku_code", "region_code", "period_str", "settled_qty", "settled_amount"]].copy()
    yoy = yoy.rename(
        columns={
            "period_str": "period_prev_str",
            "settled_qty": "prev_year_qty",
            "settled_amount": "prev_year_amount",
        }
    )

    merged = weekly.merge(
        yoy[["sku_code", "region_code", "period_prev_str", "prev_year_qty", "prev_year_amount"]],
        on=["sku_code", "region_code", "period_prev_str"],
        how="left",
    )
    merged["qty_yoy_change"] = (merged["settled_qty"] - merged["prev_year_qty"]) / merged["prev_year_qty"].replace(0, float("nan"))
    merged["amount_yoy_change"] = (merged["settled_amount"] - merged["prev_year_amount"]) / merged["prev_year_amount"].replace(0, float("nan"))

    return merged


def compute_tag_comparison(tag_name=None, start_date=None, end_date=None):
    engine = create_engine(config.DATABASE_URL)

    tag_conditions = []
    tag_params = []
    if tag_name:
        tag_conditions.append("tag_name = %s")
        tag_params.append(tag_name)

    tag_where = (" WHERE " + " AND ".join(tag_conditions)) if tag_conditions else ""
    tags_df = pd.read_sql(f"SELECT * FROM product_tag{tag_where}", engine, params=tag_params)

    if tags_df.empty:
        return pd.DataFrame()

    stl_conditions = []
    stl_params = []
    if start_date:
        stl_conditions.append("s.settlement_date >= %s")
        stl_params.append(start_date)
    if end_date:
        stl_conditions.append("s.settlement_date <= %s")
        stl_params.append(end_date)

    stl_where = (" WHERE " + " AND ".join(stl_conditions)) if stl_conditions else ""
    query = f"""
        SELECT s.*, pt.tag_name, pt.tag_value
        FROM settlement s
        JOIN product_tag pt ON s.sku_code = pt.sku_code
        {stl_where}
    """
    merged_df = pd.read_sql(query, engine, params=stl_params)

    if merged_df.empty:
        return pd.DataFrame()

    merged_df["settlement_date"] = pd.to_datetime(merged_df["settlement_date"])

    grouped = (
        merged_df.groupby(["settlement_date", "tag_name", "tag_value"])
        .agg({"settled_qty": "sum", "settled_amount": "sum"})
        .reset_index()
    )
    grouped = grouped.sort_values(["tag_name", "tag_value", "settlement_date"])

    grouped["qty_wow"] = grouped.groupby(["tag_name", "tag_value"])["settled_qty"].pct_change()
    grouped["amount_wow"] = grouped.groupby(["tag_name", "tag_value"])["settled_amount"].pct_change()

    return grouped
