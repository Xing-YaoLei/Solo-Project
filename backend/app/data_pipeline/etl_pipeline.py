import json
import logging
from datetime import datetime, date
from typing import Dict, List, Any
import pandas as pd
import uuid

from app.db.database import get_pg_session, get_duckdb, get_pg_engine
from app.db import models
from app.data_pipeline.cleaner import DataCleaner
from sqlalchemy import text

logger = logging.getLogger(__name__)


def _json_serializer(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if hasattr(obj, "__str__"):
        return str(obj)
    raise TypeError(f"Type {type(obj)} not serializable")


def _safe_json_dumps(obj, **kwargs) -> str:
    return json.dumps(obj, ensure_ascii=False, default=_json_serializer, **kwargs)


class ETLPipeline:
    def __init__(self):
        self.cleaner = DataCleaner()

    def _create_duckdb_tables(self, duck_conn):
        duck_conn.execute("""
            CREATE TABLE IF NOT EXISTS charging_records_clean (
                id VARCHAR,
                resident_id VARCHAR,
                resident_name VARCHAR,
                charge_date DATE,
                item_type VARCHAR,
                item_name VARCHAR,
                amount FLOAT,
                payment_method VARCHAR,
                payment_status VARCHAR,
                cleaned_at TIMESTAMP
            )
        """)
        duck_conn.execute("""
            CREATE TABLE IF NOT EXISTS access_logs_clean (
                id VARCHAR,
                resident_id VARCHAR,
                resident_name VARCHAR,
                access_time TIMESTAMP,
                direction VARCHAR,
                device_location VARCHAR,
                card_no VARCHAR,
                cleaned_at TIMESTAMP
            )
        """)
        duck_conn.execute("""
            CREATE TABLE IF NOT EXISTS health_metrics_clean (
                id VARCHAR,
                resident_id VARCHAR,
                resident_name VARCHAR,
                measure_time TIMESTAMP,
                metric_type VARCHAR,
                metric_value FLOAT,
                metric_unit VARCHAR,
                device_type VARCHAR,
                cleaned_at TIMESTAMP
            )
        """)
        duck_conn.execute("""
            CREATE TABLE IF NOT EXISTS beds (
                id VARCHAR PRIMARY KEY,
                bed_no VARCHAR UNIQUE NOT NULL,
                area VARCHAR NOT NULL,
                floor VARCHAR NOT NULL,
                status VARCHAR DEFAULT 'available'
            )
        """)
        duck_conn.execute("""
            CREATE TABLE IF NOT EXISTS residents (
                id VARCHAR PRIMARY KEY,
                name VARCHAR NOT NULL,
                age INTEGER NOT NULL,
                gender VARCHAR NOT NULL,
                care_level VARCHAR NOT NULL,
                admission_date DATE NOT NULL,
                primary_disease VARCHAR,
                bed_id VARCHAR
            )
        """)
        duck_conn.execute("""
            CREATE TABLE IF NOT EXISTS care_records (
                id VARCHAR PRIMARY KEY,
                resident_id VARCHAR NOT NULL,
                care_time TIMESTAMP NOT NULL,
                care_type VARCHAR NOT NULL,
                is_completed BOOLEAN DEFAULT true,
                caregiver VARCHAR NOT NULL
            )
        """)
        duck_conn.execute("""
            CREATE TABLE IF NOT EXISTS activities (
                id VARCHAR PRIMARY KEY,
                name VARCHAR NOT NULL,
                type VARCHAR NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                location VARCHAR
            )
        """)
        duck_conn.execute("""
            CREATE TABLE IF NOT EXISTS activity_signins (
                id VARCHAR PRIMARY KEY,
                activity_id VARCHAR NOT NULL,
                resident_id VARCHAR NOT NULL,
                signin_time TIMESTAMP NOT NULL,
                signin_type VARCHAR DEFAULT 'manual'
            )
        """)
        duck_conn.execute("""
            CREATE TABLE IF NOT EXISTS risk_events (
                id VARCHAR PRIMARY KEY,
                type VARCHAR NOT NULL,
                level VARCHAR NOT NULL,
                resident_id VARCHAR NOT NULL,
                occur_time TIMESTAMP NOT NULL,
                description TEXT
            )
        """)
        duck_conn.execute("""
            CREATE TABLE IF NOT EXISTS risk_remarks (
                id VARCHAR PRIMARY KEY,
                risk_event_id VARCHAR NOT NULL,
                content TEXT NOT NULL,
                user_name VARCHAR NOT NULL,
                remark_type VARCHAR DEFAULT 'initial',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        duck_conn.execute("""
            CREATE TABLE IF NOT EXISTS threshold_configs (
                id VARCHAR PRIMARY KEY,
                metric_key VARCHAR UNIQUE NOT NULL,
                metric_name VARCHAR NOT NULL,
                warning_threshold FLOAT NOT NULL,
                critical_threshold FLOAT NOT NULL,
                unit VARCHAR DEFAULT '%',
                updated_by VARCHAR,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        duck_conn.execute("""
            CREATE TABLE IF NOT EXISTS threshold_change_logs (
                id VARCHAR PRIMARY KEY,
                threshold_id VARCHAR NOT NULL,
                old_warning FLOAT NOT NULL,
                new_warning FLOAT NOT NULL,
                old_critical FLOAT NOT NULL,
                new_critical FLOAT NOT NULL,
                changed_by VARCHAR NOT NULL,
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

    def _sync_core_tables_to_duckdb(self, pg_session, duck_conn):
        tables = [
            ("beds", models.Bed, ["id", "bed_no", "area", "floor", "status"]),
            ("residents", models.Resident, ["id", "name", "age", "gender", "care_level", "admission_date", "primary_disease", "bed_id"]),
            ("care_records", models.CareRecord, ["id", "resident_id", "care_time", "care_type", "is_completed", "caregiver"]),
            ("activities", models.Activity, ["id", "name", "type", "start_time", "end_time", "location"]),
            ("activity_signins", models.ActivitySignin, ["id", "activity_id", "resident_id", "signin_time", "signin_type"]),
            ("risk_events", models.RiskEvent, ["id", "type", "level", "resident_id", "occur_time", "description"]),
            ("risk_remarks", models.RiskRemark, ["id", "risk_event_id", "content", "user_name", "remark_type", "created_at"]),
            ("threshold_configs", models.ThresholdConfig, ["id", "metric_key", "metric_name", "warning_threshold", "critical_threshold", "unit", "updated_by", "updated_at"]),
            ("threshold_change_logs", models.ThresholdChangeLog, ["id", "threshold_id", "old_warning", "new_warning", "old_critical", "new_critical", "changed_by", "changed_at"]),
        ]
        for table_name, model_cls, cols in tables:
            try:
                records = pg_session.query(model_cls).all()
                if not records:
                    continue
                data = []
                for r in records:
                    row = {}
                    for c in cols:
                        row[c] = getattr(r, c)
                    data.append(row)
                df = pd.DataFrame(data, columns=cols)
                if not df.empty:
                    duck_conn.execute(f"DELETE FROM {table_name}")
                    placeholders = ", ".join(["?" for _ in cols])
                    col_list = ", ".join(cols)
                    duck_conn.executemany(
                        f"INSERT INTO {table_name} ({col_list}) VALUES ({placeholders})",
                        df.values.tolist()
                    )
                    logger.info(f"已同步 {len(df)} 条记录到 DuckDB.{table_name}")
            except Exception as e:
                logger.error(f"同步 {table_name} 到 DuckDB 失败: {e}")

    def _update_duckdb_from_clean_tables(self, duck_conn):
        try:
            care_level_mapping = """
                SELECT
                    resident_id,
                    CASE
                        WHEN item_type IN ('care_independent', '自理', 'independent')
                             OR item_name LIKE '%自理%' THEN 'independent'
                        WHEN item_type IN ('care_semi', '半自理', 'semi', 'semi_dependent')
                             OR item_name LIKE '%半自理%' OR item_name LIKE '%半护%' THEN 'semi_dependent'
                        WHEN item_type IN ('care_dependent', '全护理', 'dependent')
                             OR item_name LIKE '%全护理%' OR item_name LIKE '%全护%' OR item_name LIKE '%专护%' THEN 'dependent'
                        WHEN item_type IN ('care_special', '特护', 'special')
                             OR item_name LIKE '%特护%' THEN 'special'
                        ELSE NULL
                    END as inferred_level
                FROM charging_records_clean
                WHERE charge_date >= CURRENT_DATE - 30
                  AND (
                    item_type LIKE 'care_%'
                    OR item_type IN ('自理', '半自理', '全护理', '特护', '护理费', '护理服务费',
                                     'semi', 'dependent', 'independent', 'special')
                    OR item_name LIKE '%护理%' OR item_name LIKE '%护%'
                  )
            """
            resident_levels = duck_conn.execute(f"""
                SELECT resident_id, inferred_level
                FROM (
                    {care_level_mapping}
                ) AS t
                WHERE inferred_level IS NOT NULL
                GROUP BY resident_id, inferred_level
                ORDER BY resident_id
            """).fetchall()
            updated_residents = 0
            for rid, level in resident_levels:
                if rid and level:
                    duck_conn.execute(
                        "UPDATE residents SET care_level = ? WHERE id = ? AND care_level != ?",
                        [level, rid, level]
                    )
                    updated_residents += 1
            if updated_residents:
                logger.info(f"根据 charging clean 表口径更新 {updated_residents} 位老人护理等级")
        except Exception as e:
            logger.warning(f"根据 clean 表更新 residents 护理等级时跳过: {e}")

        try:
            bed_residents = duck_conn.execute("""
                SELECT DISTINCT r.bed_id
                FROM residents r
                JOIN charging_records_clean c ON r.id = c.resident_id
                WHERE c.charge_date >= CURRENT_DATE - 30
                  AND r.bed_id IS NOT NULL
                  AND (c.item_type IN ('accommodation', 'bed', '床位费', '住宿费')
                       OR c.item_name LIKE '%床位%' OR c.item_name LIKE '%住宿%')
            """).fetchall()
            updated_beds = 0
            for (bed_id,) in bed_residents:
                if bed_id:
                    duck_conn.execute(
                        "UPDATE beds SET status = 'occupied' WHERE id = ? AND status != 'occupied'",
                        [bed_id]
                    )
                    updated_beds += 1
            if updated_beds:
                logger.info(f"根据 charging clean 表口径更新 {updated_beds} 张床位状态为 occupied")
        except Exception as e:
            logger.warning(f"根据 clean 表更新 beds 状态时跳过: {e}")

    def extract_charging_data(self, pg_session) -> pd.DataFrame:
        records = pg_session.query(models.ChargingRecord).filter(
            models.ChargingRecord.is_cleaned == False
        ).all()
        if not records:
            return pd.DataFrame()
        data = []
        for r in records:
            data.append({
                "id": r.id,
                "resident_id": self.cleaner.normalize_resident_id(r.resident_id),
                "resident_name": r.resident_name,
                "charge_date": r.charge_date,
                "item_type": r.item_type,
                "item_name": r.item_name,
                "amount": r.amount,
                "payment_method": r.payment_method,
                "payment_status": r.payment_status,
            })
        return pd.DataFrame(data)

    def extract_access_data(self, pg_session) -> pd.DataFrame:
        records = pg_session.query(models.AccessLog).filter(
            models.AccessLog.is_cleaned == False
        ).all()
        if not records:
            return pd.DataFrame()
        data = []
        for r in records:
            data.append({
                "id": r.id,
                "resident_id": self.cleaner.normalize_resident_id(r.resident_id),
                "resident_name": r.resident_name,
                "access_time": r.access_time,
                "direction": r.direction,
                "device_location": r.device_location,
                "card_no": r.card_no,
            })
        return pd.DataFrame(data)

    def extract_health_data(self, pg_session) -> pd.DataFrame:
        records = pg_session.query(models.HealthMetric).filter(
            models.HealthMetric.is_cleaned == False
        ).all()
        if not records:
            return pd.DataFrame()
        data = []
        for r in records:
            data.append({
                "id": r.id,
                "resident_id": self.cleaner.normalize_resident_id(r.resident_id),
                "resident_name": r.resident_name,
                "measure_time": r.measure_time,
                "metric_type": r.metric_type,
                "metric_value": r.metric_value,
                "metric_unit": r.metric_unit,
                "device_type": r.device_type,
            })
        return pd.DataFrame(data)

    def transform_charging_data(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df
        cleaned_df = self.cleaner.clean_charging_data(df)
        if "care_level" in cleaned_df.columns:
            cleaned_df["care_level"] = cleaned_df["care_level"].apply(self.cleaner.standardize_care_level)
        cleaned_df["cleaned_at"] = datetime.now()
        return cleaned_df

    def transform_access_data(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df
        cleaned_df = self.cleaner.clean_access_control_data(df)
        cleaned_df["cleaned_at"] = datetime.now()
        return cleaned_df

    def transform_health_data(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df
        cleaned_df = self.cleaner.clean_health_device_data(df)
        cleaned_df["cleaned_at"] = datetime.now()
        return cleaned_df

    def load_cleaned_charging(self, duck_conn, cleaned_df: pd.DataFrame) -> int:
        if cleaned_df.empty:
            return 0
        duck_conn.register("charging_tmp", cleaned_df)
        duck_conn.execute("""
            INSERT INTO charging_records_clean
            SELECT id, resident_id, resident_name, charge_date, item_type,
                   item_name, amount, payment_method, payment_status, cleaned_at
            FROM charging_tmp
        """)
        duck_conn.unregister("charging_tmp")
        return len(cleaned_df)

    def load_cleaned_access(self, duck_conn, cleaned_df: pd.DataFrame) -> int:
        if cleaned_df.empty:
            return 0
        duck_conn.register("access_tmp", cleaned_df)
        duck_conn.execute("""
            INSERT INTO access_logs_clean
            SELECT id, resident_id, resident_name, access_time, direction,
                   device_location, card_no, cleaned_at
            FROM access_tmp
        """)
        duck_conn.unregister("access_tmp")
        return len(cleaned_df)

    def load_cleaned_health(self, duck_conn, cleaned_df: pd.DataFrame) -> int:
        if cleaned_df.empty:
            return 0
        duck_conn.register("health_tmp", cleaned_df)
        duck_conn.execute("""
            INSERT INTO health_metrics_clean
            SELECT id, resident_id, resident_name, measure_time, metric_type,
                   metric_value, metric_unit, device_type, cleaned_at
            FROM health_tmp
        """)
        duck_conn.unregister("health_tmp")
        return len(cleaned_df)

    def _mark_as_cleaned(self, pg_session, cleaned_ids: List[str], model_cls):
        if not cleaned_ids:
            return
        pg_session.query(model_cls).filter(
            model_cls.id.in_(cleaned_ids)
        ).update({model_cls.is_cleaned: True}, synchronize_session=False)
        pg_session.commit()

    def run_full_pipeline(self) -> Dict[str, Any]:
        pg_session = get_pg_session()
        duck_conn = get_duckdb()
        import_log = None
        result = {
            "charging": {"extracted": 0, "cleaned": 0, "loaded": 0},
            "access": {"extracted": 0, "cleaned": 0, "loaded": 0},
            "health": {"extracted": 0, "cleaned": 0, "loaded": 0},
            "core_tables_synced": False,
            "status": "success",
        }
        try:
            self._create_duckdb_tables(duck_conn)

            charging_raw = self.extract_charging_data(pg_session)
            result["charging"]["extracted"] = len(charging_raw)
            charging_cleaned = self.transform_charging_data(charging_raw)
            result["charging"]["cleaned"] = len(charging_cleaned)
            result["charging"]["loaded"] = self.load_cleaned_charging(duck_conn, charging_cleaned)
            if not charging_cleaned.empty:
                self._mark_as_cleaned(pg_session, charging_cleaned["id"].tolist(), models.ChargingRecord)

            access_raw = self.extract_access_data(pg_session)
            result["access"]["extracted"] = len(access_raw)
            access_cleaned = self.transform_access_data(access_raw)
            result["access"]["cleaned"] = len(access_cleaned)
            result["access"]["loaded"] = self.load_cleaned_access(duck_conn, access_cleaned)
            if not access_cleaned.empty:
                self._mark_as_cleaned(pg_session, access_cleaned["id"].tolist(), models.AccessLog)

            health_raw = self.extract_health_data(pg_session)
            result["health"]["extracted"] = len(health_raw)
            health_cleaned = self.transform_health_data(health_raw)
            result["health"]["cleaned"] = len(health_cleaned)
            result["health"]["loaded"] = self.load_cleaned_health(duck_conn, health_cleaned)
            if not health_cleaned.empty:
                self._mark_as_cleaned(pg_session, health_cleaned["id"].tolist(), models.HealthMetric)

            self._sync_core_tables_to_duckdb(pg_session, duck_conn)
            self._update_duckdb_from_clean_tables(duck_conn)
            result["core_tables_synced"] = True

        except Exception as e:
            logger.error(f"ETL 管道运行失败: {e}")
            result["status"] = "failed"
            result["error"] = str(e)
        finally:
            pg_session.close()
        return result

    def import_charging_batch(self, records: List[Dict]) -> Dict[str, Any]:
        pg_session = get_pg_session()
        result = {"total": len(records), "inserted": 0, "duplicates": 0, "errors": 0}
        error_messages = []
        try:
            for rec in records:
                try:
                    obj = models.ChargingRecord(
                        id=str(uuid.uuid4()),
                        resident_id=str(rec.get("resident_id", "")),
                        resident_name=rec.get("resident_name"),
                        charge_date=rec.get("charge_date"),
                        item_type=rec.get("item_type"),
                        item_name=rec.get("item_name"),
                        amount=float(rec.get("amount", 0)),
                        payment_method=rec.get("payment_method"),
                        payment_status=rec.get("payment_status", "paid"),
                        source_system=rec.get("source_system", "charging_system"),
                        raw_data=_safe_json_dumps(rec),
                        is_cleaned=False,
                    )
                    pg_session.add(obj)
                    pg_session.commit()
                    result["inserted"] += 1
                except Exception as e:
                    pg_session.rollback()
                    if "unique" in str(e).lower() or "duplicate" in str(e).lower():
                        result["duplicates"] += 1
                    else:
                        result["errors"] += 1
                        error_messages.append(str(e))
        finally:
            pg_session.close()
        if error_messages:
            result["error_messages"] = error_messages[:5]
        return result

    def import_access_batch(self, records: List[Dict]) -> Dict[str, Any]:
        pg_session = get_pg_session()
        result = {"total": len(records), "inserted": 0, "duplicates": 0, "errors": 0}
        error_messages = []
        try:
            for rec in records:
                try:
                    obj = models.AccessLog(
                        id=str(uuid.uuid4()),
                        resident_id=str(rec.get("resident_id", "")),
                        resident_name=rec.get("resident_name"),
                        access_time=rec.get("access_time"),
                        direction=str(rec.get("direction", "")).lower().strip(),
                        device_id=rec.get("device_id"),
                        device_location=rec.get("device_location"),
                        card_no=rec.get("card_no"),
                        source_system=rec.get("source_system", "access_control"),
                        raw_data=_safe_json_dumps(rec),
                        is_cleaned=False,
                    )
                    pg_session.add(obj)
                    pg_session.commit()
                    result["inserted"] += 1
                except Exception as e:
                    pg_session.rollback()
                    if "unique" in str(e).lower() or "duplicate" in str(e).lower():
                        result["duplicates"] += 1
                    else:
                        result["errors"] += 1
                        error_messages.append(str(e))
        finally:
            pg_session.close()
        if error_messages:
            result["error_messages"] = error_messages[:5]
        return result

    def import_health_batch(self, records: List[Dict]) -> Dict[str, Any]:
        pg_session = get_pg_session()
        result = {"total": len(records), "inserted": 0, "duplicates": 0, "errors": 0}
        error_messages = []
        try:
            for rec in records:
                try:
                    obj = models.HealthMetric(
                        id=str(uuid.uuid4()),
                        resident_id=str(rec.get("resident_id", "")),
                        resident_name=rec.get("resident_name"),
                        measure_time=rec.get("measure_time"),
                        metric_type=str(rec.get("metric_type", "")).strip(),
                        metric_value=float(rec.get("metric_value", 0)),
                        metric_unit=rec.get("metric_unit"),
                        device_id=rec.get("device_id"),
                        device_type=rec.get("device_type"),
                        source_system=rec.get("source_system", "health_device"),
                        raw_data=_safe_json_dumps(rec),
                        is_cleaned=False,
                    )
                    pg_session.add(obj)
                    pg_session.commit()
                    result["inserted"] += 1
                except Exception as e:
                    pg_session.rollback()
                    if "unique" in str(e).lower() or "duplicate" in str(e).lower():
                        result["duplicates"] += 1
                    else:
                        result["errors"] += 1
                        error_messages.append(str(e))
        finally:
            pg_session.close()
        if error_messages:
            result["error_messages"] = error_messages[:5]
        return result


etl_pipeline = ETLPipeline()
