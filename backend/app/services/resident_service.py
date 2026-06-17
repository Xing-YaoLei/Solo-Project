from app.db.database import get_db
from datetime import datetime, timedelta


class ResidentService:
    
    @staticmethod
    def get_residents(page: int = 1, page_size: int = 20, care_level: str = None):
        conn = get_db()
        offset = (page - 1) * page_size
        
        query = """
            SELECT 
                r.id,
                r.name,
                r.age,
                r.gender,
                r.care_level,
                b.bed_no,
                r.admission_date,
                r.primary_disease
            FROM residents r
            LEFT JOIN beds b ON r.bed_id = b.id
        """
        
        count_query = "SELECT COUNT(*) FROM residents"
        
        conditions = []
        params = []
        
        if care_level:
            conditions.append("r.care_level = ?")
            params.append(care_level)
        
        if conditions:
            where_clause = " AND ".join(conditions)
            query += f" WHERE {where_clause}"
            count_query += f" WHERE {where_clause}"
        
        query += " ORDER BY r.name LIMIT ? OFFSET ?"
        params.extend([page_size, offset])
        
        residents = conn.execute(query, params).fetchall()
        total = conn.execute(count_query, params[:-2] if len(params) >= 2 else params).fetchone()[0]
        
        result = []
        for r in residents:
            result.append({
                "id": r[0],
                "name": r[1],
                "age": r[2],
                "gender": r[3],
                "careLevel": r[4],
                "bedNo": r[5] or "",
                "admissionDate": str(r[6]) if r[6] else "",
                "primaryDisease": r[7] or ""
            })
        
        return {"list": result, "total": total}
    
    @staticmethod
    def get_bed_utilization():
        conn = get_db()
        
        data = conn.execute("""
            SELECT 
                b.area,
                COUNT(*) as total_beds,
                SUM(CASE WHEN r.id IS NOT NULL THEN 1 ELSE 0 END) as occupied_beds
            FROM beds b
            LEFT JOIN residents r ON b.id = r.bed_id
            GROUP BY b.area
            ORDER BY b.area
        """).fetchall()
        
        result = []
        for row in data:
            area = row[0]
            total = row[1]
            occupied = row[2]
            rate = round(occupied / total * 100, 1) if total > 0 else 0
            result.append({
                "area": area,
                "totalBeds": total,
                "occupiedBeds": occupied,
                "utilizationRate": rate
            })
        
        return result
    
    @staticmethod
    def get_care_level_distribution():
        conn = get_db()
        
        data = conn.execute("""
            SELECT care_level, COUNT(*) as count
            FROM residents
            WHERE bed_id IS NOT NULL
            GROUP BY care_level
            ORDER BY count DESC
        """).fetchall()
        
        total = sum(row[1] for row in data) if data else 1
        
        result = []
        for row in data:
            result.append({
                "careLevel": row[0],
                "count": row[1],
                "ratio": round(row[1] / total * 100, 1)
            })
        
        return result
    
    @staticmethod
    def get_age_distribution():
        conn = get_db()
        
        age_groups = [
            ("65-70岁", 65, 70),
            ("71-75岁", 71, 75),
            ("76-80岁", 76, 80),
            ("81-85岁", 81, 85),
            ("86岁以上", 86, 150)
        ]
        
        result = []
        for group_name, min_age, max_age in age_groups:
            count = conn.execute("""
                SELECT COUNT(*) FROM residents 
                WHERE age >= ? AND age <= ? AND bed_id IS NOT NULL
            """, [min_age, max_age]).fetchone()[0]
            
            result.append({
                "ageGroup": group_name,
                "count": count
            })
        
        return result
    
    @staticmethod
    def get_disease_distribution():
        conn = get_db()
        
        data = conn.execute("""
            SELECT primary_disease, COUNT(*) as count
            FROM residents
            WHERE bed_id IS NOT NULL AND primary_disease IS NOT NULL
            GROUP BY primary_disease
            ORDER BY count DESC
            LIMIT 10
        """).fetchall()
        
        total = sum(row[1] for row in data) if data else 1
        
        result = []
        for row in data:
            result.append({
                "disease": row[0],
                "count": row[1],
                "ratio": round(row[1] / total * 100, 1)
            })
        
        return result
