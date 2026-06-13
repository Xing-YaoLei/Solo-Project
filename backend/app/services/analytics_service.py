from datetime import datetime, timedelta
from typing import List, Dict, Optional
import duckdb
from ..db.duckdb_conn import get_duckdb_connection


def get_renewal_funnel(start_date: str = None, end_date: str = None, coach_id: int = None) -> List[Dict]:
    con = get_duckdb_connection()

    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")
    if not start_date:
        start_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")

    coach_filter = ""
    params = [start_date, end_date]

    if coach_id:
        coach_filter = "AND coach_id = ?"
        params.append(coach_id)

    total_members = con.execute(f"""
        SELECT COUNT(DISTINCT member_id) as cnt
        FROM dim_member
        WHERE status = 'active'
        AND join_date <= ?
        {coach_filter}
    """, [end_date, coach_id] if coach_id else [end_date]).fetchone()[0]

    active_members = con.execute(f"""
        SELECT COUNT(DISTINCT f.member_id) as cnt
        FROM fact_access f
        JOIN dim_member m ON f.member_id = m.member_id
        WHERE f.access_date BETWEEN ? AND ?
        AND f.is_success = 1
        {coach_filter}
    """, params + ([coach_id] if coach_id else [])).fetchone()[0]

    expiring_members = con.execute(f"""
        SELECT COUNT(DISTINCT member_id) as cnt
        FROM dim_membership
        WHERE end_date BETWEEN ? AND ?
        AND status = 'active'
        {coach_filter}
    """, params + ([coach_id] if coach_id else [])).fetchone()[0]

    contacted_members = con.execute(f"""
        SELECT COUNT(DISTINCT member_id) as cnt
        FROM fact_renewal_note
        WHERE source = 'expiry_warning'
        AND created_at BETWEEN ?::timestamp AND ?::timestamp
    """, params).fetchone()[0]

    renewed_members = con.execute(f"""
        SELECT COUNT(DISTINCT member_id) as cnt
        FROM fact_transaction
        WHERE type = 'renewal'
        AND status = 'success'
        AND transaction_date_date BETWEEN ? AND ?
    """, params).fetchone()[0]

    con.close()

    funnel_stages = [
        {"stage": "total_members", "name": "总会员数", "value": total_members, "conversion_rate": 100.0},
        {"stage": "active_members", "name": "活跃会员", "value": active_members,
         "conversion_rate": round(active_members / total_members * 100, 2) if total_members > 0 else 0},
        {"stage": "expiring_members", "name": "即将到期", "value": expiring_members,
         "conversion_rate": round(expiring_members / active_members * 100, 2) if active_members > 0 else 0},
        {"stage": "contacted_members", "name": "已触达会员", "value": contacted_members,
         "conversion_rate": round(contacted_members / expiring_members * 100, 2) if expiring_members > 0 else 0},
        {"stage": "renewed_members", "name": "已续费会员", "value": renewed_members,
         "conversion_rate": round(renewed_members / contacted_members * 100, 2) if contacted_members > 0 else 0},
    ]

    return funnel_stages


def get_renewal_rate_trend(days: int = 30) -> List[Dict]:
    con = get_duckdb_connection()

    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days)

    data = con.execute("""
        SELECT
            transaction_date_date as stat_date,
            COUNT(DISTINCT CASE WHEN type = 'renewal' AND status = 'success' THEN member_id END) as renewed_count,
            COUNT(DISTINCT CASE WHEN type IN ('purchase', 'renewal') AND status = 'success' THEN member_id END) as total_count
        FROM fact_transaction
        WHERE transaction_date_date BETWEEN ? AND ?
        GROUP BY transaction_date_date
        ORDER BY transaction_date_date
    """, [start_date, end_date]).fetchall()

    con.close()

    result = []
    for row in data:
        stat_date, renewed, total = row
        rate = round(renewed / total * 100, 2) if total > 0 else 0
        result.append({
            "date": str(stat_date),
            "renewed_count": renewed,
            "total_count": total,
            "renewal_rate": rate
        })

    return result


def get_refund_reason_distribution(start_date: str = None, end_date: str = None) -> List[Dict]:
    con = get_duckdb_connection()

    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")
    if not start_date:
        start_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")

    data = con.execute("""
        SELECT
            reason,
            COUNT(*) as count,
            SUM(actual_refund_amount) as total_amount,
            SUM(refund_sessions) as total_sessions
        FROM fact_refund
        WHERE apply_date_date BETWEEN ? AND ?
        AND status IN ('approved', 'completed')
        GROUP BY reason
        ORDER BY count DESC
    """, [start_date, end_date]).fetchall()

    con.close()

    reason_names = {
        "injury": "受伤原因",
        "move_away": "搬家/距离远",
        "dissatisfied": "服务不满",
        "coach_change": "教练变动",
        "price_reason": "价格原因",
        "time_conflict": "时间冲突",
        "health_reason": "健康原因",
        "other": "其他原因"
    }

    result = []
    total_count = sum(row[1] for row in data)
    for row in data:
        reason, count, amount, sessions = row
        result.append({
            "reason": reason,
            "name": reason_names.get(reason, reason),
            "count": count,
            "percentage": round(count / total_count * 100, 2) if total_count > 0 else 0,
            "total_amount": round(amount, 2),
            "total_sessions": sessions
        })

    return result


def get_coach_renewal_ranking(start_date: str = None, end_date: str = None) -> List[Dict]:
    con = get_duckdb_connection()

    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")
    if not start_date:
        start_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")

    data = con.execute("""
        SELECT
            m.coach_id,
            m.coach_name,
            COUNT(DISTINCT m.member_id) as total_members,
            COUNT(DISTINCT CASE WHEN t.type = 'renewal' AND t.status = 'success' THEN t.member_id END) as renewed_members,
            SUM(CASE WHEN t.type = 'renewal' AND t.status = 'success' THEN t.actual_amount ELSE 0 END) as renewal_amount
        FROM dim_member m
        LEFT JOIN fact_transaction t ON m.member_id = t.member_id
            AND t.transaction_date_date BETWEEN ? AND ?
        WHERE m.coach_id IS NOT NULL
        GROUP BY m.coach_id, m.coach_name
        ORDER BY renewal_amount DESC
    """, [start_date, end_date]).fetchall()

    con.close()

    result = []
    for row in data:
        coach_id, coach_name, total, renewed, amount = row
        result.append({
            "coach_id": coach_id,
            "coach_name": coach_name,
            "total_members": total,
            "renewed_members": renewed,
            "renewal_rate": round(renewed / total * 100, 2) if total > 0 else 0,
            "renewal_amount": round(amount, 2)
        })

    return result


def get_expiring_members_list(days: int = 30, page: int = 1, page_size: int = 20) -> Dict:
    con = get_duckdb_connection()

    end_date = datetime.now().date() + timedelta(days=days)
    start_date = datetime.now().date()
    offset = (page - 1) * page_size

    total = con.execute("""
        SELECT COUNT(DISTINCT m.member_id) as cnt
        FROM dim_membership ms
        JOIN dim_member m ON ms.member_id = m.member_id
        WHERE ms.end_date BETWEEN ? AND ?
        AND ms.status = 'active'
    """, [start_date, end_date]).fetchone()[0]

    data = con.execute("""
        SELECT
            m.member_id,
            m.member_no,
            m.name,
            m.phone,
            m.level,
            m.coach_name,
            ms.membership_no,
            ms.name as membership_name,
            ms.remaining_sessions,
            ms.end_date,
            CAST(?::date - ms.end_date AS INTEGER) * -1 as days_remaining
        FROM dim_membership ms
        JOIN dim_member m ON ms.member_id = m.member_id
        WHERE ms.end_date BETWEEN ? AND ?
        AND ms.status = 'active'
        ORDER BY days_remaining ASC
        LIMIT ? OFFSET ?
    """, [end_date, start_date, end_date, page_size, offset]).fetchall()

    con.close()

    members = []
    for row in data:
        member_id, member_no, name, phone, level, coach_name, membership_no, membership_name, remaining_sessions, end_date, days_remaining = row
        members.append({
            "member_id": member_id,
            "member_no": member_no,
            "name": name,
            "phone": phone,
            "level": level,
            "coach_name": coach_name,
            "membership_no": membership_no,
            "membership_name": membership_name,
            "remaining_sessions": remaining_sessions,
            "end_date": str(end_date),
            "days_remaining": days_remaining
        })

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": members
    }


def get_verification_records(member_id: int = None, start_date: str = None, end_date: str = None,
                             page: int = 1, page_size: int = 20) -> Dict:
    con = get_duckdb_connection()

    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")
    if not start_date:
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

    conditions = ["verify_date BETWEEN ? AND ?"]
    params = [start_date, end_date]

    if member_id:
        conditions.append("member_id = ?")
        params.append(member_id)

    where_clause = " AND ".join(conditions)

    total = con.execute(f"""
        SELECT COUNT(*) FROM fact_course_record WHERE {where_clause}
    """, params).fetchone()[0]

    offset = (page - 1) * page_size

    data = con.execute(f"""
        SELECT
            record_id,
            record_no,
            member_id,
            membership_id,
            course_id,
            verification_type,
            consume_sessions,
            verify_time,
            verify_date,
            operator_name,
            device_location
        FROM fact_course_record
        WHERE {where_clause}
        ORDER BY verify_time DESC
        LIMIT ? OFFSET ?
    """, params + [page_size, offset]).fetchall()

    con.close()

    records = []
    type_names = {"course": "课程核销", "access": "门禁核销", "manual": "手动核销"}
    for row in data:
        record_id, record_no, mem_id, membership_id, course_id, vtype, sessions, vtime, vdate, op_name, location = row
        records.append({
            "record_id": record_id,
            "record_no": record_no,
            "member_id": mem_id,
            "membership_id": membership_id,
            "course_id": course_id,
            "verification_type": vtype,
            "verification_type_name": type_names.get(vtype, vtype),
            "consume_sessions": sessions,
            "verify_time": str(vtime) if vtime else None,
            "verify_date": str(vdate) if vdate else None,
            "operator_name": op_name,
            "device_location": location
        })

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": records
    }
