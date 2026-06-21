import pandas as pd
from datetime import date, datetime, timedelta
from sqlalchemy import text
from ticket_dashboard.db.session import SessionLocal
from ticket_dashboard.config import config


def load_reservation_data(scenic_area_id=None, start_date=None, end_date=None):
    sql = """
        SELECT
            r.id, r.scenic_area_id, r.scenic_area_name, r.ticket_type,
            r.reservation_date, r.time_slot_start, r.time_slot_end,
            r.reserved_count, r.checked_in_count, r.cancelled_count,
            r.channel, r.created_at, r.updated_at
        FROM ticket_reservation r
        WHERE 1=1
    """
    params = {}
    if scenic_area_id:
        sql += " AND r.scenic_area_id = :area_id"
        params["area_id"] = scenic_area_id
    if start_date:
        sql += " AND r.reservation_date >= :start_date"
        params["start_date"] = start_date
    if end_date:
        sql += " AND r.reservation_date <= :end_date"
        params["end_date"] = end_date
    sql += " ORDER BY r.reservation_date, r.time_slot_start"

    with SessionLocal() as session:
        df = pd.read_sql(text(sql), session.bind, params=params)
    return df


def load_capacity_data(scenic_area_id=None, start_date=None, end_date=None):
    sql = """
        SELECT
            c.id, c.scenic_area_id, c.effective_date,
            c.time_slot_start, c.time_slot_end,
            c.max_capacity, c.overflow_capacity,
            c.capacity_rule_name, c.is_active
        FROM time_slot_capacity c
        WHERE 1=1
    """
    params = {}
    if scenic_area_id:
        sql += " AND c.scenic_area_id = :area_id"
        params["area_id"] = scenic_area_id
    if start_date:
        sql += " AND c.effective_date >= :start_date"
        params["start_date"] = start_date
    if end_date:
        sql += " AND c.effective_date <= :end_date"
        params["end_date"] = end_date
    sql += " ORDER BY c.effective_date, c.time_slot_start"

    with SessionLocal() as session:
        df = pd.read_sql(text(sql), session.bind, params=params)
    return df


def load_conflict_data(scenic_area_id=None, start_date=None, end_date=None):
    sql = """
        SELECT
            sc.id, sc.scenic_area_id, sc.conflict_date,
            sc.conflict_time_start, sc.conflict_time_end,
            sc.conflict_type, sc.affected_reservation_ids,
            sc.description, sc.severity, sc.resolved,
            sc.review_note, sc.created_at, sc.resolved_at
        FROM slot_conflict sc
        WHERE 1=1
    """
    params = {}
    if scenic_area_id:
        sql += " AND sc.scenic_area_id = :area_id"
        params["area_id"] = scenic_area_id
    if start_date:
        sql += " AND sc.conflict_date >= :start_date"
        params["start_date"] = start_date
    if end_date:
        sql += " AND sc.conflict_date <= :end_date"
        params["end_date"] = end_date
    sql += " ORDER BY sc.conflict_date, sc.conflict_time_start"

    with SessionLocal() as session:
        df = pd.read_sql(text(sql), session.bind, params=params)
    return df


def load_quality_flags(flag_date=None, scenic_area_id=None, flag_type=None, active_only=True):
    sql = """
        SELECT
            dqf.id, dqf.flag_date, dqf.scenic_area_id,
            dqf.flag_type, dqf.flag_detail, dqf.is_active,
            dqf.detected_at, dqf.cleared_at
        FROM data_quality_flag dqf
        WHERE 1=1
    """
    params = {}
    if flag_date:
        sql += " AND dqf.flag_date = :flag_date"
        params["flag_date"] = flag_date
    if scenic_area_id:
        sql += " AND dqf.scenic_area_id = :area_id"
        params["area_id"] = scenic_area_id
    if flag_type:
        sql += " AND dqf.flag_type = :flag_type"
        params["flag_type"] = flag_type
    if active_only:
        sql += " AND dqf.is_active = TRUE"
    sql += " ORDER BY dqf.flag_date DESC, dqf.detected_at DESC"

    with SessionLocal() as session:
        df = pd.read_sql(text(sql), session.bind, params=params)
    return df


def load_review_notes(scenic_area_id=None, note_date=None):
    sql = """
        SELECT
            rn.id, rn.scenic_area_id, rn.note_date,
            rn.time_slot_start, rn.time_slot_end,
            rn.anomaly_flag_id, rn.note_content, rn.author, rn.created_at
        FROM review_note rn
        WHERE 1=1
    """
    params = {}
    if scenic_area_id:
        sql += " AND rn.scenic_area_id = :area_id"
        params["area_id"] = scenic_area_id
    if note_date:
        sql += " AND rn.note_date = :note_date"
        params["note_date"] = note_date
    sql += " ORDER BY rn.note_date DESC, rn.time_slot_start"

    with SessionLocal() as session:
        df = pd.read_sql(text(sql), session.bind, params=params)
    return df


def load_attendance_rules(scenic_area_id=None):
    sql = """
        SELECT
            ar.id, ar.scenic_area_id, ar.rule_name,
            ar.numerator_source, ar.denominator_source,
            ar.adjustment_factor, ar.description,
            ar.is_active, ar.effective_from, ar.effective_to
        FROM attendance_rate_rule ar
        WHERE ar.is_active = TRUE
    """
    params = {}
    if scenic_area_id:
        sql += " AND ar.scenic_area_id = :area_id"
        params["area_id"] = scenic_area_id

    with SessionLocal() as session:
        df = pd.read_sql(text(sql), session.bind, params=params)
    return df


def compute_attendance_rate(reservation_df, rules_df):
    if reservation_df.empty:
        reservation_df["attendance_rate"] = None
        return reservation_df

    if rules_df.empty:
        reservation_df["attendance_rate"] = (
            reservation_df["checked_in_count"] / reservation_df["reserved_count"].replace(0, 1)
        )
        reservation_df["attendance_rate_rule"] = "default:checked_in/reserved"
        return reservation_df

    reservation_df["attendance_rate"] = None
    reservation_df["attendance_rate_rule"] = None

    for _, rule in rules_df.iterrows():
        mask = pd.Series(True, index=reservation_df.index)
        if rule.get("effective_from") and not pd.isna(rule.get("effective_from")):
            mask &= reservation_df["reservation_date"] >= rule["effective_from"]
        if rule.get("effective_to") and not pd.isna(rule.get("effective_to")):
            mask &= reservation_df["reservation_date"] <= rule["effective_to"]

        num_col = rule["numerator_source"]
        den_col = rule["denominator_source"]
        factor = rule["adjustment_factor"]

        if num_col in reservation_df.columns and den_col in reservation_df.columns:
            denom = reservation_df.loc[mask, den_col].replace(0, 1)
            reservation_df.loc[mask, "attendance_rate"] = (
                reservation_df.loc[mask, num_col] / denom * factor
            )
            reservation_df.loc[mask, "attendance_rate_rule"] = rule["rule_name"]

    unmatched = reservation_df["attendance_rate"].isna()
    if unmatched.any():
        reservation_df.loc[unmatched, "attendance_rate"] = (
            reservation_df.loc[unmatched, "checked_in_count"]
            / reservation_df.loc[unmatched, "reserved_count"].replace(0, 1)
        )
        reservation_df.loc[unmatched, "attendance_rate_rule"] = "default:checked_in/reserved"

    return reservation_df
