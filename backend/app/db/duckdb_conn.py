import duckdb
import os
from pathlib import Path


DUCKDB_PATH = os.getenv("DUCKDB_PATH", str(Path(__file__).parent.parent / "data" / "analytics.duckdb"))


def get_duckdb_connection():
    os.makedirs(os.path.dirname(DUCKDB_PATH), exist_ok=True)
    con = duckdb.connect(DUCKDB_PATH)
    return con


def reset_duckdb():
    """完全重置 DuckDB，用于可重复初始化"""
    con = get_duckdb_connection()
    tables = [
        "fact_renewal_note", "fact_refund", "fact_access", "fact_course_record",
        "fact_transaction", "dim_membership", "dim_member",
        "threshold_audit_logs", "warning_thresholds", "courses"
    ]
    for t in tables:
        con.execute(f"DROP TABLE IF EXISTS {t}")
    try:
        con.execute("DROP SEQUENCE IF EXISTS seq_note_id")
        con.execute("DROP SEQUENCE IF EXISTS seq_threshold_id")
        con.execute("DROP SEQUENCE IF EXISTS seq_audit_id")
        con.execute("DROP SEQUENCE IF EXISTS seq_course_id")
    except Exception:
        pass
    con.close()


def init_duckdb_tables():
    con = get_duckdb_connection()

    con.execute("""
        CREATE SEQUENCE IF NOT EXISTS seq_note_id START 1000
    """)
    con.execute("""
        CREATE SEQUENCE IF NOT EXISTS seq_threshold_id START 100
    """)
    con.execute("""
        CREATE SEQUENCE IF NOT EXISTS seq_audit_id START 1000
    """)
    con.execute("""
        CREATE SEQUENCE IF NOT EXISTS seq_course_id START 1000
    """)

    con.execute("""
        CREATE TABLE IF NOT EXISTS dim_member (
            member_id INTEGER PRIMARY KEY,
            member_no VARCHAR UNIQUE,
            name VARCHAR,
            phone VARCHAR,
            gender VARCHAR,
            birthday DATE,
            level VARCHAR,
            status VARCHAR,
            join_date DATE,
            coach_id INTEGER,
            coach_name VARCHAR,
            total_purchased_amount DOUBLE,
            total_used_sessions INTEGER,
            remaining_sessions INTEGER,
            last_visit_date DATE,
            next_expiry_date DATE,
            renewal_warning_days INTEGER,
            address VARCHAR,
            remark VARCHAR,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
    """)

    con.execute("""
        CREATE TABLE IF NOT EXISTS dim_membership (
            membership_id INTEGER PRIMARY KEY,
            membership_no VARCHAR UNIQUE,
            member_id INTEGER,
            type VARCHAR,
            name VARCHAR,
            total_sessions INTEGER,
            used_sessions INTEGER,
            remaining_sessions INTEGER,
            total_amount DOUBLE,
            unit_price DOUBLE,
            start_date DATE,
            end_date DATE,
            status VARCHAR,
            is_renewal INTEGER,
            transaction_id INTEGER,
            source_membership_id INTEGER,
            remark VARCHAR,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
    """)

    con.execute("""
        CREATE TABLE IF NOT EXISTS courses (
            course_id INTEGER PRIMARY KEY DEFAULT nextval('seq_course_id'),
            course_no VARCHAR UNIQUE,
            member_id INTEGER,
            membership_id INTEGER,
            coach_id INTEGER,
            coach_name VARCHAR,
            course_type VARCHAR,
            course_date DATE,
            start_time VARCHAR,
            end_time VARCHAR,
            duration_minutes INTEGER,
            status VARCHAR,
            actual_start_time TIMESTAMP,
            actual_end_time TIMESTAMP,
            is_verified INTEGER,
            verify_time TIMESTAMP,
            consume_sessions INTEGER,
            remark VARCHAR,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
    """)

    con.execute("""
        CREATE TABLE IF NOT EXISTS fact_transaction (
            transaction_id INTEGER PRIMARY KEY,
            transaction_no VARCHAR UNIQUE,
            member_id INTEGER,
            membership_id INTEGER,
            type VARCHAR,
            amount DOUBLE,
            discount_amount DOUBLE,
            actual_amount DOUBLE,
            payment_method VARCHAR,
            status VARCHAR,
            transaction_date TIMESTAMP,
            transaction_date_date DATE,
            related_transaction_id INTEGER,
            salesperson_id INTEGER,
            salesperson_name VARCHAR,
            cashier_id INTEGER,
            cashier_name VARCHAR,
            remark VARCHAR,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
    """)

    con.execute("""
        CREATE TABLE IF NOT EXISTS fact_course_record (
            record_id INTEGER PRIMARY KEY,
            record_no VARCHAR UNIQUE,
            member_id INTEGER,
            membership_id INTEGER,
            course_id INTEGER,
            verification_type VARCHAR,
            consume_sessions INTEGER,
            consume_before INTEGER,
            consume_after INTEGER,
            operator_id INTEGER,
            operator_name VARCHAR,
            verify_time TIMESTAMP,
            verify_date DATE,
            device_id VARCHAR,
            device_location VARCHAR,
            remark VARCHAR,
            created_at TIMESTAMP
        )
    """)

    con.execute("""
        CREATE TABLE IF NOT EXISTS fact_access (
            record_id INTEGER PRIMARY KEY,
            record_no VARCHAR UNIQUE,
            member_id INTEGER,
            member_no VARCHAR,
            member_name VARCHAR,
            access_type VARCHAR,
            access_time TIMESTAMP,
            access_date DATE,
            device_id VARCHAR,
            device_location VARCHAR,
            verification_method VARCHAR,
            is_success INTEGER,
            fail_reason VARCHAR,
            temperature VARCHAR,
            created_at TIMESTAMP
        )
    """)

    con.execute("""
        CREATE TABLE IF NOT EXISTS fact_refund (
            refund_id INTEGER PRIMARY KEY,
            refund_no VARCHAR UNIQUE,
            member_id INTEGER,
            membership_id INTEGER,
            transaction_id INTEGER,
            reason VARCHAR,
            reason_detail VARCHAR,
            refund_amount DOUBLE,
            refund_sessions INTEGER,
            penalty_amount DOUBLE,
            actual_refund_amount DOUBLE,
            status VARCHAR,
            apply_date TIMESTAMP,
            apply_date_date DATE,
            approve_date TIMESTAMP,
            completed_date TIMESTAMP,
            applicant_id INTEGER,
            applicant_name VARCHAR,
            approver_id INTEGER,
            approver_name VARCHAR,
            remark VARCHAR,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
    """)

    con.execute("""
        CREATE TABLE IF NOT EXISTS warning_thresholds (
            id INTEGER PRIMARY KEY DEFAULT nextval('seq_threshold_id'),
            threshold_type VARCHAR UNIQUE,
            threshold_name VARCHAR,
            threshold_value DOUBLE,
            threshold_unit VARCHAR,
            description VARCHAR,
            is_enabled INTEGER,
            created_by VARCHAR,
            updated_by VARCHAR,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
    """)

    con.execute("""
        CREATE TABLE IF NOT EXISTS threshold_audit_logs (
            id INTEGER PRIMARY KEY DEFAULT nextval('seq_audit_id'),
            threshold_id INTEGER,
            threshold_type VARCHAR,
            old_value DOUBLE,
            new_value DOUBLE,
            old_name VARCHAR,
            new_name VARCHAR,
            operator_name VARCHAR,
            operator_id INTEGER,
            operation_type VARCHAR,
            remark VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    con.execute("""
        CREATE TABLE IF NOT EXISTS fact_renewal_note (
            note_id INTEGER PRIMARY KEY DEFAULT nextval('seq_note_id'),
            note_no VARCHAR UNIQUE,
            member_id INTEGER,
            membership_id INTEGER,
            source VARCHAR,
            title VARCHAR,
            content VARCHAR,
            conclusion VARCHAR,
            status VARCHAR,
            priority VARCHAR,
            due_date DATE,
            assignee_id INTEGER,
            assignee_name VARCHAR,
            created_by_id INTEGER,
            created_by_name VARCHAR,
            resolved_by_id INTEGER,
            resolved_by_name VARCHAR,
            resolved_at TIMESTAMP,
            related_funnel_stage VARCHAR,
            related_metric VARCHAR,
            remark VARCHAR,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
    """)

    con.close()
