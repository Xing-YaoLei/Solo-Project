from app.db.database import get_db
from datetime import datetime
import uuid


class ThresholdService:
    
    @staticmethod
    def get_all():
        conn = get_db()
        
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
        conn = get_db()
        
        old = conn.execute("""
            SELECT warning_threshold, critical_threshold 
            FROM threshold_configs 
            WHERE id = ?
        """, [threshold_id]).fetchone()
        
        if not old:
            return None
        
        old_warning, old_critical = old
        
        log_id = str(uuid.uuid4())
        now = datetime.now()
        
        conn.execute("""
            INSERT INTO threshold_change_logs 
            (id, threshold_id, old_warning, new_warning, old_critical, new_critical, changed_by, changed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [log_id, threshold_id, old_warning, warning_threshold, old_critical, critical_threshold, changed_by, now])
        
        conn.execute("""
            UPDATE threshold_configs 
            SET warning_threshold = ?, critical_threshold = ?, updated_by = ?, updated_at = ?
            WHERE id = ?
        """, [warning_threshold, critical_threshold, changed_by, now, threshold_id])
        
        conn.commit()
        
        updated = conn.execute("""
            SELECT id, metric_key, metric_name, warning_threshold, critical_threshold, unit, updated_by, updated_at
            FROM threshold_configs
            WHERE id = ?
        """, [threshold_id]).fetchone()
        
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
    
    @staticmethod
    def get_change_logs(threshold_id: str = None, limit: int = 20):
        conn = get_db()
        
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
