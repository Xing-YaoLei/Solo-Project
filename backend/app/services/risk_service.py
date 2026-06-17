from app.db.database import get_duckdb, get_pg_session
from datetime import datetime, timedelta
import uuid
from app.db import models


class RiskService:
    
    @staticmethod
    def get_events(page: int = 1, page_size: int = 20, event_type: str = None, level: str = None):
        conn = get_duckdb()
        offset = (page - 1) * page_size
        
        query = """
            SELECT 
                re.id,
                re.type,
                re.level,
                r.name as resident_name,
                b.bed_no,
                re.occur_time,
                re.description,
                rr.content as remark,
                rr.created_at as remark_time,
                rr.user_name as remark_user
            FROM risk_events re
            JOIN residents r ON re.resident_id = r.id
            LEFT JOIN beds b ON r.bed_id = b.id
            LEFT JOIN risk_remarks rr ON re.id = rr.risk_event_id
        """
        
        count_query = "SELECT COUNT(*) FROM risk_events WHERE 1=1"
        
        conditions = []
        params = []
        
        if event_type:
            conditions.append("re.type = ?")
            params.append(event_type)
        
        if level:
            conditions.append("re.level = ?")
            params.append(level)
        
        if conditions:
            where_clause = " AND ".join(conditions)
            query += f" WHERE {where_clause}"
            count_query += f" AND {where_clause}"
        
        query += " ORDER BY re.occur_time DESC LIMIT ? OFFSET ?"
        params.extend([page_size, offset])
        
        events = conn.execute(query, params).fetchall()
        
        total = conn.execute(count_query, params[:-2] if len(params) >= 2 else params).fetchone()[0]
        
        result = []
        for event in events:
            result.append({
                "id": event[0],
                "type": event[1],
                "level": event[2],
                "residentName": event[3],
                "bedNo": event[4] or "",
                "occurTime": event[5].strftime("%Y-%m-%d %H:%M:%S") if event[5] else "",
                "description": event[6] or "",
                "remark": event[7],
                "remarkTime": event[8].strftime("%Y-%m-%d %H:%M:%S") if event[8] else None,
                "remarkUser": event[9]
            })
        
        return {"list": result, "total": total}
    
    @staticmethod
    def get_type_distribution(days: int = 30):
        conn = get_duckdb()
        start_date = datetime.now() - timedelta(days=days)
        
        event_data = conn.execute("""
            SELECT type, COUNT(*) as count
            FROM risk_events
            WHERE occur_time >= ?
            GROUP BY type
            ORDER BY count DESC
        """, [start_date]).fetchall()
        
        health_abnormal = conn.execute("""
            SELECT 
                CASE 
                    WHEN metric_type = 'bp_systolic' AND metric_value >= 160 THEN 'health_critical'
                    WHEN metric_type IN ('bp_systolic', 'bp_diastolic') THEN 'hypertension'
                    WHEN metric_type = 'heart_rate' AND (metric_value >= 100 OR metric_value <= 50) THEN 'arrhythmia'
                    WHEN metric_type = 'blood_oxygen' AND metric_value <= 92 THEN 'hypoxia'
                    WHEN metric_type = 'blood_sugar' AND metric_value >= 11 THEN 'hyperglycemia'
                    WHEN metric_type = 'temperature' AND metric_value >= 37.5 THEN 'fever'
                    ELSE 'health_abnormal'
                END as risk_type,
                COUNT(*) as count
            FROM health_metrics_clean
            WHERE measure_time >= ?
              AND (
                (metric_type = 'bp_systolic' AND metric_value >= 140)
                OR (metric_type = 'bp_diastolic' AND metric_value >= 90)
                OR (metric_type = 'heart_rate' AND (metric_value >= 100 OR metric_value <= 50))
                OR (metric_type = 'blood_oxygen' AND metric_value <= 92)
                OR (metric_type = 'blood_sugar' AND metric_value >= 11)
                OR (metric_type = 'temperature' AND metric_value >= 37.5)
              )
            GROUP BY risk_type
        """, [start_date]).fetchall()
        
        type_map = {
            "fall": "跌倒",
            "pressure_ulcer": "压疮",
            "wandering": "走失",
            "medication_error": "用药失误",
            "other": "其他",
            "hypertension": "高血压异常",
            "arrhythmia": "心率异常",
            "hypoxia": "血氧异常",
            "health_abnormal": "健康异常",
            "health_critical": "血压危重",
            "hyperglycemia": "高血糖",
            "fever": "发热",
        }
        
        merged = {}
        for row in event_data:
            merged[row[0]] = merged.get(row[0], 0) + row[1]
        for row in health_abnormal:
            merged[row[0]] = merged.get(row[0], 0) + row[1]
        
        total = sum(merged.values()) if merged else 1
        
        result = []
        for k, v in sorted(merged.items(), key=lambda x: -x[1]):
            result.append({
                "type": type_map.get(k, k),
                "count": v,
                "ratio": round(v / total * 100, 1)
            })
        
        return result
    
    @staticmethod
    def get_daily_trend(days: int = 30):
        conn = get_duckdb()
        today = datetime.now()
        start_date = today - timedelta(days=days)
        
        event_data = conn.execute("""
            SELECT 
                DATE(occur_time) as occur_date,
                type,
                COUNT(*) as count
            FROM risk_events
            WHERE occur_time >= ? AND occur_time <= ?
            GROUP BY DATE(occur_time), type
        """, [start_date, today]).fetchall()
        
        health_data = conn.execute("""
            SELECT 
                DATE(measure_time) as occur_date,
                CASE
                    WHEN metric_type IN ('bp_systolic', 'bp_diastolic') THEN 'hypertension'
                    WHEN metric_type = 'heart_rate' THEN 'arrhythmia'
                    WHEN metric_type = 'blood_oxygen' THEN 'hypoxia'
                    WHEN metric_type = 'blood_sugar' THEN 'hyperglycemia'
                    WHEN metric_type = 'temperature' THEN 'fever'
                    ELSE 'health_abnormal'
                END as type,
                COUNT(*) as count
            FROM health_metrics_clean
            WHERE measure_time >= ? AND measure_time <= ?
              AND (
                (metric_type = 'bp_systolic' AND metric_value >= 140)
                OR (metric_type = 'bp_diastolic' AND metric_value >= 90)
                OR (metric_type = 'heart_rate' AND (metric_value >= 100 OR metric_value <= 50))
                OR (metric_type = 'blood_oxygen' AND metric_value <= 92)
                OR (metric_type = 'blood_sugar' AND metric_value >= 11)
                OR (metric_type = 'temperature' AND metric_value >= 37.5)
              )
            GROUP BY DATE(measure_time), type
        """, [start_date, today]).fetchall()
        
        date_dict = {}
        known_types = ["fall", "pressure_ulcer", "wandering", "medication_error", "other",
                       "hypertension", "arrhythmia", "hypoxia", "health_abnormal",
                       "hyperglycemia", "fever", "health_critical"]
        for i in range(days + 1):
            d = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
            date_dict[d] = {t: 0 for t in known_types}
        
        for row in event_data:
            date_str = str(row[0])
            t = row[1]
            c = row[2]
            if date_str in date_dict and t in date_dict[date_str]:
                date_dict[date_str][t] += c
        
        for row in health_data:
            date_str = str(row[0])
            t = row[1]
            c = row[2]
            if date_str in date_dict and t in date_dict[date_str]:
                date_dict[date_str][t] += c
        
        result = []
        for date_str, types in sorted(date_dict.items()):
            total = sum(types.values())
            result.append({
                "date": date_str,
                "total": total,
                **types
            })
        
        return result
    
    @staticmethod
    def add_remark(event_id: str, remark: str, user_name: str = "当前用户"):
        from app.data_pipeline.etl_pipeline import etl_pipeline
        pg = get_pg_session()
        try:
            remark_id = str(uuid.uuid4())
            now = datetime.now()
            obj = models.RiskRemark(
                id=remark_id,
                risk_event_id=event_id,
                content=remark,
                user_name=user_name,
                remark_type="review",
                created_at=now,
            )
            pg.add(obj)
            pg.commit()

            etl_pipeline._sync_core_tables_to_duckdb(pg, get_duckdb())
        except Exception as e:
            pg.rollback()
            raise e
        finally:
            pg.close()
        
        conn = get_duckdb()
        event = conn.execute("""
            SELECT 
                re.id,
                re.type,
                re.level,
                r.name as resident_name,
                b.bed_no,
                re.occur_time,
                re.description,
                rr.content as remark,
                rr.created_at as remark_time,
                rr.user_name as remark_user
            FROM risk_events re
            JOIN residents r ON re.resident_id = r.id
            LEFT JOIN beds b ON r.bed_id = b.id
            LEFT JOIN risk_remarks rr ON re.id = rr.risk_event_id
            WHERE re.id = ?
            ORDER BY rr.created_at DESC
            LIMIT 1
        """, [event_id]).fetchone()
        
        if event:
            return {
                "id": event[0],
                "type": event[1],
                "level": event[2],
                "residentName": event[3],
                "bedNo": event[4] or "",
                "occurTime": event[5].strftime("%Y-%m-%d %H:%M:%S") if event[5] else "",
                "description": event[6] or "",
                "remark": event[7],
                "remarkTime": event[8].strftime("%Y-%m-%d %H:%M:%S") if event[8] else None,
                "remarkUser": event[9]
            }
        return None
