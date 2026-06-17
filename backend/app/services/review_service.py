from app.db.database import get_db
from datetime import datetime, timedelta


class ReviewService:
    
    @staticmethod
    def get_fall_review(event_id: str):
        conn = get_db()
        
        event = conn.execute("""
            SELECT 
                re.id,
                re.type,
                re.level,
                r.name as resident_name,
                b.bed_no,
                re.occur_time,
                re.description
            FROM risk_events re
            JOIN residents r ON re.resident_id = r.id
            LEFT JOIN beds b ON r.bed_id = b.id
            WHERE re.id = ?
        """, [event_id]).fetchone()
        
        if not event:
            return None
        
        event_info = {
            "id": event[0],
            "type": event[1],
            "level": event[2],
            "residentName": event[3],
            "bedNo": event[4] or "",
            "occurTime": event[5].strftime("%Y-%m-%d %H:%M:%S") if event[5] else "",
            "description": event[6] or ""
        }
        
        occur_time = event[5]
        if isinstance(occur_time, str):
            occur_time = datetime.fromisoformat(occur_time)
        
        period_days = 7
        before_start = occur_time - timedelta(days=period_days)
        before_end = occur_time
        after_start = occur_time
        after_end = occur_time + timedelta(days=period_days)
        
        resident_id = conn.execute(
            "SELECT resident_id FROM risk_events WHERE id = ?", [event_id]
        ).fetchone()[0]
        
        before_care = conn.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_completed = true THEN 1 ELSE 0 END) as completed
            FROM care_records
            WHERE resident_id = ? AND care_time >= ? AND care_time < ?
        """, [resident_id, before_start, before_end]).fetchone()
        
        after_care = conn.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_completed = true THEN 1 ELSE 0 END) as completed
            FROM care_records
            WHERE resident_id = ? AND care_time > ? AND care_time <= ?
        """, [resident_id, after_start, after_end]).fetchone()
        
        before_total = before_care[0] or 0
        before_completed = before_care[1] or 0
        after_total = after_care[0] or 0
        after_completed = after_care[1] or 0
        
        care_compliance = {
            "beforeEvent": {
                "rate": round(before_completed / before_total * 100, 1) if before_total > 0 else 0,
                "totalTasks": before_total,
                "completedTasks": before_completed
            },
            "afterEvent": {
                "rate": round(after_completed / after_total * 100, 1) if after_total > 0 else 0,
                "totalTasks": after_total,
                "completedTasks": after_completed
            },
            "periodDays": period_days
        }
        
        timeline = []
        
        timeline.append({
            "time": event_info["occurTime"],
            "type": "event",
            "description": f"跌倒事件发生：{event_info['description']}"
        })
        
        before_care_list = conn.execute("""
            SELECT care_time, care_type, is_completed, caregiver
            FROM care_records
            WHERE resident_id = ? AND care_time >= ? AND care_time <= ?
            ORDER BY care_time DESC
            LIMIT 5
        """, [resident_id, before_start, before_end]).fetchall()
        
        for care in before_care_list:
            care_time_str = care[0].strftime("%Y-%m-%d %H:%M:%S") if care[0] else ""
            status = "已完成" if care[2] else "未完成"
            timeline.append({
                "time": care_time_str,
                "type": "care",
                "description": f"{care[1]} - {status} - {care[3]}"
            })
        
        remarks = conn.execute("""
            SELECT id, content, user_name, created_at, remark_type
            FROM risk_remarks
            WHERE risk_event_id = ?
            ORDER BY created_at
        """, [event_id]).fetchall()
        
        remark_list = []
        for remark in remarks:
            remark_time_str = remark[3].strftime("%Y-%m-%d %H:%M:%S") if remark[3] else ""
            remark_list.append({
                "id": remark[0],
                "content": remark[1],
                "user": remark[2],
                "time": remark_time_str,
                "type": remark[4] or "initial"
            })
            
            timeline.append({
                "time": remark_time_str,
                "type": "remark",
                "description": f"{remark[2]} 备注：{remark[1]}"
            })
        
        timeline.sort(key=lambda x: x["time"])
        
        return {
            "eventId": event_id,
            "eventInfo": event_info,
            "timeline": timeline,
            "careCompliance": care_compliance,
            "remarks": remark_list
        }
    
    @staticmethod
    def get_fall_events(limit: int = 20):
        conn = get_db()
        
        events = conn.execute("""
            SELECT 
                re.id,
                r.name as resident_name,
                b.bed_no,
                re.occur_time,
                re.level
            FROM risk_events re
            JOIN residents r ON re.resident_id = r.id
            LEFT JOIN beds b ON r.bed_id = b.id
            WHERE re.type = 'fall'
            ORDER BY re.occur_time DESC
            LIMIT ?
        """, [limit]).fetchall()
        
        result = []
        for event in events:
            result.append({
                "id": event[0],
                "residentName": event[1],
                "bedNo": event[2] or "",
                "occurTime": event[3].strftime("%Y-%m-%d %H:%M:%S") if event[3] else "",
                "level": event[4]
            })
        
        return result
