from datetime import datetime, date, timedelta
from typing import List, Dict, Optional, Any
from ..db.duckdb_conn import get_duckdb_connection
import uuid


def _fetch_all(cursor):
    rows = cursor.fetchall()
    cols = [d[0] for d in cursor.description] if cursor.description else []
    return cols, rows


def row_to_dict(columns, row):
    return dict(zip(columns, row))


def rows_to_dicts(columns, rows):
    return [row_to_dict(columns, r) for r in rows]


# ================ 阈值相关 ================

def list_thresholds() -> List[Dict]:
    con = get_duckdb_connection()
    cols, rows = _fetch_all(con.execute("""
        SELECT id, threshold_type, threshold_name, threshold_value, threshold_unit,
               description, is_enabled, created_by, updated_by, created_at, updated_at
        FROM warning_thresholds ORDER BY id ASC
    """))
    result = rows_to_dicts(cols, rows)
    con.close()
    return result


def get_threshold(threshold_id: int) -> Optional[Dict]:
    con = get_duckdb_connection()
    cols, rows = _fetch_all(con.execute("""
        SELECT id, threshold_type, threshold_name, threshold_value, threshold_unit,
               description, is_enabled, created_by, updated_by, created_at, updated_at
        FROM warning_thresholds WHERE id = ?
    """, [threshold_id]))
    con.close()
    return rows_to_dicts(cols, rows)[0] if rows else None


def get_threshold_by_type(threshold_type: str) -> Optional[Dict]:
    con = get_duckdb_connection()
    cols, rows = _fetch_all(con.execute("""
        SELECT id, threshold_type, threshold_name, threshold_value, threshold_unit,
               description, is_enabled, created_by, updated_by, created_at, updated_at
        FROM warning_thresholds WHERE threshold_type = ?
    """, [threshold_type]))
    con.close()
    return rows_to_dicts(cols, rows)[0] if rows else None


def create_threshold(data: Dict) -> Dict:
    con = get_duckdb_connection()
    now = datetime.now()
    result = con.execute("""
        INSERT INTO warning_thresholds
        (threshold_type, threshold_name, threshold_value, threshold_unit,
         description, is_enabled, created_by, updated_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
    """, [
        data["threshold_type"], data["threshold_name"], data["threshold_value"],
        data.get("threshold_unit", "天"), data.get("description"),
        data.get("is_enabled", 1), data.get("created_by"),
        data.get("created_by"), now, now
    ])
    cols, rows = _fetch_all(result)
    new_item = rows_to_dicts(cols, rows)[0]

    con.execute("""
        INSERT INTO threshold_audit_logs
        (threshold_id, threshold_type, new_value, new_name,
         operator_name, operation_type, remark, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        new_item["id"], new_item["threshold_type"], new_item["threshold_value"],
        new_item["threshold_name"], data.get("created_by", "system"),
        "create", data.get("remark", "创建阈值配置"), now
    ])
    con.close()
    return new_item


def update_threshold(threshold_id: int, data: Dict) -> Optional[Dict]:
    con = get_duckdb_connection()
    current = get_threshold(threshold_id)
    if not current:
        con.close()
        return None

    now = datetime.now()
    old_value = current["threshold_value"]
    old_name = current["threshold_name"]

    updates = []
    params = []
    for field in ["threshold_name", "threshold_value", "threshold_unit",
                  "description", "is_enabled"]:
        if field in data and data[field] is not None:
            updates.append(f"{field} = ?")
            params.append(data[field])

    updates.append("updated_by = ?")
    params.append(data.get("updated_by", current.get("updated_by")))
    updates.append("updated_at = ?")
    params.append(now)
    params.append(threshold_id)

    if updates:
        con.execute(f"""
            UPDATE warning_thresholds SET {', '.join(updates)} WHERE id = ?
        """, params)

    updated = get_threshold(threshold_id)
    new_value = updated["threshold_value"]
    new_name = updated["threshold_name"]

    if old_value != new_value or old_name != new_name:
        con.execute("""
            INSERT INTO threshold_audit_logs
            (threshold_id, threshold_type, old_value, new_value, old_name, new_name,
             operator_name, operation_type, remark, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            threshold_id, current["threshold_type"], old_value, new_value,
            old_name, new_name, data.get("updated_by", "system"),
            "update", data.get("remark", "更新阈值配置"), now
        ])

    con.close()
    return updated


def list_threshold_audit_logs(threshold_id: int = None, threshold_type: str = None,
                              page: int = 1, page_size: int = 20) -> List[Dict]:
    con = get_duckdb_connection()
    conditions = []
    params = []
    if threshold_id:
        conditions.append("threshold_id = ?")
        params.append(threshold_id)
    if threshold_type:
        conditions.append("threshold_type = ?")
        params.append(threshold_type)

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    offset = (page - 1) * page_size

    cols, rows = _fetch_all(con.execute(f"""
        SELECT id, threshold_id, threshold_type, old_value, new_value,
               old_name, new_name, operator_name, operator_id,
               operation_type, remark, created_at
        FROM threshold_audit_logs {where}
        ORDER BY created_at DESC LIMIT ? OFFSET ?
    """, params + [page_size, offset]))
    con.close()
    return rows_to_dicts(cols, rows)


# ================ 备注任务相关 ================

def _generate_note_no():
    return f"NOTE{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"


def list_notes(member_id: int = None, status: str = None, source: str = None,
               related_funnel_stage: str = None, page: int = 1, page_size: int = 50) -> Dict:
    con = get_duckdb_connection()
    conditions = []
    params = []
    if member_id:
        conditions.append("member_id = ?")
        params.append(member_id)
    if status:
        conditions.append("status = ?")
        params.append(status)
    if source:
        conditions.append("source = ?")
        params.append(source)
    if related_funnel_stage:
        conditions.append("related_funnel_stage = ?")
        params.append(related_funnel_stage)

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    offset = (page - 1) * page_size

    total = con.execute(f"SELECT COUNT(*) FROM fact_renewal_note {where}", params).fetchone()[0]
    cols, rows = _fetch_all(con.execute(f"""
        SELECT note_id, note_no, member_id, membership_id, source, title, content,
               conclusion, status, priority, due_date, assignee_id, assignee_name,
               created_by_id, created_by_name, resolved_by_id, resolved_by_name,
               resolved_at, related_funnel_stage, related_metric, remark,
               created_at, updated_at
        FROM fact_renewal_note {where}
        ORDER BY CASE priority
            WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
            created_at DESC
        LIMIT ? OFFSET ?
    """, params + [page_size, offset]))
    con.close()
    items = rows_to_dicts(cols, rows)
    return {"total": total, "page": page, "page_size": page_size, "items": items}


def get_note(note_id: int) -> Optional[Dict]:
    con = get_duckdb_connection()
    cols, rows = _fetch_all(con.execute("""
        SELECT note_id, note_no, member_id, membership_id, source, title, content,
               conclusion, status, priority, due_date, assignee_id, assignee_name,
               created_by_id, created_by_name, resolved_by_id, resolved_by_name,
               resolved_at, related_funnel_stage, related_metric, remark,
               created_at, updated_at
        FROM fact_renewal_note WHERE note_id = ?
    """, [note_id]))
    con.close()
    return rows_to_dicts(cols, rows)[0] if rows else None


def create_note(data: Dict) -> Dict:
    con = get_duckdb_connection()
    now = datetime.now()
    note_no = _generate_note_no()

    cols, rows = _fetch_all(con.execute("""
        INSERT INTO fact_renewal_note
        (note_no, member_id, membership_id, source, title, content, status, priority,
         due_date, assignee_id, assignee_name, created_by_id, created_by_name,
         related_funnel_stage, related_metric, remark, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
    """, [
        note_no, data["member_id"], data.get("membership_id"),
        data.get("source", "manual"), data["title"], data["content"],
        data.get("status", "pending"), data.get("priority", "medium"),
        data.get("due_date"), data.get("assignee_id"), data.get("assignee_name"),
        data.get("created_by_id"), data.get("created_by_name", "system"),
        data.get("related_funnel_stage"), data.get("related_metric"),
        data.get("remark"), now, now
    ]))
    con.close()
    return rows_to_dicts(cols, rows)[0]


def update_note(note_id: int, data: Dict) -> Optional[Dict]:
    con = get_duckdb_connection()
    now = datetime.now()
    current = get_note(note_id)
    if not current:
        con.close()
        return None

    updates = []
    params = []
    for field in ["title", "content", "conclusion", "status", "priority",
                  "due_date", "assignee_id", "assignee_name",
                  "resolved_by_id", "resolved_by_name", "remark",
                  "related_funnel_stage", "related_metric"]:
        if field in data and data[field] is not None:
            updates.append(f"{field} = ?")
            params.append(data[field])

    new_status = data.get("status")
    if new_status == "resolved" and current.get("status") != "resolved":
        updates.append("resolved_at = ?")
        params.append(now)
        if "resolved_by_name" not in data:
            updates.append("resolved_by_name = ?")
            params.append("system")

    updates.append("updated_at = ?")
    params.append(now)
    params.append(note_id)

    if updates:
        con.execute(f"""
            UPDATE fact_renewal_note SET {', '.join(updates)} WHERE note_id = ?
        """, params)

    con.close()
    return get_note(note_id)


def delete_note(note_id: int) -> bool:
    con = get_duckdb_connection()
    result = con.execute("DELETE FROM fact_renewal_note WHERE note_id = ?", [note_id])
    con.close()
    return result.rowcount > 0


# ================ 会员相关 ================

def list_members(keyword: str = None, status: str = None, level: str = None,
                 coach_id: int = None, page: int = 1, page_size: int = 20) -> Dict:
    con = get_duckdb_connection()
    conditions = []
    params = []
    if keyword:
        conditions.append("(name ILIKE ? OR phone ILIKE ? OR member_no ILIKE ?)")
        kw = f"%{keyword}%"
        params.extend([kw, kw, kw])
    if status:
        conditions.append("status = ?")
        params.append(status)
    if level:
        conditions.append("level = ?")
        params.append(level)
    if coach_id:
        conditions.append("coach_id = ?")
        params.append(coach_id)

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    offset = (page - 1) * page_size

    total = con.execute(f"SELECT COUNT(*) FROM dim_member {where}", params).fetchone()[0]
    cols, rows = _fetch_all(con.execute(f"""
        SELECT member_id, member_no, name, phone, gender, level, status,
               join_date, coach_id, coach_name, total_purchased_amount,
               total_used_sessions, remaining_sessions, last_visit_date,
               next_expiry_date, renewal_warning_days, address, remark
        FROM dim_member {where}
        ORDER BY member_id DESC LIMIT ? OFFSET ?
    """, params + [page_size, offset]))
    con.close()
    items = rows_to_dicts(cols, rows)
    return {"total": total, "page": page, "page_size": page_size, "items": items}


def get_member(member_id: int) -> Optional[Dict]:
    con = get_duckdb_connection()
    cols, rows = _fetch_all(con.execute("""
        SELECT member_id, member_no, name, phone, gender, birthday, level, status,
               join_date, coach_id, coach_name, total_purchased_amount,
               total_used_sessions, remaining_sessions, last_visit_date,
               next_expiry_date, renewal_warning_days, address, remark,
               created_at, updated_at
        FROM dim_member WHERE member_id = ?
    """, [member_id]))
    con.close()
    return rows_to_dicts(cols, rows)[0] if rows else None


def get_member_memberships(member_id: int) -> List[Dict]:
    con = get_duckdb_connection()
    cols, rows = _fetch_all(con.execute("""
        SELECT membership_id, membership_no, member_id, type, name,
               total_sessions, used_sessions, remaining_sessions,
               total_amount, unit_price, start_date, end_date, status,
               is_renewal, transaction_id, source_membership_id
        FROM dim_membership WHERE member_id = ?
        ORDER BY end_date DESC
    """, [member_id]))
    con.close()
    return rows_to_dicts(cols, rows)


def get_member_courses(member_id: int, status: str = None,
                       page: int = 1, page_size: int = 10) -> Dict:
    con = get_duckdb_connection()
    conditions = ["member_id = ?"]
    params = [member_id]
    if status:
        conditions.append("status = ?")
        params.append(status)
    where = f"WHERE {' AND '.join(conditions)}"
    offset = (page - 1) * page_size

    total = con.execute(f"SELECT COUNT(*) FROM courses {where}", params).fetchone()[0]
    cols, rows = _fetch_all(con.execute(f"""
        SELECT course_id, course_no, member_id, membership_id, coach_id,
               coach_name, course_type, course_date, start_time, end_time,
               duration_minutes, status, is_verified, verify_time,
               consume_sessions
        FROM courses {where}
        ORDER BY course_date DESC LIMIT ? OFFSET ?
    """, params + [page_size, offset]))
    con.close()
    items = rows_to_dicts(cols, rows)
    return {"total": total, "page": page, "page_size": page_size, "items": items}


def get_member_transactions(member_id: int, tx_type: str = None,
                            page: int = 1, page_size: int = 10) -> Dict:
    con = get_duckdb_connection()
    conditions = ["member_id = ?"]
    params = [member_id]
    if tx_type:
        conditions.append("type = ?")
        params.append(tx_type)
    where = f"WHERE {' AND '.join(conditions)}"
    offset = (page - 1) * page_size

    total = con.execute(f"SELECT COUNT(*) FROM fact_transaction {where}", params).fetchone()[0]
    cols, rows = _fetch_all(con.execute(f"""
        SELECT transaction_id, transaction_no, member_id, membership_id, type,
               amount, discount_amount, actual_amount, payment_method, status,
               transaction_date, salesperson_name, cashier_name
        FROM fact_transaction {where}
        ORDER BY transaction_date DESC LIMIT ? OFFSET ?
    """, params + [page_size, offset]))
    con.close()
    items = rows_to_dicts(cols, rows)
    return {"total": total, "page": page, "page_size": page_size, "items": items}


def get_member_refunds(member_id: int, page: int = 1, page_size: int = 10) -> Dict:
    con = get_duckdb_connection()
    offset = (page - 1) * page_size
    total = con.execute("SELECT COUNT(*) FROM fact_refund WHERE member_id = ?",
                        [member_id]).fetchone()[0]
    cols, rows = _fetch_all(con.execute("""
        SELECT refund_id, refund_no, member_id, membership_id, transaction_id,
               reason, reason_detail, refund_amount, refund_sessions,
               penalty_amount, actual_refund_amount, status, apply_date,
               completed_date, applicant_name, approver_name
        FROM fact_refund WHERE member_id = ?
        ORDER BY apply_date DESC LIMIT ? OFFSET ?
    """, [member_id, page_size, offset]))
    con.close()
    items = rows_to_dicts(cols, rows)
    return {"total": total, "page": page, "page_size": page_size, "items": items}


def get_member_access_records(member_id: int, start_date: str = None,
                              end_date: str = None, page: int = 1, page_size: int = 10) -> Dict:
    con = get_duckdb_connection()
    conditions = ["member_id = ?"]
    params = [member_id]
    if start_date:
        conditions.append("access_date >= ?")
        params.append(start_date)
    if end_date:
        conditions.append("access_date <= ?")
        params.append(end_date)
    where = f"WHERE {' AND '.join(conditions)}"
    offset = (page - 1) * page_size

    total = con.execute(f"SELECT COUNT(*) FROM fact_access {where}", params).fetchone()[0]
    cols, rows = _fetch_all(con.execute(f"""
        SELECT record_id, record_no, member_id, member_no, member_name,
               access_type, access_time, access_date, device_location,
               verification_method, is_success
        FROM fact_access {where}
        ORDER BY access_time DESC LIMIT ? OFFSET ?
    """, params + [page_size, offset]))
    con.close()
    items = rows_to_dicts(cols, rows)
    return {"total": total, "page": page, "page_size": page_size, "items": items}


# ================ 新增：漏斗阶段下钻 & 退款原因下钻 ================

def get_funnel_stage_members(stage: str, start_date: str = None, end_date: str = None,
                             days: int = 30, page: int = 1, page_size: int = 20) -> Dict:
    """根据漏斗阶段获取下钻会员列表"""
    con = get_duckdb_connection()
    today = date.today()
    offset = (page - 1) * page_size

    if not end_date:
        end_date_dt = today
    else:
        end_date_dt = date.fromisoformat(end_date)
    if not start_date:
        start_date_dt = today - timedelta(days=90)
    else:
        start_date_dt = date.fromisoformat(start_date)

    if stage == "total_members":
        sql = """
            SELECT DISTINCT m.member_id, m.member_no, m.name, m.phone, m.level,
                   m.status, m.coach_name, m.remaining_sessions,
                   m.next_expiry_date, m.total_purchased_amount,
                   CAST(DATE_DIFF('day', CURRENT_DATE, m.next_expiry_date) AS INTEGER) AS days_remaining
            FROM dim_member m WHERE m.status = 'active'
            ORDER BY m.next_expiry_date ASC
        """
        count_sql = "SELECT COUNT(DISTINCT member_id) FROM dim_member WHERE status = 'active'"
    elif stage == "active_members":
        sql = f"""
            SELECT DISTINCT m.member_id, m.member_no, m.name, m.phone, m.level,
                   m.status, m.coach_name, m.remaining_sessions,
                   m.next_expiry_date, m.total_purchased_amount,
                   CAST(DATE_DIFF('day', CURRENT_DATE, m.next_expiry_date) AS INTEGER) AS days_remaining,
                   MAX(a.access_date) as last_active_date
            FROM dim_member m
            JOIN fact_access a ON m.member_id = a.member_id
            WHERE a.access_date BETWEEN '{start_date_dt}' AND '{end_date_dt}'
              AND a.is_success = 1
            GROUP BY m.member_id, m.member_no, m.name, m.phone, m.level,
                     m.status, m.coach_name, m.remaining_sessions,
                     m.next_expiry_date, m.total_purchased_amount
            ORDER BY last_active_date DESC
        """
        count_sql = f"""
            SELECT COUNT(DISTINCT m.member_id)
            FROM dim_member m JOIN fact_access a ON m.member_id = a.member_id
            WHERE a.access_date BETWEEN '{start_date_dt}' AND '{end_date_dt}'
              AND a.is_success = 1
        """
    elif stage == "expiring_members":
        exp_end = end_date_dt + timedelta(days=days)
        sql = f"""
            SELECT DISTINCT m.member_id, m.member_no, m.name, m.phone, m.level,
                   m.status, m.coach_name, ms.remaining_sessions,
                   ms.end_date as next_expiry_date, m.total_purchased_amount,
                   CAST(DATE_DIFF('day', CURRENT_DATE, ms.end_date) AS INTEGER) AS days_remaining,
                   ms.membership_no, ms.name as membership_name
            FROM dim_membership ms
            JOIN dim_member m ON ms.member_id = m.member_id
            WHERE ms.end_date BETWEEN '{start_date_dt}' AND '{exp_end}'
              AND ms.status = 'active'
            ORDER BY days_remaining ASC
        """
        count_sql = f"""
            SELECT COUNT(DISTINCT m.member_id)
            FROM dim_membership ms JOIN dim_member m ON ms.member_id = m.member_id
            WHERE ms.end_date BETWEEN '{start_date_dt}' AND '{exp_end}'
              AND ms.status = 'active'
        """
    elif stage == "contacted_members":
        sql = f"""
            SELECT DISTINCT m.member_id, m.member_no, m.name, m.phone, m.level,
                   m.status, m.coach_name, m.remaining_sessions,
                   m.next_expiry_date, m.total_purchased_amount,
                   CAST(DATE_DIFF('day', CURRENT_DATE, m.next_expiry_date) AS INTEGER) AS days_remaining,
                   MAX(n.created_at) as last_contact_time
            FROM dim_member m
            JOIN fact_renewal_note n ON m.member_id = n.member_id
            WHERE n.source IN ('expiry_warning', 'analysis', 'manual')
              AND n.created_at BETWEEN '{start_date_dt}'::timestamp AND '{end_date_dt}'::timestamp
            GROUP BY m.member_id, m.member_no, m.name, m.phone, m.level,
                     m.status, m.coach_name, m.remaining_sessions,
                     m.next_expiry_date, m.total_purchased_amount
            ORDER BY last_contact_time DESC
        """
        count_sql = f"""
            SELECT COUNT(DISTINCT m.member_id)
            FROM dim_member m JOIN fact_renewal_note n ON m.member_id = n.member_id
            WHERE n.source IN ('expiry_warning', 'analysis', 'manual')
              AND n.created_at BETWEEN '{start_date_dt}'::timestamp AND '{end_date_dt}'::timestamp
        """
    elif stage == "renewed_members":
        sql = f"""
            SELECT DISTINCT m.member_id, m.member_no, m.name, m.phone, m.level,
                   m.status, m.coach_name, m.remaining_sessions,
                   m.next_expiry_date, m.total_purchased_amount,
                   CAST(DATE_DIFF('day', CURRENT_DATE, m.next_expiry_date) AS INTEGER) AS days_remaining,
                   MAX(t.transaction_date) as last_renewal_time,
                   SUM(CASE WHEN t.type = 'renewal' THEN t.actual_amount ELSE 0 END) as renewal_amount
            FROM dim_member m
            JOIN fact_transaction t ON m.member_id = t.member_id
            WHERE t.type = 'renewal' AND t.status = 'success'
              AND t.transaction_date_date BETWEEN '{start_date_dt}' AND '{end_date_dt}'
            GROUP BY m.member_id, m.member_no, m.name, m.phone, m.level,
                     m.status, m.coach_name, m.remaining_sessions,
                     m.next_expiry_date, m.total_purchased_amount
            ORDER BY last_renewal_time DESC
        """
        count_sql = f"""
            SELECT COUNT(DISTINCT m.member_id)
            FROM dim_member m JOIN fact_transaction t ON m.member_id = t.member_id
            WHERE t.type = 'renewal' AND t.status = 'success'
              AND t.transaction_date_date BETWEEN '{start_date_dt}' AND '{end_date_dt}'
        """
    else:
        con.close()
        return {"total": 0, "page": page, "page_size": page_size, "items": []}

    total = con.execute(count_sql).fetchone()[0]
    paged_sql = f"{sql} LIMIT {page_size} OFFSET {offset}"
    cols, rows = _fetch_all(con.execute(paged_sql))
    con.close()
    items = rows_to_dicts(cols, rows)
    return {"total": total, "page": page, "page_size": page_size, "items": items}


def get_refund_reason_members(reason: str, start_date: str = None, end_date: str = None,
                              page: int = 1, page_size: int = 20) -> Dict:
    """根据退款原因下钻到具体退款会员"""
    con = get_duckdb_connection()
    today = date.today()
    offset = (page - 1) * page_size

    if not end_date:
        end_date_dt = today
    else:
        end_date_dt = date.fromisoformat(end_date)
    if not start_date:
        start_date_dt = today - timedelta(days=90)
    else:
        start_date_dt = date.fromisoformat(start_date)

    count_sql = f"""
        SELECT COUNT(*) FROM fact_refund r
        JOIN dim_member m ON r.member_id = m.member_id
        WHERE r.reason = ? AND r.apply_date_date BETWEEN ? AND ?
          AND r.status IN ('approved', 'completed')
    """
    total = con.execute(count_sql, [reason, start_date_dt, end_date_dt]).fetchone()[0]

    cols, rows = _fetch_all(con.execute(f"""
        SELECT r.refund_id, r.refund_no, r.member_id, m.member_no, m.name, m.phone,
               m.level, m.coach_name, r.refund_amount, r.actual_refund_amount,
               r.refund_sessions, r.penalty_amount, r.apply_date, r.status,
               r.applicant_name, r.approver_name, r.reason_detail
        FROM fact_refund r
        JOIN dim_member m ON r.member_id = m.member_id
        WHERE r.reason = ? AND r.apply_date_date BETWEEN ? AND ?
          AND r.status IN ('approved', 'completed')
        ORDER BY r.apply_date DESC
        LIMIT ? OFFSET ?
    """, [reason, start_date_dt, end_date_dt, page_size, offset]))
    con.close()
    items = rows_to_dicts(cols, rows)
    return {"total": total, "page": page, "page_size": page_size, "items": items}


# ================ 权益到期自动生成备注任务 ================

def generate_expiry_renewal_notes(operator_name: str = "system") -> int:
    """
    扫描即将到期会员，自动生成续费备注任务。
    基于 warning_thresholds 中的阈值。
    返回生成的任务数。
    """
    con = get_duckdb_connection()
    now = datetime.now()
    today = date.today()

    threshold_row = con.execute("""
        SELECT threshold_value FROM warning_thresholds
        WHERE threshold_type = 'renewal_warning_days' AND is_enabled = 1
        LIMIT 1
    """).fetchone()
    warning_days = int(threshold_row[0]) if threshold_row else 30

    expiring_date = today + timedelta(days=warning_days)

    existing = set()
    existing_rows = con.execute("""
        SELECT DISTINCT member_id FROM fact_renewal_note
        WHERE source = 'expiry_warning' AND status != 'closed'
    """).fetchall()
    for r in existing_rows:
        existing.add(r[0])

    to_notify = con.execute("""
        SELECT DISTINCT m.member_id, m.name, m.coach_id, m.coach_name,
                        ms.membership_id, ms.end_date, ms.remaining_sessions,
                        CAST(DATE_DIFF('day', CURRENT_DATE, ms.end_date) AS INTEGER) as days_left
        FROM dim_membership ms
        JOIN dim_member m ON ms.member_id = m.member_id
        WHERE ms.end_date BETWEEN CURRENT_DATE AND ?::date
          AND ms.status = 'active' AND m.status = 'active'
    """, [expiring_date]).fetchall()

    generated = 0
    for row in to_notify:
        (member_id, name, coach_id, coach_name,
         membership_id, end_date, remaining, days_left) = row
        if member_id in existing:
            continue

        priority = "urgent" if days_left <= 7 else ("high" if days_left <= 15 else "medium")
        note_no = _generate_note_no()
        title = f"【续费提醒】{name} 权益即将到期（剩{days_left}天）"
        content = (f"会员 {name} 会籍卡将于 {end_date} 到期，"
                   f"剩余课时 {remaining} 节。请尽快联系确认续费意向，"
                   f"指派教练跟进。")

        due_date = today + timedelta(days=min(3, max(1, days_left // 10)))

        con.execute("""
            INSERT INTO fact_renewal_note
            (note_no, member_id, membership_id, source, title, content,
             status, priority, due_date, assignee_id, assignee_name,
             created_by_name, related_funnel_stage, created_at, updated_at)
            VALUES (?, ?, ?, 'expiry_warning', ?, ?,
                    'pending', ?, ?, ?, ?,
                    ?, 'expiring_members', ?, ?)
        """, [
            note_no, member_id, membership_id, title, content,
            priority, due_date, coach_id, coach_name,
            operator_name, now, now
        ])
        generated += 1

    con.close()
    return generated
