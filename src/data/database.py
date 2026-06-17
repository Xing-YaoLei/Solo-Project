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

        self.con.execute("""
            CREATE TABLE IF NOT EXISTS data_versions (
                id VARCHAR PRIMARY KEY,
                category VARCHAR,
                version INTEGER,
                description VARCHAR,
                record_count INTEGER,
                storage_location VARCHAR,
                storage_type VARCHAR,
                is_current BOOLEAN DEFAULT FALSE,
                effective_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.con.execute("""
            CREATE TABLE IF NOT EXISTS meter_readings_archive (
                archive_id VARCHAR,
                version INTEGER,
                id VARCHAR,
                apartment_id VARCHAR,
                room_id VARCHAR,
                reading_date DATE,
                water_meter DOUBLE,
                electric_meter DOUBLE,
                gas_meter DOUBLE,
                source VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.con.execute("""
            CREATE TABLE IF NOT EXISTS e_contracts_archive (
                archive_id VARCHAR,
                version INTEGER,
                id VARCHAR,
                contract_no VARCHAR,
                apartment_id VARCHAR,
                room_id VARCHAR,
                tenant_name VARCHAR,
                start_date DATE,
                end_date DATE,
                cleaning_frequency VARCHAR,
                cleaning_weekday VARCHAR,
                cleaning_time_slot VARCHAR,
                is_current BOOLEAN,
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

    def get_next_version(self, category: str) -> int:
        sql = f"SELECT COALESCE(MAX(version), 0) + 1 FROM data_versions WHERE category = '{category}'"
        result = self.con.execute(sql).fetchone()
        return result[0] if result else 1

    def save_version(
        self,
        category: str,
        df: pl.DataFrame,
        description: str,
        effective_date,
        storage_location: str = "",
        storage_type: str = "duckdb_archive"
    ) -> Dict:
        version = self.get_next_version(category)
        version_id = f"{category}_v{version}"
        record_count = len(df)

        self.con.execute("""
            UPDATE data_versions SET is_current = FALSE WHERE category = ?
        """, [category])

        self.con.execute("""
            INSERT INTO data_versions (
                id, category, version, description, record_count,
                storage_location, storage_type, is_current, effective_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, ?)
        """, [
            version_id, category, version, description, record_count,
            storage_location, storage_type, effective_date
        ])

        archive_table = f"{category}_archive"
        if archive_table in self.get_table_names():
            archive_df = df.with_columns([
                pl.lit(version_id).alias("archive_id"),
                pl.lit(version).alias("version"),
            ])
            if "version" in archive_df.columns and "version" in df.columns:
                archive_df = archive_df.drop("version")
                archive_df = df.with_columns([
                    pl.lit(version_id).alias("archive_id"),
                    pl.lit(version).alias("version"),
                ])
            cols_to_insert = [c for c in archive_df.columns if c not in ["created_at"]]
            cols_str = ", ".join(cols_to_insert)
            temp_name = f"temp_archive_{id(df)}"
            self.con.register(temp_name, archive_df.select(cols_to_insert))
            self.con.execute(f"INSERT INTO {archive_table} ({cols_str}) SELECT {cols_str} FROM {temp_name}")
            self.con.unregister(temp_name)

        return {
            "id": version_id,
            "category": category,
            "version": version,
            "record_count": record_count,
        }

    def list_versions(self, category: Optional[str] = None) -> pl.DataFrame:
        sql = "SELECT * FROM data_versions"
        if category:
            sql += f" WHERE category = '{category}'"
        sql += " ORDER BY category, version DESC"
        return self.query(sql)

    def get_version_data(self, category: str, version: int) -> Optional[pl.DataFrame]:
        archive_table = f"{category}_archive"
        if archive_table not in self.get_table_names():
            return None
        return self.query(f"SELECT * FROM {archive_table} WHERE version = {version}")

    def get_current_version(self, category: str) -> Optional[Dict]:
        sql = f"SELECT * FROM data_versions WHERE category = '{category}' AND is_current = TRUE ORDER BY version DESC LIMIT 1"
        result = self.query(sql)
        if len(result) == 0:
            return None
        return result.row(0, named=True)

    def close(self):
        self.con.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
