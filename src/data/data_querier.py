import polars as pl
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
from src.data.database import get_connection
from src.utils.config import get_duckdb_path


class DataQuerier:
    def __init__(self, db_path: str = None):
        self.db_path = db_path or get_duckdb_path()
        self.conn = get_connection(self.db_path)

    def _query(self, sql: str, params: tuple = None) -> pl.DataFrame:
        if params:
            result = self.conn.execute(sql, params).fetchall()
        else:
            result = self.conn.execute(sql).fetchall()
        columns = [desc[0] for desc in self.conn.description]
        return pl.DataFrame(result, schema=columns, orient="row")

    def get_regions(self) -> pl.DataFrame:
        return self._query("SELECT * FROM regions ORDER BY region_name")

    def get_sync_nodes(self, batch_no: str = None, status: str = None) -> pl.DataFrame:
        sql = "SELECT * FROM sync_nodes WHERE 1=1"
        params = []
        if batch_no:
            sql += " AND batch_no = ?"
            params.append(batch_no)
        if status:
            sql += " AND status = ?"
            params.append(status)
        sql += " ORDER BY started_at DESC"
        return self._query(sql, tuple(params) if params else ())

    def get_evidence_archive(self, start_date: datetime = None, end_date: datetime = None,
                            region_id: str = None, evidence_type: str = None) -> pl.DataFrame:
        sql = """
            SELECT ea.*, r.region_name
            FROM evidence_archive ea
            LEFT JOIN regions r ON ea.region_id = r.region_id
            WHERE 1=1
        """
        params = []
        if start_date:
            sql += " AND ea.archive_date >= ?"
            params.append(start_date)
        if end_date:
            sql += " AND ea.archive_date <= ?"
            params.append(end_date)
        if region_id:
            sql += " AND ea.region_id = ?"
            params.append(region_id)
        if evidence_type:
            sql += " AND ea.evidence_type = ?"
            params.append(evidence_type)
        sql += " ORDER BY ea.archive_date DESC"
        return self._query(sql, tuple(params) if params else ())

    def get_issue_records(self, start_date: datetime = None, end_date: datetime = None,
                         region_id: str = None, severity: str = None,
                         is_reoccurrence: bool = None) -> pl.DataFrame:
        sql = """
            SELECT ir.*, r.region_name
            FROM issue_records ir
            LEFT JOIN regions r ON ir.region_id = r.region_id
            WHERE 1=1
        """
        params = []
        if start_date:
            sql += " AND ir.found_date >= ?"
            params.append(start_date)
        if end_date:
            sql += " AND ir.found_date <= ?"
            params.append(end_date)
        if region_id:
            sql += " AND ir.region_id = ?"
            params.append(region_id)
        if severity:
            sql += " AND ir.severity = ?"
            params.append(severity)
        if is_reoccurrence is not None:
            sql += " AND ir.is_reoccurrence = ?"
            params.append(is_reoccurrence)
        sql += " ORDER BY ir.found_date DESC"
        return self._query(sql, tuple(params) if params else ())

    def get_permission_logs(self, start_date: datetime = None, end_date: datetime = None,
                           region_id: str = None, is_violation: bool = None) -> pl.DataFrame:
        sql = """
            SELECT pl.*, r.region_name
            FROM permission_logs pl
            LEFT JOIN regions r ON pl.region_id = r.region_id
            WHERE 1=1
        """
        params = []
        if start_date:
            sql += " AND pl.operation_time >= ?"
            params.append(start_date)
        if end_date:
            sql += " AND pl.operation_time <= ?"
            params.append(end_date)
        if region_id:
            sql += " AND pl.region_id = ?"
            params.append(region_id)
        if is_violation is not None:
            sql += " AND pl.is_violation = ?"
            params.append(is_violation)
        sql += " ORDER BY pl.operation_time DESC"
        return self._query(sql, tuple(params) if params else ())

    def get_audit_workpapers(self, start_date: datetime = None, end_date: datetime = None,
                            region_id: str = None) -> pl.DataFrame:
        sql = """
            SELECT aw.*, r.region_name
            FROM audit_workpapers aw
            LEFT JOIN regions r ON aw.region_id = r.region_id
            WHERE 1=1
        """
        params = []
        if start_date:
            sql += " AND aw.audit_date >= ?"
            params.append(start_date)
        if end_date:
            sql += " AND aw.audit_date <= ?"
            params.append(end_date)
        if region_id:
            sql += " AND aw.region_id = ?"
            params.append(region_id)
        sql += " ORDER BY aw.audit_date DESC"
        return self._query(sql, tuple(params) if params else ())

    def get_mail_materials(self, start_date: datetime = None, end_date: datetime = None,
                          region_id: str = None) -> pl.DataFrame:
        sql = """
            SELECT mm.*, r.region_name
            FROM mail_materials mm
            LEFT JOIN regions r ON mm.region_id = r.region_id
            WHERE 1=1
        """
        params = []
        if start_date:
            sql += " AND mm.sent_time >= ?"
            params.append(start_date)
        if end_date:
            sql += " AND mm.sent_time <= ?"
            params.append(end_date)
        if region_id:
            sql += " AND mm.region_id = ?"
            params.append(region_id)
        sql += " ORDER BY mm.sent_time DESC"
        return self._query(sql, tuple(params) if params else ())

    def get_checklist_items(self, region_id: str = None, is_checked: bool = None) -> pl.DataFrame:
        sql = """
            SELECT ci.*, r.region_name
            FROM checklist_items ci
            LEFT JOIN regions r ON ci.region_id = r.region_id
            WHERE 1=1
        """
        params = []
        if region_id:
            sql += " AND ci.region_id = ?"
            params.append(region_id)
        if is_checked is not None:
            sql += " AND ci.is_checked = ?"
            params.append(is_checked)
        sql += " ORDER BY ci.item_no"
        return self._query(sql, tuple(params) if params else ())

    def get_sampling_records(self, start_date: datetime = None, end_date: datetime = None,
                            region_id: str = None) -> pl.DataFrame:
        sql = """
            SELECT sr.*, r.region_name
            FROM sampling_records sr
            LEFT JOIN regions r ON sr.region_id = r.region_id
            WHERE 1=1
        """
        params = []
        if start_date:
            sql += " AND sr.sampled_at >= ?"
            params.append(start_date)
        if end_date:
            sql += " AND sr.sampled_at <= ?"
            params.append(end_date)
        if region_id:
            sql += " AND sr.region_id = ?"
            params.append(region_id)
        sql += " ORDER BY sr.sampled_at DESC"
        return self._query(sql, tuple(params) if params else ())

    def get_notification_templates(self, region_id: str = None) -> pl.DataFrame:
        sql = """
            SELECT nt.*, r.region_name
            FROM notification_templates nt
            LEFT JOIN regions r ON nt.region_id = r.region_id
            WHERE 1=1
        """
        params = []
        if region_id:
            sql += " AND nt.region_id = ?"
            params.append(region_id)
        sql += " ORDER BY nt.template_name, nt.version DESC"
        return self._query(sql, tuple(params) if params else ())

    def get_evidence_attachments(self, archive_id: str = None) -> pl.DataFrame:
        sql = "SELECT * FROM evidence_attachments WHERE 1=1"
        params = []
        if archive_id:
            sql += " AND archive_id = ?"
            params.append(archive_id)
        sql += " ORDER BY uploaded_at DESC"
        return self._query(sql, tuple(params) if params else ())

    def get_original_record(self, source_table: str, source_id: str) -> Optional[Dict[str, Any]]:
        sql = f"SELECT * FROM {source_table} WHERE {source_table.rstrip('s')}_id = ?"
        try:
            result = self.conn.execute(sql, (source_id,)).fetchone()
            if result:
                columns = [desc[0] for desc in self.conn.description]
                return dict(zip(columns, result))
        except Exception:
            pass
        return None

    def get_related_records_by_sync(self, sync_id: str) -> Dict[str, pl.DataFrame]:
        return {
            "audit_workpapers": self._query(
                "SELECT * FROM audit_workpapers WHERE sync_id = ?", (sync_id,)
            ),
            "permission_logs": self._query(
                "SELECT * FROM permission_logs WHERE sync_id = ?", (sync_id,)
            ),
            "mail_materials": self._query(
                "SELECT * FROM mail_materials WHERE sync_id = ?", (sync_id,)
            )
        }

    def close(self):
        self.conn.close()
