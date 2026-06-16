import polars as pl
from datetime import date, timedelta, datetime
from typing import Tuple, List, Dict, Optional
import uuid

from database import get_db
from data_models import RISK_LEVELS, RISK_COLORS
from storage import get_minio
from config import config


class RiskDataService:
    def __init__(self):
        self.db = get_db()

    def get_sync_status(self) -> Dict:
        df = self.db.query("""
            SELECT
                CAST(last_fee_table_sync AS DATE) as last_fee_table_sync,
                CAST(last_medical_record_sync AS DATE) as last_medical_record_sync,
                CAST(last_device_sync AS DATE) as last_device_sync,
                CAST(last_insurance_sync AS DATE) as last_insurance_sync,
                refresh_timestamp
            FROM data_sync_status WHERE id = 1
        """)
        if df.is_empty():
            return {}
        row = df.row(0, named=True)

        def normalize_date(val):
            if val is None:
                return None
            try:
                s = str(val)[:10]
                return date(int(s[:4]), int(s[5:7]), int(s[8:10]))
            except:
                return None

        def normalize_datetime(val):
            if val is None:
                return None
            return val

        return {
            "last_fee_table_sync": normalize_date(row.get("last_fee_table_sync")),
            "last_medical_record_sync": normalize_date(row.get("last_medical_record_sync")),
            "last_device_sync": normalize_date(row.get("last_device_sync")),
            "last_insurance_sync": normalize_date(row.get("last_insurance_sync")),
            "refresh_timestamp": normalize_datetime(row.get("refresh_timestamp"))
        }

    def get_patient_summary(self, risk_level: Optional[str] = None,
                            diagnosis: Optional[str] = None) -> pl.DataFrame:
        sql = """
            SELECT
                p.patient_id,
                p.name,
                p.age,
                p.gender,
                p.primary_diagnosis,
                p.admission_date,
                p.risk_level,
                p.risk_score,
                p.insurance_type,
                p.attending_physician,
                r.training_completion_rate,
                r.fee_table_updated,
                r.medical_record_complete,
                r.device_calibration_current,
                r.insurance_denial
            FROM patients p
            LEFT JOIN (
                SELECT patient_id, MAX(record_date) as max_date
                FROM patient_risk_daily
                GROUP BY patient_id
            ) latest ON p.patient_id = latest.patient_id
            LEFT JOIN patient_risk_daily r
                ON p.patient_id = r.patient_id AND latest.max_date = r.record_date
            WHERE p.discharge_date IS NULL
        """
        conditions = []
        params = []
        if risk_level:
            conditions.append("p.risk_level = ?")
            params.append(risk_level)
        if diagnosis:
            conditions.append("p.primary_diagnosis LIKE ?")
            params.append(f"%{diagnosis}%")
        if conditions:
            sql += " AND " + " AND ".join(conditions)

        sql += " ORDER BY p.risk_score DESC"
        return self.db.query(sql, params)

    def get_risk_trend(self, start_date: date, end_date: date,
                       patient_ids: Optional[List[str]] = None,
                       aggregate: str = "avg") -> pl.DataFrame:
        agg_func = {
            "avg": "AVG",
            "max": "MAX",
            "min": "MIN"
        }.get(aggregate, "AVG")

        sql = f"""
            SELECT
                record_date,
                {agg_func}(CASE WHEN risk_level = '低危' THEN risk_score END) as score_low,
                {agg_func}(CASE WHEN risk_level = '中低危' THEN risk_score END) as score_mid_low,
                {agg_func}(CASE WHEN risk_level = '中危' THEN risk_score END) as score_mid,
                {agg_func}(CASE WHEN risk_level = '中高危' THEN risk_score END) as score_mid_high,
                {agg_func}(CASE WHEN risk_level = '高危' THEN risk_score END) as score_high,
                {agg_func}(risk_score) as score_avg,
                SUM(CASE WHEN NOT fee_table_updated THEN 1 ELSE 0 END) as fee_delay_count,
                SUM(CASE WHEN NOT medical_record_complete THEN 1 ELSE 0 END) as record_gap_count,
                SUM(CASE WHEN NOT device_calibration_current THEN 1 ELSE 0 END) as device_change_count,
                SUM(CASE WHEN insurance_denial THEN 1 ELSE 0 END) as insurance_denial_count,
                {agg_func}(training_completion_rate) as training_rate,
                COUNT(*) as patient_count
            FROM patient_risk_daily
            WHERE record_date BETWEEN ? AND ?
        """
        params = [start_date, end_date]

        if patient_ids:
            placeholders = ",".join(["?" for _ in patient_ids])
            sql += f" AND patient_id IN ({placeholders})"
            params.extend(patient_ids)

        sql += " GROUP BY record_date ORDER BY record_date"
        return self.db.query(sql, params)

    def get_patient_risk_detail(self, patient_id: str,
                                start_date: Optional[date] = None,
                                end_date: Optional[date] = None) -> pl.DataFrame:
        sql = """
            SELECT * FROM patient_risk_daily
            WHERE patient_id = ?
        """
        params = [patient_id]
        if start_date and end_date:
            sql += " AND record_date BETWEEN ? AND ?"
            params.extend([start_date, end_date])
        sql += " ORDER BY record_date"
        return self.db.query(sql, params)

    def get_fee_delay_events(self, start_date: Optional[date] = None,
                             end_date: Optional[date] = None) -> pl.DataFrame:
        sql = "SELECT * FROM fee_table_sync_log WHERE delay_days > 0"
        params = []
        if start_date and end_date:
            sql += " AND expected_date BETWEEN ? AND ?"
            params.extend([start_date, end_date])
        sql += " ORDER BY expected_date"
        return self.db.query(sql, params)

    def get_medical_record_gaps(self, start_date: Optional[date] = None,
                                end_date: Optional[date] = None,
                                patient_id: Optional[str] = None) -> pl.DataFrame:
        sql = "SELECT * FROM medical_record_gaps WHERE 1=1"
        params = []
        if start_date and end_date:
            sql += " AND gap_date BETWEEN ? AND ?"
            params.extend([start_date, end_date])
        if patient_id:
            sql += " AND patient_id = ?"
            params.append(patient_id)
        sql += " ORDER BY gap_date DESC"
        return self.db.query(sql, params)

    def get_device_changes(self, start_date: Optional[date] = None,
                           end_date: Optional[date] = None) -> pl.DataFrame:
        sql = "SELECT * FROM device_calibration_changes WHERE 1=1"
        params = []
        if start_date and end_date:
            sql += " AND change_date BETWEEN ? AND ?"
            params.extend([start_date, end_date])
        sql += " ORDER BY change_date DESC"
        return self.db.query(sql, params)

    def get_insurance_denials(self, start_date: Optional[date] = None,
                              end_date: Optional[date] = None,
                              patient_id: Optional[str] = None) -> pl.DataFrame:
        sql = """
            SELECT d.*, p.name as patient_name, p.primary_diagnosis
            FROM insurance_denials d
            LEFT JOIN patients p ON d.patient_id = p.patient_id
            WHERE 1=1
        """
        params = []
        if start_date and end_date:
            sql += " AND d.denial_date BETWEEN ? AND ?"
            params.extend([start_date, end_date])
        if patient_id:
            sql += " AND d.patient_id = ?"
            params.append(patient_id)
        sql += " ORDER BY d.denial_date DESC"
        return self.db.query(sql, params)

    def get_insurance_denial_periods(self, start_date: date, end_date: date) -> List[Dict]:
        sql = """
            SELECT
                MIN(denial_date) as period_start,
                MAX(denial_date) as period_end,
                COUNT(*) as denial_count,
                SUM(denial_amount) as total_amount,
                COUNT(DISTINCT patient_id) as affected_patients
            FROM insurance_denials
            WHERE denial_date BETWEEN ? AND ?
        """
        params = [start_date, end_date]
        df = self.db.query(sql, params)
        if df.is_empty():
            return []

        result = []
        row = df.row(0, named=True)
        if row["denial_count"] > 0:
            denial_dates_sql = """
                SELECT DISTINCT denial_date
                FROM insurance_denials
                WHERE denial_date BETWEEN ? AND ?
                ORDER BY denial_date
            """
            dates_df = self.db.query(denial_dates_sql, [start_date, end_date])
            dates = dates_df["denial_date"].to_list()
            if dates:
                periods = []
                current_start = dates[0]
                current_end = dates[0]
                for i in range(1, len(dates)):
                    if (dates[i] - current_end).days <= 3:
                        current_end = dates[i]
                    else:
                        periods.append({
                            "start": current_start,
                            "end": current_end,
                            "duration_days": (current_end - current_start).days + 1
                        })
                        current_start = dates[i]
                        current_end = dates[i]
                periods.append({
                    "start": current_start,
                    "end": current_end,
                    "duration_days": (current_end - current_start).days + 1
                })

                for p in periods:
                    detail_sql = """
                        SELECT
                            COUNT(*) as denial_count,
                            SUM(denial_amount) as total_amount,
                            COUNT(DISTINCT patient_id) as affected_patients
                        FROM insurance_denials
                        WHERE denial_date BETWEEN ? AND ?
                    """
                    detail = self.db.query(detail_sql, [p["start"], p["end"]]).row(0, named=True)
                    result.append({
                        **p,
                        "denial_count": detail["denial_count"],
                        "total_amount": detail["total_amount"],
                        "affected_patients": detail["affected_patients"]
                    })
        return result

    def get_risk_level_distribution(self) -> Dict:
        sql = """
            SELECT risk_level, COUNT(*) as count
            FROM patients
            WHERE discharge_date IS NULL
            GROUP BY risk_level
        """
        df = self.db.query(sql)
        result = {level: 0 for level in RISK_LEVELS}
        for row in df.iter_rows(named=True):
            if row["risk_level"] in result:
                result[row["risk_level"]] = row["count"]
        return result

    def get_treatment_calendar(self, start_date: date, end_date: date,
                               patient_id: Optional[str] = None,
                               therapist: Optional[str] = None) -> pl.DataFrame:
        sql = """
            SELECT t.*, p.name as patient_name
            FROM treatment_calendar t
            LEFT JOIN patients p ON t.patient_id = p.patient_id
            WHERE t.treatment_date BETWEEN ? AND ?
        """
        params = [start_date, end_date]
        if patient_id:
            sql += " AND t.patient_id = ?"
            params.append(patient_id)
        if therapist:
            sql += " AND t.therapist = ?"
            params.append(therapist)
        sql += " ORDER BY t.treatment_date, t.patient_id"
        return self.db.query(sql, params)

    def get_device_status(self, start_date: Optional[date] = None,
                          end_date: Optional[date] = None,
                          device_id: Optional[str] = None) -> pl.DataFrame:
        sql = "SELECT * FROM device_status WHERE 1=1"
        params = []
        if start_date and end_date:
            sql += " AND status_date BETWEEN ? AND ?"
            params.extend([start_date, end_date])
        if device_id:
            sql += " AND device_id = ?"
            params.append(device_id)
        sql += " ORDER BY status_date DESC, device_id"
        return self.db.query(sql, params)

    def get_latest_device_status(self) -> pl.DataFrame:
        sql = """
            SELECT s.*
            FROM device_status s
            INNER JOIN (
                SELECT device_id, MAX(status_date) as max_date
                FROM device_status
                GROUP BY device_id
            ) latest ON s.device_id = latest.device_id AND s.status_date = latest.max_date
            ORDER BY s.device_id
        """
        return self.db.query(sql)

    def get_nursing_logs(self, start_date: date, end_date: date,
                         patient_id: Optional[str] = None,
                         shift: Optional[str] = None) -> pl.DataFrame:
        sql = """
            SELECT n.*, p.name as patient_name
            FROM nursing_logs n
            LEFT JOIN patients p ON n.patient_id = p.patient_id
            WHERE n.log_date BETWEEN ? AND ?
        """
        params = [start_date, end_date]
        if patient_id:
            sql += " AND n.patient_id = ?"
            params.append(patient_id)
        if shift:
            sql += " AND n.shift = ?"
            params.append(shift)
        sql += " ORDER BY n.log_date DESC, n.patient_id, n.shift"
        return self.db.query(sql, params)

    def get_review_notes(self, patient_id: Optional[str] = None,
                         start_date: Optional[date] = None,
                         end_date: Optional[date] = None,
                         resolved: Optional[bool] = None) -> pl.DataFrame:
        sql = """
            SELECT r.*, p.name as patient_name
            FROM review_notes r
            LEFT JOIN patients p ON r.patient_id = p.patient_id
            WHERE 1=1
        """
        params = []
        if patient_id:
            sql += " AND r.patient_id = ?"
            params.append(patient_id)
        if start_date and end_date:
            sql += " AND r.note_date BETWEEN ? AND ?"
            params.extend([start_date, end_date])
        if resolved is not None:
            sql += " AND r.resolved = ?"
            params.append(resolved)
        sql += " ORDER BY r.note_date DESC"
        return self.db.query(sql, params)

    def add_review_note(self, patient_id: str, related_record_id: Optional[str],
                        note_date: date, anomaly_type: str,
                        anomaly_description: str, review_note: str,
                        reviewer: str, follow_up_action: str) -> str:
        import uuid
        note_id = f"NOTE-{uuid.uuid4().hex[:12]}"
        sql = """
            INSERT INTO review_notes
            (note_id, patient_id, related_record_id, note_date, anomaly_type,
             anomaly_description, review_note, reviewer, follow_up_action, resolved)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)
        """
        self.db.execute(sql, [
            note_id, patient_id, related_record_id, note_date, anomaly_type,
            anomaly_description, review_note, reviewer, follow_up_action
        ])
        return note_id

    def resolve_review_note(self, note_id: str):
        sql = "UPDATE review_notes SET resolved = TRUE WHERE note_id = ?"
        self.db.execute(sql, [note_id])

    def get_anomaly_points(self, start_date: date, end_date: date,
                           patient_ids: Optional[List[str]] = None) -> pl.DataFrame:
        sql = """
            SELECT
                r.record_date,
                r.patient_id,
                p.name as patient_name,
                r.risk_score,
                r.fee_table_updated,
                r.medical_record_complete,
                r.device_calibration_current,
                r.insurance_denial,
                r.insurance_denial_amount,
                CASE
                    WHEN NOT r.fee_table_updated THEN '收费表延迟'
                    WHEN NOT r.medical_record_complete THEN '病历缺失'
                    WHEN NOT r.device_calibration_current THEN '设备口径变化'
                    WHEN r.insurance_denial THEN '医保拒付'
                    ELSE '正常'
                END as anomaly_type
            FROM patient_risk_daily r
            LEFT JOIN patients p ON r.patient_id = p.patient_id
            WHERE r.record_date BETWEEN ? AND ?
                AND (NOT r.fee_table_updated
                    OR NOT r.medical_record_complete
                    OR NOT r.device_calibration_current
                    OR r.insurance_denial)
        """
        params = [start_date, end_date]
        if patient_ids:
            placeholders = ",".join(["?" for _ in patient_ids])
            sql += f" AND r.patient_id IN ({placeholders})"
            params.extend(patient_ids)
        sql += " ORDER BY r.record_date DESC, r.risk_score DESC"
        return self.db.query(sql, params)

    def get_diagnoses_list(self) -> List[str]:
        sql = "SELECT DISTINCT primary_diagnosis FROM patients ORDER BY primary_diagnosis"
        df = self.db.query(sql)
        return df["primary_diagnosis"].to_list()

    def get_all_patients(self) -> pl.DataFrame:
        return self.db.query(
            "SELECT patient_id, name, risk_level FROM patients WHERE discharge_date IS NULL ORDER BY name"
        )

    def create_archive_record(self, export_type: str, object_name: str, file_name: str,
                              date_from: Optional[date] = None, date_to: Optional[date] = None,
                              file_size_bytes: int = 0, record_count: int = 0,
                              file_count: int = 0, status: str = "uploaded",
                              etag: str = "", created_by: str = "system",
                              note: str = "") -> str:
        archive_id = f"ARCH-{uuid.uuid4().hex[:12]}"
        sql = """
            INSERT INTO export_archives
            (archive_id, export_type, object_name, file_name, date_from, date_to,
             file_size_bytes, record_count, file_count, status, minio_bucket,
             minio_endpoint, etag, created_by, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        self.db.execute(sql, [
            archive_id, export_type, object_name, file_name,
            date_from, date_to, file_size_bytes, record_count, file_count,
            status, config.MINIO_BUCKET, config.MINIO_ENDPOINT, etag, created_by, note
        ])
        return archive_id

    def list_archive_records(self, export_type: Optional[str] = None,
                             status: Optional[str] = None,
                             limit: int = 200) -> pl.DataFrame:
        sql = "SELECT * FROM export_archives WHERE 1=1"
        params = []
        if export_type:
            sql += " AND export_type = ?"
            params.append(export_type)
        if status:
            sql += " AND status = ?"
            params.append(status)
        sql += " ORDER BY created_at DESC"
        if limit and limit > 0:
            sql += f" LIMIT {limit}"
        return self.db.query(sql, params)

    def get_archive_record(self, archive_id: str) -> Optional[Dict]:
        sql = "SELECT * FROM export_archives WHERE archive_id = ?"
        df = self.db.query(sql, [archive_id])
        if df.is_empty():
            return None
        return df.row(0, named=True)

    def get_archive_by_object_name(self, object_name: str) -> Optional[Dict]:
        sql = "SELECT * FROM export_archives WHERE object_name = ? ORDER BY created_at DESC LIMIT 1"
        df = self.db.query(sql, [object_name])
        if df.is_empty():
            return None
        return df.row(0, named=True)

    def update_archive_status(self, archive_id: str, status: str, note: str = ""):
        sql = "UPDATE export_archives SET status = ?, note = ? WHERE archive_id = ?"
        self.db.execute(sql, [status, note, archive_id])

    def delete_archive_record(self, archive_id: str, also_delete_minio: bool = True):
        record = self.get_archive_record(archive_id)
        if record and also_delete_minio:
            minio = get_minio()
            minio.delete_object(record["object_name"])
        sql = "DELETE FROM export_archives WHERE archive_id = ?"
        self.db.execute(sql, [archive_id])

    def delete_all_archives(self, also_delete_minio: bool = True) -> int:
        if also_delete_minio:
            minio = get_minio()
            for obj in minio.list_objects("exports/"):
                minio.delete_object(obj)
        df = self.db.query("SELECT COUNT(*) as cnt FROM export_archives")
        count = int(df.row(0)["cnt"]) if not df.is_empty() else 0
        self.db.execute("DELETE FROM export_archives")
        return count

    def get_archive_stats(self) -> Dict:
        sql = """
            SELECT
                COUNT(*) as total_archives,
                COALESCE(SUM(file_size_bytes), 0) as total_size_bytes,
                COALESCE(SUM(record_count), 0) as total_records,
                SUM(CASE WHEN status = 'uploaded' THEN 1 ELSE 0 END) as uploaded_count,
                SUM(CASE WHEN status = 'deleted' THEN 1 ELSE 0 END) as deleted_count,
                SUM(CASE WHEN export_type = '风险趋势' THEN 1 ELSE 0 END) as risk_trend_count,
                SUM(CASE WHEN export_type = '异常汇总' THEN 1 ELSE 0 END) as anomaly_count,
                SUM(CASE WHEN export_type = '治疗日历' THEN 1 ELSE 0 END) as treatment_count,
                SUM(CASE WHEN export_type = '器械状态' THEN 1 ELSE 0 END) as device_count,
                SUM(CASE WHEN export_type = '护理日志' THEN 1 ELSE 0 END) as nursing_count,
                SUM(CASE WHEN export_type = '复盘备注' THEN 1 ELSE 0 END) as review_count
            FROM export_archives
        """
        df = self.db.query(sql)
        if df.is_empty():
            return {
                "total_archives": 0,
                "total_size_bytes": 0,
                "total_records": 0,
                "uploaded_count": 0,
                "deleted_count": 0
            }
        row = df.row(0, named=True)
        return {k: (int(v) if v is not None else 0) for k, v in row.items()}

    def export_and_archive(self, export_type: str, files: Dict, file_name: str,
                           date_from: Optional[date] = None, date_to: Optional[date] = None,
                           record_count: int = 0, created_by: str = "system",
                           note: str = "") -> Dict:
        minio = get_minio()
        if not minio.is_connected():
            return {"success": False, "error": "MinIO 对象存储连接失败，无法归档"}

        object_name = minio.generate_archive_path(export_type, str(date_from or ""), str(date_to or ""))
        upload_result = minio.upload_zip_from_files(object_name, files)
        if not upload_result:
            return {"success": False, "error": "MinIO 上传失败"}

        object_info = minio.get_object_info(object_name) or {}
        etag = object_info.get("etag", "")

        file_count = upload_result.get("file_count", 0)
        size_bytes = upload_result.get("size_bytes", 0)

        archive_id = self.create_archive_record(
            export_type=export_type,
            object_name=object_name,
            file_name=file_name,
            date_from=date_from,
            date_to=date_to,
            file_size_bytes=size_bytes,
            record_count=record_count,
            file_count=file_count,
            status="uploaded",
            etag=etag,
            created_by=created_by,
            note=note
        )

        return {
            "success": True,
            "archive_id": archive_id,
            "object_name": object_name,
            "file_size_bytes": size_bytes,
            "file_count": file_count,
            "etag": etag
        }

    def retrieve_archive(self, archive_id: str) -> Optional[Dict]:
        record = self.get_archive_record(archive_id)
        if not record:
            return None
        minio = get_minio()
        data = minio.download_zip(record["object_name"])
        if data is None:
            return None
        return {
            "data": data,
            "file_name": record["file_name"],
            "size_bytes": len(data),
            "archive": record
        }

    def retrieve_archive_by_object(self, object_name: str) -> Optional[Dict]:
        record = self.get_archive_by_object_name(object_name)
        if not record:
            return None
        return self.retrieve_archive(record["archive_id"])


def get_service() -> RiskDataService:
    return RiskDataService()
