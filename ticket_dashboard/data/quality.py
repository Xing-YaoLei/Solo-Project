import pandas as pd
from datetime import date, datetime, timedelta
from sqlalchemy import text
from ticket_dashboard.db.session import SessionLocal
from ticket_dashboard.db.models import DataQualityFlag
from ticket_dashboard.config import config


def detect_camera_delay(target_date=None, scenic_area_id=None):
    if target_date is None:
        target_date = date.today()

    sql = """
        SELECT scenic_area_id,
               MAX(EXTRACT(EPOCH FROM (now() - updated_at))) AS delay_seconds
        FROM ticket_reservation
        WHERE reservation_date = :target_date
        GROUP BY scenic_area_id
    """
    params = {"target_date": target_date}
    if scenic_area_id:
        sql += " HAVING scenic_area_id = :area_id"
        params["area_id"] = scenic_area_id

    with SessionLocal() as session:
        df = pd.read_sql(text(sql), session.bind, params=params)

    flags = []
    threshold = config.CAMERA_DELAY_THRESHOLD
    with SessionLocal() as session:
        for _, row in df.iterrows():
            delay_sec = row["delay_seconds"] or 0
            if delay_sec > threshold:
                flag = DataQualityFlag(
                    flag_date=target_date,
                    scenic_area_id=row["scenic_area_id"],
                    flag_type="camera_delay",
                    flag_detail={
                        "delay_seconds": float(delay_sec),
                        "threshold_seconds": threshold,
                        "message": f"摄像头统计延迟 {delay_sec:.0f} 秒，超过阈值 {threshold} 秒",
                    },
                )
                session.add(flag)
                flags.append({
                    "scenic_area_id": row["scenic_area_id"],
                    "delay_seconds": delay_sec,
                    "flag_type": "camera_delay",
                })
        session.commit()

    return flags


def detect_merchant_gap(target_date=None, scenic_area_id=None):
    if target_date is None:
        target_date = date.today()

    sql = """
        WITH ranked AS (
            SELECT scenic_area_id, channel, created_at,
                   LAG(created_at) OVER (PARTITION BY scenic_area_id, channel ORDER BY created_at) AS prev_created
            FROM ticket_reservation
            WHERE reservation_date = :target_date
        )
        SELECT scenic_area_id, channel,
               MAX(EXTRACT(EPOCH FROM (created_at - prev_created)) / 60) AS max_gap_minutes
        FROM ranked
        WHERE prev_created IS NOT NULL
        GROUP BY scenic_area_id, channel
    """
    params = {"target_date": target_date}
    if scenic_area_id:
        sql = sql.replace(
            "GROUP BY scenic_area_id, channel",
            "HAVING scenic_area_id = :area_id GROUP BY scenic_area_id, channel",
        )
        params["area_id"] = scenic_area_id

    with SessionLocal() as session:
        df = pd.read_sql(text(sql), session.bind, params=params)

    flags = []
    threshold = config.MERCHANT_GAP_THRESHOLD
    with SessionLocal() as session:
        for _, row in df.iterrows():
            gap_min = row["max_gap_minutes"] or 0
            if gap_min > threshold:
                flag = DataQualityFlag(
                    flag_date=target_date,
                    scenic_area_id=row["scenic_area_id"],
                    flag_type="merchant_gap",
                    flag_detail={
                        "max_gap_minutes": float(gap_min),
                        "channel": row["channel"],
                        "threshold_minutes": threshold,
                        "message": f"商户流水缺失，最大间隔 {gap_min:.0f} 分钟（渠道: {row['channel']}），超过阈值 {threshold} 分钟",
                    },
                )
                session.add(flag)
                flags.append({
                    "scenic_area_id": row["scenic_area_id"],
                    "max_gap_minutes": gap_min,
                    "channel": row["channel"],
                    "flag_type": "merchant_gap",
                })
        session.commit()

    return flags


def detect_gate_caliber_change(target_date=None, scenic_area_id=None):
    if target_date is None:
        target_date = date.today()

    comparison_date = target_date - timedelta(days=7)

    sql = """
        SELECT
            cur.scenic_area_id,
            cur.reservation_date AS cur_date,
            cur.checked_in_count AS cur_checkin,
            prev.checked_in_count AS prev_checkin,
            prev.reservation_date AS prev_date
        FROM ticket_reservation cur
        JOIN ticket_reservation prev
            ON cur.scenic_area_id = prev.scenic_area_id
            AND cur.time_slot_start = prev.time_slot_start
            AND cur.time_slot_end = prev.time_slot_end
            AND cur.ticket_type = prev.ticket_type
        WHERE cur.reservation_date = :target_date
          AND prev.reservation_date = :compare_date
    """
    params = {"target_date": target_date, "compare_date": comparison_date}
    if scenic_area_id:
        sql += " AND cur.scenic_area_id = :area_id"
        params["area_id"] = scenic_area_id

    with SessionLocal() as session:
        df = pd.read_sql(text(sql), session.bind, params=params)

    flags = []
    sensitivity = config.GATE_CALIBER_CHANGE_SENSITIVITY

    if not df.empty:
        df["change_ratio"] = (df["cur_checkin"] - df["prev_checkin"]) / df["prev_checkin"].replace(0, 1)
        anomalies = df[df["change_ratio"].abs() > sensitivity]

        with SessionLocal() as session:
            for _, row in anomalies.iterrows():
                flag = DataQualityFlag(
                    flag_date=target_date,
                    scenic_area_id=row["scenic_area_id"],
                    flag_type="gate_caliber_change",
                    flag_detail={
                        "change_ratio": float(row["change_ratio"]),
                        "current_checkin": int(row["cur_checkin"]),
                        "previous_checkin": int(row["prev_checkin"]),
                        "previous_date": str(row["prev_date"]),
                        "sensitivity": sensitivity,
                        "message": f"闸机数据口径变化，签到变化率 {row['change_ratio']:.1%}（对比 {row['prev_date']}），超过敏感度 {sensitivity:.0%}",
                    },
                )
                session.add(flag)
                flags.append({
                    "scenic_area_id": row["scenic_area_id"],
                    "change_ratio": row["change_ratio"],
                    "flag_type": "gate_caliber_change",
                })
            session.commit()

    return flags


def run_all_quality_checks(target_date=None, scenic_area_id=None):
    if target_date is None:
        target_date = date.today()

    camera_flags = detect_camera_delay(target_date, scenic_area_id)
    merchant_flags = detect_merchant_gap(target_date, scenic_area_id)
    gate_flags = detect_gate_caliber_change(target_date, scenic_area_id)

    return {
        "target_date": str(target_date),
        "camera_delay": camera_flags,
        "merchant_gap": merchant_flags,
        "gate_caliber_change": gate_flags,
        "total_flags": len(camera_flags) + len(merchant_flags) + len(gate_flags),
    }
