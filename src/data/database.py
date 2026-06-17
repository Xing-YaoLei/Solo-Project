import duckdb
import polars as pl
from pathlib import Path
from typing import Optional, Dict, List


class DatabaseManager:
    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            db_path = str(Path(__file__).parent.parent.parent / "data" / "cleaning_schedule.duckdb")
        self.db_path = db_path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self.con = duckdb.connect(db_path)
        self._init_tables()

    def _init_tables(self):
        self.con.execute("""
            CREATE TABLE IF NOT EXISTS meter_readings (
                id VARCHAR PRIMARY KEY,
                apartment_id VARCHAR,
                room_id VARCHAR,
                reading_date DATE,
                water_meter DOUBLE,
                electric_meter DOUBLE,
                gas_meter DOUBLE,
                source VARCHAR,
                version INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.con.execute("""
            CREATE TABLE IF NOT EXISTS e_contracts (
                id VARCHAR PRIMARY KEY,
                contract_no VARCHAR,
                apartment_id VARCHAR,
                room_id VARCHAR,
                tenant_name VARCHAR,
                start_date DATE,
                end_date DATE,
                cleaning_frequency VARCHAR,
                cleaning_weekday VARCHAR,
                cleaning_time_slot VARCHAR,
                version INTEGER,
                is_current BOOLEAN,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.con.execute("""
            CREATE TABLE IF NOT EXISTS crm_schedules (
                id VARCHAR PRIMARY KEY,
                apartment_id VARCHAR,
                room_id VARCHAR,
                cleaning_date DATE,
                time_slot VARCHAR,
                cleaner_id VARCHAR,
                cleaner_name VARCHAR,
                status VARCHAR,
                source VARCHAR DEFAULT 'CRM',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.con.execute("""
            CREATE TABLE IF NOT EXISTS reschedule_records (
                id VARCHAR PRIMARY KEY,
                original_schedule_id VARCHAR,
                apartment_id VARCHAR,
                room_id VARCHAR,
                original_date DATE,
                original_time_slot VARCHAR,
                new_date DATE,
                new_time_slot VARCHAR,
                reason VARCHAR,
                operator VARCHAR,
                status VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_quality VARCHAR DEFAULT 'complete'
            )
        """)

        self.con.execute("""
            CREATE TABLE IF NOT EXISTS attendance_records (
                id VARCHAR PRIMARY KEY,
                schedule_id VARCHAR,
                apartment_id VARCHAR,
                room_id VARCHAR,
                scheduled_date DATE,
                scheduled_time_slot VARCHAR,
                actual_arrival_time TIMESTAMP,
                actual_departure_time TIMESTAMP,
                status VARCHAR,
                remark VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.con.execute("""
            CREATE TABLE IF NOT EXISTS conflict_records (
                id VARCHAR PRIMARY KEY,
                conflict_type VARCHAR,
                apartment_id VARCHAR,
                room_id VARCHAR,
                schedule_id_1 VARCHAR,
                schedule_id_2 VARCHAR,
                time_slot VARCHAR,
                conflict_date DATE,
                description VARCHAR,
                severity VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.con.execute("""
            CREATE TABLE IF NOT EXISTS alert_list (
                id VARCHAR PRIMARY KEY,
                alert_type VARCHAR,
                apartment_id VARCHAR,
                room_id VARCHAR,
                schedule_id VARCHAR,
                alert_date DATE,
                description VARCHAR,
                severity VARCHAR,
                is_resolved BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

    def insert_dataframe(self, table_name: str, df: pl.DataFrame):
        temp_name = f"temp_{table_name}_{id(df)}"
        self.con.register(temp_name, df)
        columns = ", ".join(df.columns)
        self.con.execute(f"INSERT INTO {table_name} ({columns}) SELECT {columns} FROM {temp_name}")
        self.con.unregister(temp_name)

    def query(self, sql: str) -> pl.DataFrame:
        return self.con.sql(sql).pl()

    def get_table_names(self) -> List[str]:
        result = self.con.execute("SHOW TABLES").fetchall()
        return [row[0] for row in result]

    def close(self):
        self.con.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
