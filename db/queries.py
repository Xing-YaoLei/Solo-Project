from datetime import datetime, timedelta

import pandas as pd
from sqlalchemy import text

from db.connection import db_session


def _read_sql(query: str, params: dict | None = None) -> pd.DataFrame:
    with db_session() as session:
        result = session.execute(text(query), params or {})
        rows = result.fetchall()
        columns = result.keys()
        return pd.DataFrame(rows, columns=columns)


def get_appointments(store_id: str, start_date: datetime | None = None, end_date: datetime | None = None) -> pd.DataFrame:
    query = """
        SELECT a.*,
               cr.id AS cashier_record_id,
               cr.amount,
               cr.payment_method,
               cr.transaction_type,
               cr.transaction_time,
               cr.remark AS cashier_remark,
               rr.id AS review_id,
               rr.rating,
               rr.review_content,
               rr.review_tags,
               rr.reviewed_at
        FROM appointments a
        LEFT JOIN cashier_records cr ON cr.appointment_id = a.id
        LEFT JOIN review_records rr ON rr.appointment_id = a.id
        WHERE a.store_id = :store_id
    """
    params: dict = {"store_id": store_id}
    if start_date:
        query += " AND a.appointment_time >= :start_date"
        params["start_date"] = start_date
    if end_date:
        query += " AND a.appointment_time <= :end_date"
        params["end_date"] = end_date
    query += " ORDER BY a.appointment_time"
    return _read_sql(query, params)


def get_inventory(store_id: str) -> pd.DataFrame:
    query = """
        SELECT * FROM inventory
        WHERE store_id = :store_id
        ORDER BY service_item, sku
    """
    return _read_sql(query, {"store_id": store_id})


def get_cashier_records(store_id: str, start_date: datetime | None = None, end_date: datetime | None = None) -> pd.DataFrame:
    query = """
        SELECT cr.*, a.customer_name, a.service_item, a.appointment_time
        FROM cashier_records cr
        LEFT JOIN appointments a ON cr.appointment_id = a.id
        WHERE cr.store_id = :store_id
    """
    params: dict = {"store_id": store_id}
    if start_date:
        query += " AND cr.transaction_time >= :start_date"
        params["start_date"] = start_date
    if end_date:
        query += " AND cr.transaction_time <= :end_date"
        params["end_date"] = end_date
    query += " ORDER BY cr.transaction_time"
    return _read_sql(query, params)


def get_review_records(store_id: str, start_date: datetime | None = None, end_date: datetime | None = None) -> pd.DataFrame:
    query = """
        SELECT rr.*, a.customer_name, a.service_item, a.appointment_time
        FROM review_records rr
        LEFT JOIN appointments a ON rr.appointment_id = a.id
        WHERE rr.store_id = :store_id
    """
    params: dict = {"store_id": store_id}
    if start_date:
        query += " AND rr.reviewed_at >= :start_date"
        params["start_date"] = start_date
    if end_date:
        query += " AND rr.reviewed_at <= :end_date"
        params["end_date"] = end_date
    query += " ORDER BY rr.reviewed_at"
    return _read_sql(query, params)


def get_last_refresh_time(task_name: str = "full_refresh") -> datetime | None:
    query = """
        SELECT completed_at FROM data_refresh_log
        WHERE task_name = :task_name AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
    """
    df = _read_sql(query, {"task_name": task_name})
    if df.empty:
        return None
    return pd.Timestamp(df.iloc[0]["completed_at"]).to_pydatetime()


def get_conflict_appointments(store_id: str, date: datetime | None = None) -> pd.DataFrame:
    target_date = date or datetime.utcnow()
    query = """
        SELECT a1.id AS appointment_id_1,
               a2.id AS appointment_id_2,
               a1.staff_id,
               a1.staff_name,
               a1.appointment_time AS time_1,
               a2.appointment_time AS time_2,
               a1.end_time AS end_time_1,
               a2.end_time AS end_time_2,
               a1.customer_name AS customer_1,
               a2.customer_name AS customer_2
        FROM appointments a1
        JOIN appointments a2 ON a1.staff_id = a2.staff_id
            AND a1.store_id = a2.store_id
            AND a1.id < a2.id
            AND a1.appointment_time < a2.end_time
            AND a2.appointment_time < a1.end_time
        WHERE a1.store_id = :store_id
            AND a1.appointment_time::date = :target_date
            AND a1.status NOT IN ('cancelled')
            AND a2.status NOT IN ('cancelled')
        ORDER BY a1.appointment_time
    """
    return _read_sql(query, {"store_id": store_id, "target_date": target_date.date()})


def get_reschedule_records(store_id: str, start_date: datetime | None = None, end_date: datetime | None = None) -> pd.DataFrame:
    query = """
        SELECT * FROM appointments
        WHERE store_id = :store_id AND reschedule_count > 0
    """
    params: dict = {"store_id": store_id}
    if start_date:
        query += " AND appointment_time >= :start_date"
        params["start_date"] = start_date
    if end_date:
        query += " AND appointment_time <= :end_date"
        params["end_date"] = end_date
    query += " ORDER BY appointment_time"
    return _read_sql(query, params)


def get_attendance_summary(store_id: str, start_date: datetime | None = None, end_date: datetime | None = None) -> pd.DataFrame:
    query = """
        SELECT attendance_status,
               COUNT(*) AS count,
               DATE(appointment_time) AS date
        FROM appointments
        WHERE store_id = :store_id AND attendance_status IS NOT NULL
    """
    params: dict = {"store_id": store_id}
    if start_date:
        query += " AND appointment_time >= :start_date"
        params["start_date"] = start_date
    if end_date:
        query += " AND appointment_time <= :end_date"
        params["end_date"] = end_date
    query += " GROUP BY DATE(appointment_time), attendance_status ORDER BY date"
    return _read_sql(query, params)


def get_anomaly_reminders(store_id: str) -> pd.DataFrame:
    query = """
        SELECT * FROM appointments
        WHERE store_id = :store_id AND is_anomaly = TRUE
        ORDER BY appointment_time
    """
    return _read_sql(query, {"store_id": store_id})
