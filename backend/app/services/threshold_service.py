from app.db.database import get_duckdb, get_pg_session
from datetime import datetime
import uuid
from app.db import models


class ThresholdService:
    
    @staticmethod
    def get_all():
        conn = get_duckdb()
        
        data = conn.execute("""
            SELECT id, metric_key, metric_name, warning_threshold, critical_threshold, unit, updated_by, updated_at
            FROM threshold_configs
            ORDER BY metric_name
        """).fetchall()
        
        result = []
        for row in data:
            result.append({
                "id": row[0],
                "metricKey": row[1],
                "metricName": row[2],
                "warningThreshold": row[3],
                "criticalThreshold": row[4],
                "unit": row[5],
                "updatedAt": row[7].strftime("%Y-%m-%d %H:%M:%S") if row[7] else "",
                "updatedBy": row[6] or ""
            })
        
        return result
    
    @staticmethod
    def update_threshold(threshold_id: str, warning_threshold: float, critical_threshold: float, changed_by: str = "当前用户"):
        from app.data_pipeline.etl_pipeline import etl_pipeline
        pg = get_pg_session()
        try:
            config = pg.query(models.ThresholdConfig).filter(
                models.ThresholdConfig.id == threshold_id
            ).first()
            if not config:
                return None
            
            old_warning = config.warning_threshold
            old_critical = config.critical_threshold
            
            log_id = str(uuid.uuid4())
            now = datetime.now()
            
            log = models.ThresholdChangeLog(
                id=log_id,
                threshold_id=threshold_id,
                old_warning=old_warning,
                new_warning=warning_threshold,
                old_critical=old_critical,
                new_critical=critical_threshold,
                changed_by=changed_by,
                changed_at=now,
            )
            pg.add(log)
            
            config.warning_threshold = warning_threshold
            config.critical_threshold = critical_threshold
            config.updated_by = changed_by
            config.updated_at = now
            pg.commit()
            
            etl_pipeline._sync_core_tables_to_duckdb(pg, get_duckdb())
        except Exception as e:
            pg.rollback()
            raise e
        finally:
            pg.close()
        
        conn = get_duckdb()
        updated = conn.execute("""
            SELECT id, metric_key, metric_name, warning_threshold, critical_threshold, unit, updated_by, updated_at
            FROM threshold_configs
            WHERE id = ?
        """, [threshold_id]).fetchone()
        
        if updated:
            return {
                "id": updated[0],
                "metricKey": updated[1],
                "metricName": updated[2],
                "warningThreshold": updated[3],
                "criticalThreshold": updated[4],
                "unit": updated[5],
                "updatedAt": updated[7].strftime("%Y-%m-%d %H:%M:%S") if updated[7] else "",
                "updatedBy": updated[6] or ""
            }
        return None
    
    @staticmethod
    def get_change_logs(threshold_id: str = None, limit: int = 20):
        conn = get_duckdb()
        
        query = """
            SELECT 
                tcl.id,
                tc.metric_name,
                tcl.old_warning,
                tcl.new_warning,
                tcl.old_critical,
                tcl.new_critical,
                tcl.changed_by,
                tcl.changed_at
            FROM threshold_change_logs tcl
            JOIN threshold_configs tc ON tcl.threshold_id = tc.id
        """
        
        params = []
        if threshold_id:
            query += " WHERE tcl.threshold_id = ?"
            params.append(threshold_id)
        
        query += " ORDER BY tcl.changed_at DESC LIMIT ?"
        params.append(limit)
        
        logs = conn.execute(query, params).fetchall()
        
        result = []
        for log in logs:
            result.append({
                "id": log[0],
                "metricName": log[1],
                "oldWarning": log[2],
                "newWarning": log[3],
                "oldCritical": log[4],
                "newCritical": log[5],
                "changedBy": log[6],
                "changedAt": log[7].strftime("%Y-%m-%d %H:%M:%S") if log[7] else ""
            })
        
        return result
