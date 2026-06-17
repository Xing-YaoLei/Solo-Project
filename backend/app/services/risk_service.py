from app.db.database import get_db
from datetime import datetime, timedelta
import uuid


class RiskService:
    
    @staticmethod
    def get_events(page: int = 1, page_size: int = 20, event_type: str = None, level: str = None):
        conn = get_db()
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
        conn = get_db()
        start_date = datetime.now() - timedelta(days=days)
        
        data = conn.execute("""
            SELECT type, COUNT(*) as count
            FROM risk_events
            WHERE occur_time >= ?
            GROUP BY type
            ORDER BY count DESC
        """, [start_date]).fetchall()
        
        total = sum(row[1] for row in data) if data else 1
        
        type_map = {
            "fall": "跌倒",
            "pressure_ulcer": "压疮",
            "wandering": "走失",
            "medication_error": "用药失误",
            "other": "其他"
        }
        
        result = []
        for row in data:
            result.append({
                "type": type_map.get(row[0], row[0]),
                "count": row[1],
                "ratio": round(row[1] / total * 100, 1)
            })
        
        return result
    
    @staticmethod
    def get_daily_trend(days: int = 30):
        conn = get_db()
        today = datetime.now()
        start_date = today - timedelta(days=days)
        
        data = conn.execute("""
            SELECT 
                DATE(occur_time) as occur_date,
                type,
                COUNT(*) as count
            FROM risk_events
            WHERE occur_time >= ? AND occur_time <= ?
            GROUP BY DATE(occur_time), type
            ORDER BY occur_date
        """, [start_date, today]).fetchall()
        
        date_dict = {}
        for i in range(days + 1):
            d = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
            date_dict[d] = {"fall": 0, "pressure_ulcer": 0, "wandering": 0, "medication_error": 0, "other": 0}
        
        for row in data:
            date_str = str(row[0])
            event_type = row[1]
            count = row[2]
            if date_str in date_dict and event_type in date_dict[date_str]:
                date_dict[date_str][event_type] = count
        
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
        conn = get_db()
        remark_id = str(uuid.uuid4())
        now = datetime.now()
        
        conn.execute("""
            INSERT INTO risk_remarks (id, risk_event_id, content, user_name, remark_type, created_at)
            VALUES (?, ?, ?, ?, 'review', ?)
        """, [remark_id, event_id, remark, user_name, now])
        
        conn.commit()
        
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
