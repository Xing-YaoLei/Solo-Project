from app.db.database import get_db
from datetime import datetime, timedelta


class DashboardService:
    
    @staticmethod
    def get_funnel_data():
        conn = get_db()
        
        total_residents = conn.execute(
            "SELECT COUNT(*) FROM residents WHERE bed_id IS NOT NULL"
        ).fetchone()[0]
        
        total_beds = conn.execute(
            "SELECT COUNT(*) FROM beds WHERE status = 'occupied'"
        ).fetchone()[0]
        
        today = datetime.now()
        week_ago = today - timedelta(days=7)
        
        care_completed = conn.execute("""
            SELECT COUNT(*) FROM care_records 
            WHERE care_time >= ? AND care_time <= ? AND is_completed = true
        """, [week_ago, today]).fetchone()[0]
        
        total_care = conn.execute("""
            SELECT COUNT(*) FROM care_records 
            WHERE care_time >= ? AND care_time <= ?
        """, [week_ago, today]).fetchone()[0]
        
        activity_participants = conn.execute("""
            SELECT COUNT(DISTINCT resident_id) FROM activity_signins
            WHERE signin_time >= ? AND signin_time <= ?
        """, [week_ago, today]).fetchone()[0]
        
        risk_events = conn.execute("""
            SELECT COUNT(*) FROM risk_events
            WHERE occur_time >= ? AND occur_time <= ?
        """, [week_ago, today]).fetchone()[0]
        
        funnel = [
            {"stage": "床位排班", "value": total_beds, "rate": 100},
            {"stage": "护理执行", "value": care_completed if total_care > 0 else 0, 
             "rate": round(care_completed / total_care * 100, 1) if total_care > 0 else 0},
            {"stage": "活动参与", "value": activity_participants, 
             "rate": round(activity_participants / total_residents * 100, 1) if total_residents > 0 else 0},
            {"stage": "风险预警", "value": risk_events, 
             "rate": round(risk_events / total_residents * 100, 1) if total_residents > 0 else 0}
        ]
        
        return funnel
    
    @staticmethod
    def get_core_metrics():
        conn = get_db()
        today = datetime.now()
        week_ago = today - timedelta(days=7)
        two_weeks_ago = today - timedelta(days=14)
        
        bed_occupancy = conn.execute(
            "SELECT COUNT(*) FROM residents WHERE bed_id IS NOT NULL"
        ).fetchone()[0]
        
        total_beds = conn.execute("SELECT COUNT(*) FROM beds").fetchone()[0]
        
        current_care_completed = conn.execute("""
            SELECT COUNT(*) FROM care_records 
            WHERE care_time >= ? AND care_time <= ? AND is_completed = true
        """, [week_ago, today]).fetchone()[0]
        
        current_total_care = conn.execute("""
            SELECT COUNT(*) FROM care_records 
            WHERE care_time >= ? AND care_time <= ?
        """, [week_ago, today]).fetchone()[0]
        
        care_rate = round(current_care_completed / current_total_care * 100, 1) if current_total_care > 0 else 0
        
        prev_care_completed = conn.execute("""
            SELECT COUNT(*) FROM care_records 
            WHERE care_time >= ? AND care_time < ? AND is_completed = true
        """, [two_weeks_ago, week_ago]).fetchone()[0]
        
        prev_total_care = conn.execute("""
            SELECT COUNT(*) FROM care_records 
            WHERE care_time >= ? AND care_time < ?
        """, [two_weeks_ago, week_ago]).fetchone()[0]
        
        prev_care_rate = round(prev_care_completed / prev_total_care * 100, 1) if prev_total_care > 0 else 0
        
        current_risk_count = conn.execute("""
            SELECT COUNT(*) FROM risk_events
            WHERE occur_time >= ? AND occur_time <= ?
        """, [week_ago, today]).fetchone()[0]
        
        prev_risk_count = conn.execute("""
            SELECT COUNT(*) FROM risk_events
            WHERE occur_time >= ? AND occur_time < ?
        """, [two_weeks_ago, week_ago]).fetchone()[0]
        
        total_residents = conn.execute(
            "SELECT COUNT(*) FROM residents WHERE bed_id IS NOT NULL"
        ).fetchone()[0]
        
        current_activity_participants = conn.execute("""
            SELECT COUNT(DISTINCT resident_id) FROM activity_signins
            WHERE signin_time >= ? AND signin_time <= ?
        """, [week_ago, today]).fetchone()[0]
        
        activity_rate = round(current_activity_participants / total_residents * 100, 1) if total_residents > 0 else 0
        
        prev_activity_participants = conn.execute("""
            SELECT COUNT(DISTINCT resident_id) FROM activity_signins
            WHERE signin_time >= ? AND signin_time < ?
        """, [two_weeks_ago, week_ago]).fetchone()[0]
        
        prev_activity_rate = round(prev_activity_participants / total_residents * 100, 1) if total_residents > 0 else 0
        
        return {
            "bedOccupancy": bed_occupancy,
            "careComplianceRate": care_rate,
            "riskEventCount": current_risk_count,
            "activityParticipationRate": activity_rate,
            "bedOccupancyChange": round((bed_occupancy / total_beds * 100) - 75, 1) if total_beds > 0 else 0,
            "careComplianceChange": round(care_rate - prev_care_rate, 1),
            "riskEventChange": round(current_risk_count - prev_risk_count, 1),
            "activityChange": round(activity_rate - prev_activity_rate, 1)
        }
    
    @staticmethod
    def get_recent_risks(limit: int = 10):
        conn = get_db()
        
        risks = conn.execute("""
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
            ORDER BY re.occur_time DESC
            LIMIT ?
        """, [limit]).fetchall()
        
        result = []
        for risk in risks:
            result.append({
                "id": risk[0],
                "type": risk[1],
                "level": risk[2],
                "residentName": risk[3],
                "bedNo": risk[4] or "",
                "occurTime": risk[5].strftime("%Y-%m-%d %H:%M:%S") if risk[5] else "",
                "description": risk[6] or "",
                "remark": risk[7],
                "remarkTime": risk[8].strftime("%Y-%m-%d %H:%M:%S") if risk[8] else None,
                "remarkUser": risk[9]
            })
        
        return result
