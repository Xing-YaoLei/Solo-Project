import logging

import pandas as pd
from sqlalchemy import create_engine

from config import config

logger = logging.getLogger(__name__)


def get_shortage_overview(start_date=None, end_date=None, region_code=None):
    engine = create_engine(config.DATABASE_URL)
    conditions = ["qty_shortage > 0"]
    params = []
    if start_date:
        conditions.append("check_time >= %s")
        params.append(start_date)
    if end_date:
        conditions.append("check_time <= %s")
        params.append(end_date)
    if region_code:
        conditions.append("region_code = %s")
        params.append(region_code)

    where_clause = " WHERE " + " AND ".join(conditions)
    query = f"""
        SELECT
            DATE(check_time) AS check_date,
            region_code,
            community_name,
            sku_code,
            sku_name,
            SUM(qty_expected) AS total_expected,
            SUM(qty_received) AS total_received,
            SUM(qty_shortage) AS total_shortage,
            COUNT(*) AS shortage_count,
            SUM(CASE WHEN is_resolved THEN 1 ELSE 0 END) AS resolved_count,
            SUM(CASE WHEN NOT is_resolved THEN 1 ELSE 0 END) AS unresolved_count
        FROM arrival_checklist
        {where_clause}
        GROUP BY DATE(check_time), region_code, community_name, sku_code, sku_name
        ORDER BY check_date, total_shortage DESC
    """
    df = pd.read_sql(query, engine, params=params)
    return df


def get_shortage_sample_records(
    sku_code=None, region_code=None, batch_no=None, start_date=None, end_date=None, limit=50
):
    engine = create_engine(config.DATABASE_URL)
    conditions = ["qty_shortage > 0"]
    params = []
    if sku_code:
        conditions.append("sku_code = %s")
        params.append(sku_code)
    if region_code:
        conditions.append("region_code = %s")
        params.append(region_code)
    if batch_no:
        conditions.append("batch_no = %s")
        params.append(batch_no)
    if start_date:
        conditions.append("check_time >= %s")
        params.append(start_date)
    if end_date:
        conditions.append("check_time <= %s")
        params.append(end_date)

    where_clause = " WHERE " + " AND ".join(conditions)
    query = f"""
        SELECT
            checklist_no,
            batch_no,
            sku_code,
            sku_name,
            qty_expected,
            qty_received,
            qty_shortage,
            shortage_reason,
            handler,
            is_resolved,
            check_time,
            region_code,
            community_name
        FROM arrival_checklist
        {where_clause}
        ORDER BY qty_shortage DESC
        LIMIT %s
    """
    params.append(limit)
    df = pd.read_sql(query, engine, params=params)
    return df


def get_arrival_checklist_for_batch(batch_no):
    engine = create_engine(config.DATABASE_URL)
    query = """
        SELECT
            checklist_no,
            batch_no,
            sku_code,
            sku_name,
            qty_expected,
            qty_received,
            qty_shortage,
            shortage_reason,
            handler,
            is_resolved,
            check_time,
            region_code,
            community_name
        FROM arrival_checklist
        WHERE batch_no = %s
        ORDER BY qty_shortage DESC
    """
    df = pd.read_sql(query, engine, params=[batch_no])
    return df
