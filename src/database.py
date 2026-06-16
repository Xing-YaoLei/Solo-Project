import duckdb
import os
from pathlib import Path
from typing import Optional
import polars as pl

from config import config


class DuckDBManager:
    _instance: Optional["DuckDBManager"] = None
    _conn: Optional[duckdb.DuckDBPyConnection] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._conn is None:
            self._initialize_database()

    def _initialize_database(self):
        db_path = Path(config.DUCKDB_DATABASE)
        db_path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = duckdb.connect(str(db_path))
        self._create_tables()

    def _create_tables(self):
        conn = self._conn

        conn.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                patient_id VARCHAR PRIMARY KEY,
                name VARCHAR NOT NULL,
                age INTEGER,
                gender VARCHAR,
                admission_date DATE,
                discharge_date DATE,
                primary_diagnosis VARCHAR,
                risk_level VARCHAR,
                risk_score FLOAT,
                insurance_type VARCHAR,
                attending_physician VARCHAR
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS patient_risk_daily (
                record_id VARCHAR PRIMARY KEY,
                patient_id VARCHAR NOT NULL,
                record_date DATE NOT NULL,
                risk_level VARCHAR,
                risk_score FLOAT,
                vital_signs_score FLOAT,
                mobility_score FLOAT,
                cognitive_score FLOAT,
                nutrition_score FLOAT,
                complication_score FLOAT,
                fee_table_updated BOOLEAN DEFAULT TRUE,
                medical_record_complete BOOLEAN DEFAULT TRUE,
                device_calibration_current BOOLEAN DEFAULT TRUE,
                device_calibration_version VARCHAR,
                insurance_denial BOOLEAN DEFAULT FALSE,
                insurance_denial_amount FLOAT DEFAULT 0,
                training_completion_rate FLOAT,
                FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS fee_table_sync_log (
                sync_id VARCHAR PRIMARY KEY,
                sync_date DATE NOT NULL,
                expected_date DATE,
                delay_days INTEGER,
                sync_status VARCHAR,
                affected_records INTEGER,
                note TEXT
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS medical_record_gaps (
                gap_id VARCHAR PRIMARY KEY,
                patient_id VARCHAR NOT NULL,
                gap_date DATE NOT NULL,
                gap_type VARCHAR,
                description TEXT,
                resolved BOOLEAN DEFAULT FALSE,
                resolved_date DATE,
                FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS device_calibration_changes (
                change_id VARCHAR PRIMARY KEY,
                device_id VARCHAR NOT NULL,
                device_name VARCHAR,
                change_date DATE NOT NULL,
                old_version VARCHAR,
                new_version VARCHAR,
                change_description TEXT,
                affected_patients INTEGER
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS insurance_denials (
                denial_id VARCHAR PRIMARY KEY,
                patient_id VARCHAR NOT NULL,
                denial_date DATE NOT NULL,
                denial_code VARCHAR,
                denial_reason TEXT,
                denial_amount FLOAT,
                appealed BOOLEAN DEFAULT FALSE,
                appeal_result VARCHAR,
                FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS treatment_calendar (
                treatment_id VARCHAR PRIMARY KEY,
                patient_id VARCHAR NOT NULL,
                treatment_date DATE NOT NULL,
                treatment_type VARCHAR,
                treatment_duration INTEGER,
                therapist VARCHAR,
                treatment_status VARCHAR,
                device_id VARCHAR,
                notes TEXT,
                FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS device_status (
                status_id VARCHAR PRIMARY KEY,
                device_id VARCHAR NOT NULL,
                device_name VARCHAR,
                status_date DATE NOT NULL,
                device_status VARCHAR,
                utilization_rate FLOAT,
                calibration_due BOOLEAN,
                maintenance_due BOOLEAN,
                error_count INTEGER DEFAULT 0
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS nursing_logs (
                log_id VARCHAR PRIMARY KEY,
                patient_id VARCHAR NOT NULL,
                log_date DATE NOT NULL,
                nurse_id VARCHAR,
                nurse_name VARCHAR,
                shift VARCHAR,
                blood_pressure VARCHAR,
                heart_rate INTEGER,
                temperature FLOAT,
                oxygen_saturation FLOAT,
                pain_level INTEGER,
                notes TEXT,
                FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS review_notes (
                note_id VARCHAR PRIMARY KEY,
                patient_id VARCHAR NOT NULL,
                related_record_id VARCHAR,
                note_date DATE NOT NULL,
                anomaly_type VARCHAR,
                anomaly_description TEXT,
                review_note TEXT,
                reviewer VARCHAR,
                follow_up_action TEXT,
                resolved BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS data_sync_status (
                id INTEGER PRIMARY KEY DEFAULT 1,
                last_fee_table_sync DATE,
                last_medical_record_sync DATE,
                last_device_sync DATE,
                last_insurance_sync DATE,
                refresh_timestamp TIMESTAMP
            )
        """)

        conn.execute("""
            INSERT OR IGNORE INTO data_sync_status
            (id, last_fee_table_sync, last_medical_record_sync, last_device_sync, last_insurance_sync, refresh_timestamp)
            VALUES (1, CURRENT_DATE - 1, CURRENT_DATE, CURRENT_DATE, CURRENT_DATE, CURRENT_TIMESTAMP)
        """)

    def get_connection(self) -> duckdb.DuckDBPyConnection:
        return self._conn

    def query(self, sql: str, params: list = None) -> pl.DataFrame:
        if params:
            result = self._conn.execute(sql, params)
        else:
            result = self._conn.execute(sql)
        return pl.DataFrame(result.fetchdf())

    def execute(self, sql: str, params: list = None):
        if params:
            self._conn.execute(sql, params)
        else:
            self._conn.execute(sql)

    def insert_dataframe(self, table_name: str, df: pl.DataFrame):
        self._conn.register("temp_df", df.to_pandas())
        self._conn.execute(f"INSERT OR REPLACE INTO {table_name} SELECT * FROM temp_df")
        self._conn.unregister("temp_df")

    def close(self):
        if self._conn:
            self._conn.close()
            self._conn = None
            DuckDBManager._instance = None


def get_db() -> DuckDBManager:
    return DuckDBManager()
