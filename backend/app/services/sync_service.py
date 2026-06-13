from sqlalchemy.orm import Session
from ..db.database import SessionLocal
from ..models.member import Member
from ..models.membership import Membership
from ..models.transaction import Transaction
from ..models.course_record import CourseRecord
from ..models.access_record import AccessRecord
from ..models.refund import Refund
from ..models.renewal_note import RenewalNote
from ..db.duckdb_conn import get_duckdb_connection


def sync_postgres_to_duckdb():
    db = SessionLocal()
    con = get_duckdb_connection()

    try:
        con.execute("DELETE FROM dim_member")
        members = db.query(Member).all()
        member_data = []
        for m in members:
            member_data.append((
                m.id, m.member_no, m.name, m.phone, m.level, m.status,
                m.join_date, m.coach_id, m.coach_name, m.total_purchased_amount,
                m.last_visit_date, m.next_expiry_date, m.renewal_warning_days, m.created_at
            ))
        if member_data:
            con.executemany("""
                INSERT INTO dim_member VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, member_data)

        con.execute("DELETE FROM dim_membership")
        memberships = db.query(Membership).all()
        ms_data = []
        for ms in memberships:
            ms_data.append((
                ms.id, ms.membership_no, ms.member_id, ms.type, ms.name,
                ms.total_sessions, ms.used_sessions, ms.remaining_sessions,
                ms.total_amount, ms.unit_price, ms.start_date, ms.end_date,
                ms.status, ms.is_renewal, ms.transaction_id, ms.source_membership_id, ms.created_at
            ))
        if ms_data:
            con.executemany("""
                INSERT INTO dim_membership VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, ms_data)

        con.execute("DELETE FROM fact_transaction")
        transactions = db.query(Transaction).all()
        tx_data = []
        for t in transactions:
            tx_data.append((
                t.id, t.transaction_no, t.member_id, t.membership_id, t.type,
                t.amount, t.discount_amount, t.actual_amount, t.payment_method,
                t.status, t.transaction_date,
                t.transaction_date.date() if t.transaction_date else None,
                t.related_transaction_id, t.salesperson_id, t.salesperson_name,
                t.cashier_id, t.cashier_name, t.created_at
            ))
        if tx_data:
            con.executemany("""
                INSERT INTO fact_transaction VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, tx_data)

        con.execute("DELETE FROM fact_course_record")
        course_records = db.query(CourseRecord).all()
        cr_data = []
        for cr in course_records:
            cr_data.append((
                cr.id, cr.record_no, cr.member_id, cr.membership_id, cr.course_id,
                cr.verification_type, cr.consume_sessions, cr.consume_before, cr.consume_after,
                cr.operator_id, cr.operator_name, cr.verify_time,
                cr.verify_time.date() if cr.verify_time else None,
                cr.device_id, cr.device_location, cr.created_at
            ))
        if cr_data:
            con.executemany("""
                INSERT INTO fact_course_record VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, cr_data)

        con.execute("DELETE FROM fact_access")
        access_records = db.query(AccessRecord).all()
        ar_data = []
        for ar in access_records:
            ar_data.append((
                ar.id, ar.record_no, ar.member_id, ar.member_no, ar.member_name,
                ar.access_type, ar.access_time, ar.access_date,
                ar.device_id, ar.device_location, ar.verification_method,
                ar.is_success, ar.created_at
            ))
        if ar_data:
            con.executemany("""
                INSERT INTO fact_access VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, ar_data)

        con.execute("DELETE FROM fact_refund")
        refunds = db.query(Refund).all()
        refund_data = []
        for r in refunds:
            refund_data.append((
                r.id, r.refund_no, r.member_id, r.membership_id, r.transaction_id,
                r.reason, r.reason_detail, r.refund_amount, r.refund_sessions,
                r.penalty_amount, r.actual_refund_amount, r.status,
                r.apply_date, r.apply_date.date() if r.apply_date else None,
                r.approve_date, r.completed_date, r.applicant_id, r.applicant_name,
                r.approver_id, r.approver_name, r.created_at
            ))
        if refund_data:
            con.executemany("""
                INSERT INTO fact_refund VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, refund_data)

        con.execute("DELETE FROM fact_renewal_note")
        notes = db.query(RenewalNote).all()
        note_data = []
        for n in notes:
            note_data.append((
                n.id, n.note_no, n.member_id, n.membership_id, n.source,
                n.title, n.content, n.conclusion, n.status, n.priority,
                n.due_date, n.assignee_id, n.assignee_name,
                n.created_by_id, n.created_by_name,
                n.resolved_by_id, n.resolved_by_name, n.resolved_at,
                n.related_funnel_stage, n.related_metric, n.created_at
            ))
        if note_data:
            con.executemany("""
                INSERT INTO fact_renewal_note VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, note_data)

        con.close()
        print("数据同步完成！")
        return True

    except Exception as e:
        con.close()
        print(f"数据同步失败: {e}")
        raise e
    finally:
        db.close()


def init_default_thresholds():
    from ..models.warning_threshold import WarningThreshold
    db = SessionLocal()

    defaults = [
        {
            "threshold_type": "renewal_warning_days",
            "threshold_name": "续费预警天数",
            "threshold_value": 30,
            "threshold_unit": "天",
            "description": "会员权益到期前N天开始预警提醒",
            "created_by": "system",
        },
        {
            "threshold_type": "low_renewal_rate",
            "threshold_name": "低续费率预警",
            "threshold_value": 50,
            "threshold_unit": "%",
            "description": "续费率低于该值时触发预警",
            "created_by": "system",
        },
        {
            "threshold_type": "inactive_days",
            "threshold_name": "不活跃预警天数",
            "threshold_value": 15,
            "threshold_unit": "天",
            "description": "连续N天未到店视为不活跃会员",
            "created_by": "system",
        },
        {
            "threshold_type": "expiring_soon",
            "threshold_name": "即将到期提醒",
            "threshold_value": 7,
            "threshold_unit": "天",
            "description": "到期前N天提醒会员和教练",
            "created_by": "system",
        },
        {
            "threshold_type": "low_sessions_remaining",
            "threshold_name": "低课时预警",
            "threshold_value": 5,
            "threshold_unit": "节",
            "description": "剩余课时低于该值时触发续费提醒",
            "created_by": "system",
        },
    ]

    for item in defaults:
        existing = db.query(WarningThreshold).filter(
            WarningThreshold.threshold_type == item["threshold_type"]
        ).first()
        if not existing:
            db_threshold = WarningThreshold(**item)
            db.add(db_threshold)

    db.commit()
    db.close()
    print("默认阈值配置初始化完成！")


if __name__ == "__main__":
    from ..db.database import Base, engine
    Base.metadata.create_all(bind=engine)

    from ..db.duckdb_conn import init_duckdb_tables
    init_duckdb_tables()

    init_default_thresholds()
    sync_postgres_to_duckdb()
