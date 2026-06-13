import duckdb
import os
from pathlib import Path


DUCKDB_PATH = os.getenv("DUCKDB_PATH", str(Path(__file__).parent.parent / "data" / "analytics.duckdb"))


def get_duckdb_connection():
    os.makedirs(os.path.dirname(DUCKDB_PATH), exist_ok=True)
    con = duckdb.connect(DUCKDB_PATH)
    return con


def init_duckdb_tables():
    con = get_duckdb_connection()

    con.execute("""
        CREATE TABLE IF NOT EXISTS dim_member (
            member_id INTEGER,
            member_no VARCHAR,
            name VARCHAR,
            phone VARCHAR,
            level VARCHAR,
            status VARCHAR,
            join_date DATE,
            coach_id INTEGER,
            coach_name VARCHAR,
            total_purchased_amount DOUBLE,
            last_visit_date DATE,
            next_expiry_date DATE,
            renewal_warning_days INTEGER,
            created_at TIMESTAMP
        )
    """)

    con.execute("""
        CREATE TABLE IF NOT EXISTS dim_membership (
            membership_id INTEGER,
            membership_no VARCHAR,
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
            created_at TIMESTAMP
        )
    """)

    con.execute("""
        CREATE TABLE IF NOT EXISTS fact_transaction (
            transaction_id INTEGER,
            transaction_no VARCHAR,
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
            created_at TIMESTAMP
        )
    """)

    con.execute("""
        CREATE TABLE IF NOT EXISTS fact_course_record (
            record_id INTEGER,
            record_no VARCHAR,
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
            created_at TIMESTAMP
        )
    """)

    con.execute("""
        CREATE TABLE IF NOT EXISTS fact_access (
            record_id INTEGER,
            record_no VARCHAR,
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
            created_at TIMESTAMP
        )
    """)

    con.execute("""
        CREATE TABLE IF NOT EXISTS fact_refund (
            refund_id INTEGER,
            refund_no VARCHAR,
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
            created_at TIMESTAMP
        )
    """)

    con.execute("""
        CREATE TABLE IF NOT EXISTS fact_renewal_note (
            note_id INTEGER,
            note_no VARCHAR,
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
            created_at TIMESTAMP
        )
    """)

    con.close()
