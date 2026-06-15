import duckdb
import polars as pl
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from config import db_config

class DuckDBClient:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or db_config.db_path
        self.conn = duckdb.connect(self.db_path)
        self._initialize_tables()

    def _initialize_tables(self):
        tables = {
            "sync_audit_log": """
                CREATE TABLE IF NOT EXISTS sync_audit_log (
                    sync_id VARCHAR PRIMARY KEY,
                    source_system VARCHAR,
                    sync_node VARCHAR,
                    status VARCHAR,
                    records_processed INTEGER,
                    start_time TIMESTAMP,
                    end_time TIMESTAMP,
                    error_message TEXT,
                    source_hash VARCHAR,
                    target_hash VARCHAR,
                    metadata JSON
                )
            """,
            "employment_records": """
                CREATE TABLE IF NOT EXISTS employment_records (
                    record_id VARCHAR PRIMARY KEY,
                    student_id VARCHAR,
                    student_name VARCHAR,
                    course_id VARCHAR,
                    course_name VARCHAR,
                    employment_date DATE,
                    company_name VARCHAR,
                    position VARCHAR,
                    salary DECIMAL(10,2),
                    region VARCHAR,
                    is_placed BOOLEAN,
                    sync_id VARCHAR,
                    created_at TIMESTAMP
                )
            """,
            "live_platform_logs": """
                CREATE TABLE IF NOT EXISTS live_platform_logs (
                    log_id VARCHAR PRIMARY KEY,
                    student_id VARCHAR,
                    student_name VARCHAR,
                    room_id VARCHAR,
                    room_title VARCHAR,
                    join_time TIMESTAMP,
                    leave_time TIMESTAMP,
                    watch_duration INTEGER,
                    interaction_count INTEGER,
                    region VARCHAR,
                    sync_id VARCHAR,
                    created_at TIMESTAMP
                )
            """,
            "question_bank_records": """
                CREATE TABLE IF NOT EXISTS question_bank_records (
                    attempt_id VARCHAR PRIMARY KEY,
                    student_id VARCHAR,
                    student_name VARCHAR,
                    question_id VARCHAR,
                    exam_id VARCHAR,
                    exam_name VARCHAR,
                    is_correct BOOLEAN,
                    score DECIMAL(5,2),
                    total_score DECIMAL(5,2),
                    attempt_time TIMESTAMP,
                    plagiarism_score DECIMAL(5,4),
                    is_plagiarized BOOLEAN,
                    region VARCHAR,
                    sync_id VARCHAR,
                    created_at TIMESTAMP
                )
            """,
            "account_transactions": """
                CREATE TABLE IF NOT EXISTS account_transactions (
                    transaction_id VARCHAR PRIMARY KEY,
                    student_id VARCHAR,
                    student_name VARCHAR,
                    transaction_type VARCHAR,
                    amount DECIMAL(10,2),
                    balance_after DECIMAL(10,2),
                    transaction_time TIMESTAMP,
                    region VARCHAR,
                    sync_id VARCHAR,
                    created_at TIMESTAMP
                )
            """,
            "level_changes": """
                CREATE TABLE IF NOT EXISTS level_changes (
                    change_id VARCHAR PRIMARY KEY,
                    student_id VARCHAR,
                    student_name VARCHAR,
                    old_level INTEGER,
                    new_level INTEGER,
                    change_reason VARCHAR,
                    change_time TIMESTAMP,
                    region VARCHAR,
                    has_data_gap BOOLEAN DEFAULT FALSE,
                    gap_days INTEGER,
                    sync_id VARCHAR,
                    created_at TIMESTAMP
                )
            """,
            "redemption_records": """
                CREATE TABLE IF NOT EXISTS redemption_records (
                    redemption_id VARCHAR PRIMARY KEY,
                    student_id VARCHAR,
                    student_name VARCHAR,
                    course_id VARCHAR,
                    course_name VARCHAR,
                    redemption_time TIMESTAMP,
                    points_used INTEGER,
                    status VARCHAR,
                    region VARCHAR,
                    detail_link VARCHAR,
                    sync_id VARCHAR,
                    created_at TIMESTAMP
                )
            """,
            "refund_records": """
                CREATE TABLE IF NOT EXISTS refund_records (
                    refund_id VARCHAR PRIMARY KEY,
                    student_id VARCHAR,
                    student_name VARCHAR,
                    course_id VARCHAR,
                    course_name VARCHAR,
                    refund_amount DECIMAL(10,2),
                    refund_reason VARCHAR,
                    refund_time TIMESTAMP,
                    status VARCHAR,
                    region VARCHAR,
                    explanation TEXT,
                    sync_id VARCHAR,
                    created_at TIMESTAMP
                )
            """,
            "plagiarism_samples": """
                CREATE TABLE IF NOT EXISTS plagiarism_samples (
                    sample_id VARCHAR PRIMARY KEY,
                    attempt_id_1 VARCHAR,
                    attempt_id_2 VARCHAR,
                    student_id_1 VARCHAR,
                    student_id_2 VARCHAR,
                    similarity_score DECIMAL(5,4),
                    matched_questions TEXT,
                    detection_time TIMESTAMP,
                    review_status VARCHAR,
                    reviewer_notes TEXT,
                    sync_id VARCHAR,
                    created_at TIMESTAMP
                )
            """,
            "exam_pass_rates": """
                CREATE TABLE IF NOT EXISTS exam_pass_rates (
                    rate_id VARCHAR PRIMARY KEY,
                    exam_id VARCHAR,
                    exam_name VARCHAR,
                    exam_date DATE,
                    region VARCHAR,
                    total_students INTEGER,
                    passed_students INTEGER,
                    pass_rate DECIMAL(5,4),
                    average_score DECIMAL(5,2),
                    sync_id VARCHAR,
                    created_at TIMESTAMP
                )
            """
        }
        
        for table_name, create_sql in tables.items():
            self.conn.execute(create_sql)

    def execute_query(self, query: str, params: Optional[Tuple] = None) -> duckdb.DuckDBPyConnection:
        if params:
            return self.conn.execute(query, params)
        return self.conn.execute(query)

    def query_to_polars(self, query: str, params: Optional[Tuple] = None) -> pl.DataFrame:
        result = self.execute_query(query, params)
        return pl.from_arrow(result.fetch_arrow_table())

    def insert_dataframe(self, table_name: str, df: pl.DataFrame) -> int:
        if len(df) == 0:
            return 0
        self.conn.register("temp_df", df)
        self.conn.execute(f"INSERT INTO {table_name} SELECT * FROM temp_df")
        return len(df)

    def upsert_dataframe(self, table_name: str, df: pl.DataFrame, primary_key: str) -> int:
        if len(df) == 0:
            return 0
        self.conn.register("temp_df", df)
        columns = df.columns
        set_clause = ", ".join([f"{col}=EXCLUDED.{col}" for col in columns if col != primary_key])
        query = f"""
            INSERT INTO {table_name} ({', '.join(columns)})
            SELECT {', '.join(columns)} FROM temp_df
            ON CONFLICT ({primary_key}) DO UPDATE SET {set_clause}
        """
        self.conn.execute(query)
        return len(df)

    def close(self):
        self.conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
