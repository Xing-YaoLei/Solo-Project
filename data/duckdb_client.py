import os
import duckdb
import polars as pl
from typing import Optional, List, Dict, Any, Union
import logging

from config import config

logger = logging.getLogger(__name__)


class DuckDBClient:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or config.duckdb.db_path
        self._ensure_data_dir()
        self.conn = duckdb.connect(self.db_path)
        self._init_tables()

    def _ensure_data_dir(self):
        data_dir = os.path.dirname(self.db_path)
        if data_dir and not os.path.exists(data_dir):
            os.makedirs(data_dir, exist_ok=True)
            logger.info(f"Created data directory: {data_dir}")

    def _init_tables(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS elders (
                elder_id VARCHAR PRIMARY KEY,
                name VARCHAR,
                gender VARCHAR,
                age INTEGER,
                room_number VARCHAR,
                admission_date DATE,
                health_level VARCHAR,
                care_level VARCHAR,
                medical_history VARCHAR,
                contact_person VARCHAR,
                contact_phone VARCHAR,
                notes VARCHAR
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS rehabilitation_activities (
                activity_id VARCHAR PRIMARY KEY,
                activity_name VARCHAR,
                activity_type VARCHAR,
                plan_date DATE,
                plan_start_time VARCHAR,
                plan_end_time VARCHAR,
                actual_start_time TIMESTAMP,
                actual_end_time TIMESTAMP,
                elder_id VARCHAR,
                elder_name VARCHAR,
                therapist VARCHAR,
                status VARCHAR,
                checkin_time TIMESTAMP,
                is_compliant BOOLEAN,
                non_compliant_reason VARCHAR,
                data_source VARCHAR,
                notes VARCHAR
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS risk_events (
                event_id VARCHAR PRIMARY KEY,
                event_type VARCHAR,
                event_time TIMESTAMP,
                elder_id VARCHAR,
                elder_name VARCHAR,
                location VARCHAR,
                risk_level VARCHAR,
                description VARCHAR,
                handler VARCHAR,
                handle_time TIMESTAMP,
                handle_result VARCHAR,
                follow_up_required BOOLEAN,
                follow_up_notes VARCHAR,
                is_impact_trend BOOLEAN,
                impact_days INTEGER
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS activity_checkins (
                checkin_id VARCHAR PRIMARY KEY,
                activity_id VARCHAR,
                elder_id VARCHAR,
                elder_name VARCHAR,
                checkin_time TIMESTAMP,
                checkin_method VARCHAR,
                terminal_id VARCHAR,
                is_late BOOLEAN,
                delay_minutes INTEGER,
                data_source VARCHAR
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS anomaly_records (
                anomaly_id VARCHAR PRIMARY KEY,
                anomaly_type VARCHAR,
                detect_time TIMESTAMP,
                description VARCHAR,
                affected_period_start TIMESTAMP,
                affected_period_end TIMESTAMP,
                affected_elder_ids VARCHAR,
                severity VARCHAR,
                review_notes VARCHAR,
                handle_conclusion VARCHAR,
                is_resolved BOOLEAN
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS compliance_tasks (
                task_id VARCHAR PRIMARY KEY,
                elder_id VARCHAR,
                elder_name VARCHAR,
                task_type VARCHAR,
                compliance_rate DOUBLE,
                threshold DOUBLE,
                create_time TIMESTAMP,
                due_time TIMESTAMP,
                handler VARCHAR,
                status VARCHAR,
                notes VARCHAR,
                resolution VARCHAR,
                resolve_time TIMESTAMP
            )
        """)

        logger.info("Database tables initialized")

    def execute_query(self, query: str, params: Optional[tuple] = None) -> pl.DataFrame:
        try:
            if params:
                result = self.conn.execute(query, params).pl()
            else:
                result = self.conn.execute(query).pl()
            return result
        except Exception as e:
            logger.error(f"Query failed: {e}")
            raise

    def insert_dataframe(self, table_name: str, df: pl.DataFrame) -> int:
        try:
            self.conn.register('temp_df', df)
            self.conn.execute(f"INSERT INTO {table_name} SELECT * FROM temp_df")
            self.conn.unregister('temp_df')
            return len(df)
        except Exception as e:
            logger.error(f"Insert failed for {table_name}: {e}")
            raise

    def upsert_dataframe(self, table_name: str, df: pl.DataFrame, primary_key: str) -> int:
        try:
            temp_table = f"temp_{table_name}"
            self.conn.register(temp_table, df)
            
            columns = [col for col in df.columns]
            update_cols = [col for col in columns if col != primary_key]
            
            update_stmt = ", ".join([f"{col} = EXCLUDED.{col}" for col in update_cols])
            
            query = f"""
                INSERT INTO {table_name} ({', '.join(columns)})
                SELECT {', '.join(columns)} FROM {temp_table}
                ON CONFLICT ({primary_key}) DO UPDATE SET {update_stmt}
            """
            
            self.conn.execute(query)
            self.conn.unregister(temp_table)
            return len(df)
        except Exception as e:
            logger.error(f"Upsert failed for {table_name}: {e}")
            raise

    def read_table(self, table_name: str, filters: Optional[str] = None) -> pl.DataFrame:
        query = f"SELECT * FROM {table_name}"
        if filters:
            query += f" WHERE {filters}"
        return self.execute_query(query)

    def get_elders(self) -> pl.DataFrame:
        return self.read_table("elders")

    def get_activities(self, start_date: Optional[str] = None, 
                       end_date: Optional[str] = None) -> pl.DataFrame:
        filters = []
        if start_date:
            filters.append(f"plan_date >= '{start_date}'")
        if end_date:
            filters.append(f"plan_date <= '{end_date}'")
        filter_str = " AND ".join(filters) if filters else None
        return self.read_table("rehabilitation_activities", filter_str)

    def get_risk_events(self, event_type: Optional[str] = None) -> pl.DataFrame:
        filters = f"event_type = '{event_type}'" if event_type else None
        return self.read_table("risk_events", filters)

    def get_checkins(self, activity_id: Optional[str] = None) -> pl.DataFrame:
        filters = f"activity_id = '{activity_id}'" if activity_id else None
        return self.read_table("activity_checkins", filters)

    def get_anomalies(self, anomaly_type: Optional[str] = None, 
                      unresolved_only: bool = False) -> pl.DataFrame:
        filters = []
        if anomaly_type:
            filters.append(f"anomaly_type = '{anomaly_type}'")
        if unresolved_only:
            filters.append("is_resolved = false")
        filter_str = " AND ".join(filters) if filters else None
        return self.read_table("anomaly_records", filter_str)

    def get_compliance_tasks(self, status: Optional[str] = None) -> pl.DataFrame:
        filters = f"status = '{status}'" if status else None
        return self.read_table("compliance_tasks", filters)

    def update_anomaly_conclusion(self, anomaly_id: str, conclusion: str, 
                                  resolved: bool = True) -> bool:
        try:
            query = """
                UPDATE anomaly_records 
                SET handle_conclusion = ?, is_resolved = ?
                WHERE anomaly_id = ?
            """
            self.conn.execute(query, (conclusion, resolved, anomaly_id))
            return True
        except Exception as e:
            logger.error(f"Failed to update anomaly {anomaly_id}: {e}")
            return False

    def update_compliance_task(self, task_id: str, resolution: str, 
                               status: str = "resolved") -> bool:
        try:
            from datetime import datetime
            query = """
                UPDATE compliance_tasks 
                SET resolution = ?, status = ?, resolve_time = ?
                WHERE task_id = ?
            """
            self.conn.execute(query, (resolution, status, datetime.now(), task_id))
            return True
        except Exception as e:
            logger.error(f"Failed to update task {task_id}: {e}")
            return False

    def get_funnel_data(self, start_date: str, end_date: str) -> pl.DataFrame:
        query = f"""
            SELECT 
                '活动计划' as stage,
                COUNT(*) as count
            FROM rehabilitation_activities
            WHERE plan_date BETWEEN '{start_date}' AND '{end_date}'
            
            UNION ALL
            
            SELECT 
                '活动通知' as stage,
                COUNT(*) as count
            FROM rehabilitation_activities
            WHERE plan_date BETWEEN '{start_date}' AND '{end_date}'
              AND status != '计划中'
            
            UNION ALL
            
            SELECT 
                '老人签到' as stage,
                COUNT(*) as count
            FROM rehabilitation_activities
            WHERE plan_date BETWEEN '{start_date}' AND '{end_date}'
              AND checkin_time IS NOT NULL
            
            UNION ALL
            
            SELECT 
                '活动完成' as stage,
                COUNT(*) as count
            FROM rehabilitation_activities
            WHERE plan_date BETWEEN '{start_date}' AND '{end_date}'
              AND status = '已完成'
            
            UNION ALL
            
            SELECT 
                '护理达标' as stage,
                COUNT(*) as count
            FROM rehabilitation_activities
            WHERE plan_date BETWEEN '{start_date}' AND '{end_date}'
              AND is_compliant = true
        """
        return self.execute_query(query)

    def get_compliance_rate(self, elder_id: Optional[str] = None,
                            start_date: Optional[str] = None,
                            end_date: Optional[str] = None) -> float:
        filters = []
        if elder_id:
            filters.append(f"elder_id = '{elder_id}'")
        if start_date:
            filters.append(f"plan_date >= '{start_date}'")
        if end_date:
            filters.append(f"plan_date <= '{end_date}'")
        
        where_clause = "WHERE " + " AND ".join(filters) if filters else ""
        
        query = f"""
            SELECT 
                CASE WHEN COUNT(*) > 0 
                     THEN SUM(CASE WHEN is_compliant THEN 1 ELSE 0 END) * 100.0 / COUNT(*)
                     ELSE 0 
                END as compliance_rate
            FROM rehabilitation_activities
            {where_clause}
        """
        result = self.execute_query(query)
        return result['compliance_rate'][0] if len(result) > 0 else 0.0

    def close(self):
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
