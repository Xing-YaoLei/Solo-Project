from app.db.database import get_duckdb
from datetime import datetime, timedelta


class ActivityService:
    
    @staticmethod
    def get_trend(days: int = 30):
        conn = get_duckdb()
        today = datetime.now()
        start_date = today - timedelta(days=days)
        
        total_residents = conn.execute(
            "SELECT COUNT(*) FROM residents WHERE bed_id IS NOT NULL"
        ).fetchone()[0]
        
        trend_data = conn.execute("""
            SELECT 
                DATE(signin_time) as signin_date,
                COUNT(DISTINCT resident_id) as participant_count
            FROM activity_signins
            WHERE signin_time >= ? AND signin_time <= ?
            GROUP BY DATE(signin_time)
            ORDER BY signin_date
        """, [start_date, today]).fetchall()
        
        date_dict = {}
        for i in range(days + 1):
            d = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
            date_dict[d] = 0
        
        for row in trend_data:
            date_str = str(row[0])
            if date_str in date_dict:
                date_dict[date_str] = row[1]
        
        result = []
        for date_str, count in sorted(date_dict.items()):
            rate = round(count / total_residents * 100, 1) if total_residents > 0 else 0
            result.append({
                "date": date_str,
                "participationRate": rate,
                "participantCount": count
            })
        
        return result
    
    @staticmethod
    def get_time_distribution():
        conn = get_duckdb()
        
        data = conn.execute("""
            SELECT 
                CAST(EXTRACT(HOUR FROM signin_time) AS INT) as hour,
                COUNT(*) as count
            FROM activity_signins
            WHERE signin_time >= DATE('now', '-30 days')
            GROUP BY CAST(EXTRACT(HOUR FROM signin_time) AS INT)
            ORDER BY hour
        """).fetchall()
        
        time_slots = [
            ("早间 (6-9)", [6, 7, 8, 9]),
            ("上午 (9-12)", [9, 10, 11, 12]),
            ("午后 (12-15)", [12, 13, 14, 15]),
            ("下午 (15-18)", [15, 16, 17, 18]),
            ("晚间 (18-21)", [18, 19, 20, 21])
        ]
        
        hour_counts = {row[0]: row[1] for row in data}
        
        result = []
        for slot_name, hours in time_slots:
            count = sum(hour_counts.get(h, 0) for h in hours)
            result.append({
                "timeSlot": slot_name,
                "count": count
            })
        
        return result
    
    @staticmethod
    def get_bed_area_comparison():
        conn = get_duckdb()
        
        data = conn.execute("""
            SELECT 
                b.area,
                COUNT(DISTINCT r.id) as total_residents,
                COUNT(DISTINCT s.resident_id) as participant_count
            FROM beds b
            JOIN residents r ON b.id = r.bed_id
            LEFT JOIN activity_signins s ON r.id = s.resident_id 
                AND s.signin_time >= DATE('now', '-30 days')
            GROUP BY b.area
            ORDER BY b.area
        """).fetchall()
        
        result = []
        for row in data:
            area = row[0]
            total = row[1]
            participants = row[2]
            rate = round(participants / total * 100, 1) if total > 0 else 0
            result.append({
                "area": area,
                "totalResidents": total,
                "participantCount": participants,
                "participationRate": rate
            })
        
        return result
