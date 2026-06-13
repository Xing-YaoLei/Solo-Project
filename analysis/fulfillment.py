import logging

import pandas as pd
from sqlalchemy import create_engine

from config import config

logger = logging.getLogger(__name__)


def get_fulfillment_rate_by_date(start_date=None, end_date=None):
    engine = create_engine(config.DATABASE_URL)
    conditions = []
    params = []
    if start_date:
        conditions.append("batch_date >= %s")
        params.append(start_date)
    if end_date:
        conditions.append("batch_date <= %s")
        params.append(end_date)

    where_clause = (" WHERE " + " AND ".join(conditions)) if conditions else ""
    query = f"""
        SELECT
            batch_date,
            AVG(fulfillment_on_time_rate) AS avg_on_time_rate,
            COUNT(*) AS batch_count,
            SUM(total_orders) AS total_orders
        FROM funnel_metric
        {where_clause}
        GROUP BY batch_date
        ORDER BY batch_date
    """
    df = pd.read_sql(query, engine, params=params)
    return df


def get_fulfillment_rate_by_region(start_date=None, end_date=None):
    engine = create_engine(config.DATABASE_URL)
    conditions = []
    params = []
    if start_date:
        conditions.append("batch_date >= %s")
        params.append(start_date)
    if end_date:
        conditions.append("batch_date <= %s")
        params.append(end_date)

    where_clause = (" WHERE " + " AND ".join(conditions)) if conditions else ""
    query = f"""
        SELECT
            region_code,
            region_name,
            AVG(fulfillment_on_time_rate) AS avg_on_time_rate,
            COUNT(*) AS batch_count,
            SUM(total_orders) AS total_orders
        FROM funnel_metric
        {where_clause}
        GROUP BY region_code, region_name
        ORDER BY avg_on_time_rate DESC
    """
    df = pd.read_sql(query, engine, params=params)
    return df


def get_fulfillment_detail(batch_no=None, region_code=None, start_date=None, end_date=None):
    engine = create_engine(config.DATABASE_URL)
    conditions = []
    params = []
    if batch_no:
        conditions.append("dt.batch_no = %s")
        params.append(batch_no)
    if region_code:
        conditions.append("gb.region_code = %s")
        params.append(region_code)
    if start_date:
        conditions.append("gb.batch_date >= %s")
        params.append(start_date)
    if end_date:
        conditions.append("gb.batch_date <= %s")
        params.append(end_date)

    where_clause = (" WHERE " + " AND ".join(conditions)) if conditions else ""
    query = f"""
        SELECT
            dt.*,
            gb.batch_date,
            gb.region_code,
            gb.region_name,
            gb.community_name,
            gb.expected_arrival_time,
            gb.actual_arrival_time,
            CASE
                WHEN gb.actual_arrival_time <= gb.expected_arrival_time THEN true
                ELSE false
            END AS is_batch_on_time
        FROM driver_track dt
        JOIN group_buy_batch gb ON dt.batch_no = gb.batch_no
        {where_clause}
        ORDER BY gb.batch_date, dt.batch_no, dt.route_stop_seq
    """
    df = pd.read_sql(query, engine, params=params)
    return df
