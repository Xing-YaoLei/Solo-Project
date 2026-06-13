import logging

import pandas as pd
from sqlalchemy import create_engine

from config import config
from db.models import FunnelMetric

logger = logging.getLogger(__name__)


def get_funnel_data(batch_date=None, region_code=None, start_date=None, end_date=None, limit_batch=None, offset=None):
    engine = create_engine(config.DATABASE_URL)
    conditions = []
    params = []

    if batch_date:
        conditions.append("batch_date = %s")
        params.append(batch_date)
    if region_code:
        conditions.append("region_code = %s")
        params.append(region_code)
    if start_date:
        conditions.append("batch_date >= %s")
        params.append(start_date)
    if end_date:
        conditions.append("batch_date <= %s")
        params.append(end_date)

    where_clause = (" WHERE " + " AND ".join(conditions)) if conditions else ""
    query = f"SELECT * FROM funnel_metric{where_clause} ORDER BY batch_date, region_code"

    if limit_batch is not None:
        query += " LIMIT %s"
        params.append(limit_batch)
    if offset is not None:
        query += " OFFSET %s"
        params.append(offset)

    df = pd.read_sql(query, engine, params=params)
    return df


def aggregate_funnel_by_date(start_date=None, end_date=None):
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
            SUM(total_orders) AS total_orders,
            SUM(outbound_orders) AS outbound_orders,
            SUM(delivered_orders) AS delivered_orders,
            SUM(received_orders) AS received_orders,
            SUM(settled_orders) AS settled_orders,
            AVG(fulfillment_on_time_rate) AS fulfillment_on_time_rate,
            AVG(shortage_rate) AS shortage_rate
        FROM funnel_metric
        {where_clause}
        GROUP BY batch_date
        ORDER BY batch_date
    """
    df = pd.read_sql(query, engine, params=params)
    return df


def aggregate_funnel_by_region(start_date=None, end_date=None):
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
            SUM(total_orders) AS total_orders,
            SUM(outbound_orders) AS outbound_orders,
            SUM(delivered_orders) AS delivered_orders,
            SUM(received_orders) AS received_orders,
            SUM(settled_orders) AS settled_orders,
            AVG(fulfillment_on_time_rate) AS fulfillment_on_time_rate,
            AVG(shortage_rate) AS shortage_rate
        FROM funnel_metric
        {where_clause}
        GROUP BY region_code, region_name
        ORDER BY total_orders DESC
    """
    df = pd.read_sql(query, engine, params=params)
    return df


def recalculate_funnel_metrics(batch_date=None):
    from sqlalchemy.orm import sessionmaker
    from db.models import (
        GroupBuyBatch,
        WarehouseOutbound,
        DriverTrack,
        ArrivalChecklist,
        Settlement,
    )

    engine = create_engine(config.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    query = session.query(GroupBuyBatch)
    if batch_date:
        query = query.filter(GroupBuyBatch.batch_date == batch_date)
    batches = query.all()

    count = 0
    for gbb in batches:
        wo_count = session.query(WarehouseOutbound).filter_by(batch_no=gbb.batch_no).count()
        dt_count = session.query(DriverTrack).filter_by(batch_no=gbb.batch_no).count()
        received = (
            session.query(ArrivalChecklist)
            .filter_by(batch_no=gbb.batch_no, qty_shortage=0)
            .count()
        )
        settled = session.query(Settlement).filter_by(batch_no=gbb.batch_no).count()

        on_time = (
            session.query(DriverTrack)
            .filter_by(batch_no=gbb.batch_no, is_on_time=True)
            .count()
        )
        all_dt = session.query(DriverTrack).filter_by(batch_no=gbb.batch_no).count()
        on_time_rate = on_time / max(all_dt, 1)

        shortage_rec = (
            session.query(ArrivalChecklist)
            .filter(ArrivalChecklist.batch_no == gbb.batch_no, ArrivalChecklist.qty_shortage > 0)
            .count()
        )
        all_acl = session.query(ArrivalChecklist).filter_by(batch_no=gbb.batch_no).count()
        shortage_rate = shortage_rec / max(all_acl, 1)

        fm = (
            session.query(FunnelMetric)
            .filter_by(batch_no=gbb.batch_no)
            .first()
        )
        if fm:
            fm.total_orders = gbb.total_orders
            fm.outbound_orders = wo_count
            fm.delivered_orders = dt_count
            fm.received_orders = received
            fm.settled_orders = settled
            fm.fulfillment_on_time_rate = round(on_time_rate, 4)
            fm.shortage_rate = round(shortage_rate, 4)
        else:
            fm = FunnelMetric(
                batch_date=gbb.batch_date,
                region_code=gbb.region_code,
                region_name=gbb.region_name,
                batch_no=gbb.batch_no,
                total_orders=gbb.total_orders,
                outbound_orders=wo_count,
                delivered_orders=dt_count,
                received_orders=received,
                settled_orders=settled,
                fulfillment_on_time_rate=round(on_time_rate, 4),
                shortage_rate=round(shortage_rate, 4),
            )
            session.add(fm)
        count += 1

    session.commit()
    session.close()
    logger.info(f"Recalculated {count} funnel metrics.")
    return count
