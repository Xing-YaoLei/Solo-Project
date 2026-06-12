import duckdb
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from app.config import settings


class DuckDBService:
    def __init__(self):
        self.db_path = settings.DUCKDB_PATH
        self._con = None

    @property
    def con(self):
        if self._con is None:
            self._con = duckdb.connect(self.db_path)
            self._init_tables()
        return self._con

    def _init_tables(self):
        self.con.execute("""
            CREATE TABLE IF NOT EXISTS cleaning_records (
                id INTEGER,
                record_code VARCHAR,
                equipment_id INTEGER,
                store_id INTEGER,
                cleaning_date TIMESTAMP,
                cleaning_type VARCHAR,
                operator VARCHAR,
                cleaning_result VARCHAR,
                source VARCHAR
            )
        """)
        self.con.execute("""
            CREATE TABLE IF NOT EXISTS inspection_records (
                id INTEGER,
                record_code VARCHAR,
                equipment_id INTEGER,
                store_id INTEGER,
                inspection_date TIMESTAMP,
                inspection_type VARCHAR,
                passed BOOLEAN,
                score FLOAT
            )
        """)
        self.con.execute("""
            CREATE TABLE IF NOT EXISTS equipments (
                id INTEGER,
                equipment_code VARCHAR,
                equipment_name VARCHAR,
                equipment_type VARCHAR,
                store_id INTEGER,
                status VARCHAR,
                last_cleaning_date TIMESTAMP,
                next_cleaning_date TIMESTAMP,
                cleaning_cycle_days INTEGER
            )
        """)
        self.con.execute("""
            CREATE TABLE IF NOT EXISTS stores (
                id INTEGER,
                store_code VARCHAR,
                store_name VARCHAR,
                city VARCHAR,
                district VARCHAR,
                status VARCHAR
            )
        """)

    def sync_from_db(self, cleaning_df: pd.DataFrame, inspection_df: pd.DataFrame,
                     equipment_df: pd.DataFrame, store_df: pd.DataFrame):
        if not cleaning_df.empty:
            self.con.execute("DELETE FROM cleaning_records")
            self.con.register("cleaning_tmp", cleaning_df)
            self.con.execute("INSERT INTO cleaning_records SELECT * FROM cleaning_tmp")
            self.con.unregister("cleaning_tmp")

        if not inspection_df.empty:
            self.con.execute("DELETE FROM inspection_records")
            self.con.register("inspection_tmp", inspection_df)
            self.con.execute("INSERT INTO inspection_records SELECT * FROM inspection_tmp")
            self.con.unregister("inspection_tmp")

        if not equipment_df.empty:
            self.con.execute("DELETE FROM equipments")
            self.con.register("equip_tmp", equipment_df)
            self.con.execute("INSERT INTO equipments SELECT * FROM equip_tmp")
            self.con.unregister("equip_tmp")

        if not store_df.empty:
            self.con.execute("DELETE FROM stores")
            self.con.register("store_tmp", store_df)
            self.con.execute("INSERT INTO stores SELECT * FROM store_tmp")
            self.con.unregister("store_tmp")

    def get_cleaning_funnel_data(self, start_date: Optional[str] = None,
                                 end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        where_clause = ""
        params = []
        if start_date:
            where_clause += " AND cleaning_date >= ?"
            params.append(start_date)
        if end_date:
            where_clause += " AND cleaning_date <= ?"
            params.append(end_date)

        query = f"""
            SELECT
                '总设备数' as stage,
                COUNT(DISTINCT e.id) as count
            FROM equipments e
            WHERE e.status != 'offline'
            UNION ALL
            SELECT
                '待清洁设备' as stage,
                COUNT(DISTINCT e.id) as count
            FROM equipments e
            WHERE e.status != 'offline'
              AND (e.next_cleaning_date <= CURRENT_DATE OR e.last_cleaning_date IS NULL)
            UNION ALL
            SELECT
                '已派单设备' as stage,
                COUNT(DISTINCT cr.equipment_id) as count
            FROM cleaning_records cr
            WHERE 1=1 {where_clause}
            UNION ALL
            SELECT
                '已完成清洁' as stage,
                COUNT(DISTINCT cr.equipment_id) as count
            FROM cleaning_records cr
            WHERE cr.cleaning_result = 'passed'
              {where_clause}
            UNION ALL
            SELECT
                '巡检合格' as stage,
                COUNT(DISTINCT ir.equipment_id) as count
            FROM inspection_records ir
            WHERE ir.passed = TRUE
              {where_clause.replace('cleaning_date', 'inspection_date')}
        """

        result = self.con.execute(query, params * 4 if params else []).fetchall()
        funnel_data = []
        for row in result:
            funnel_data.append({
                "stage": row[0],
                "count": int(row[1])
            })

        stage_order = ["总设备数", "待清洁设备", "已派单设备", "已完成清洁", "巡检合格"]
        funnel_data.sort(key=lambda x: stage_order.index(x["stage"]) if x["stage"] in stage_order else 999)

        return funnel_data

    def get_equipment_status_distribution(self) -> List[Dict[str, Any]]:
        query = """
            SELECT
                e.status,
                COUNT(*) as count,
                COUNT(*) * 100.0 / (SELECT COUNT(*) FROM equipments) as percentage
            FROM equipments e
            GROUP BY e.status
            ORDER BY count DESC
        """
        result = self.con.execute(query).fetchall()
        return [
            {"status": row[0], "count": int(row[1]), "percentage": round(float(row[2]), 2)}
            for row in result
        ]

    def get_inspection_pass_rate(self, start_date: Optional[str] = None,
                                 end_date: Optional[str] = None) -> Dict[str, Any]:
        where_clause = ""
        params = []
        if start_date:
            where_clause += " AND inspection_date >= ?"
            params.append(start_date)
        if end_date:
            where_clause += " AND inspection_date <= ?"
            params.append(end_date)

        query = f"""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN passed = TRUE THEN 1 ELSE 0 END) as passed,
                AVG(score) as avg_score
            FROM inspection_records
            WHERE 1=1 {where_clause}
        """
        result = self.con.execute(query, params).fetchone()
        total = int(result[0]) if result[0] else 0
        passed = int(result[1]) if result[1] else 0
        avg_score = float(result[2]) if result[2] else 0
        pass_rate = (passed / total * 100) if total > 0 else 0

        return {
            "total": total,
            "passed": passed,
            "failed": total - passed,
            "pass_rate": round(pass_rate, 2),
            "avg_score": round(avg_score, 2)
        }

    def get_store_list_with_stats(self, page: int = 1, page_size: int = 20,
                                  keyword: Optional[str] = None,
                                  status_filter: Optional[str] = None) -> Dict[str, Any]:
        where_clause = ""
        params = []
        if keyword:
            where_clause += " AND (s.store_name LIKE ? OR s.store_code LIKE ?)"
            params.extend([f"%{keyword}%", f"%{keyword}%"])
        if status_filter:
            where_clause += " AND s.status = ?"
            params.append(status_filter)

        count_query = f"""
            SELECT COUNT(*) FROM stores s WHERE 1=1 {where_clause}
        """
        total = self.con.execute(count_query, params).fetchone()[0]

        query = f"""
            SELECT
                s.id,
                s.store_code,
                s.store_name,
                s.city,
                s.district,
                s.status,
                COUNT(DISTINCT e.id) as equipment_count,
                COUNT(DISTINCT CASE WHEN e.status = 'normal' THEN e.id END) as normal_count,
                COUNT(DISTINCT CASE WHEN e.status = 'offline' THEN e.id END) as offline_count,
                COUNT(DISTINCT CASE WHEN e.status = 'maintenance' THEN e.id END) as maintenance_count,
                COUNT(DISTINCT cr.id) as cleaning_count,
                COALESCE(AVG(CASE WHEN ir.passed = TRUE THEN 1.0 ELSE 0.0 END) * 100, 0) as pass_rate
            FROM stores s
            LEFT JOIN equipments e ON s.id = e.store_id
            LEFT JOIN cleaning_records cr ON e.id = cr.equipment_id
            LEFT JOIN inspection_records ir ON e.id = ir.equipment_id
            WHERE 1=1 {where_clause}
            GROUP BY s.id, s.store_code, s.store_name, s.city, s.district, s.status
            ORDER BY s.store_code
            LIMIT ? OFFSET ?
        """
        offset = (page - 1) * page_size
        params.extend([page_size, offset])
        result = self.con.execute(query, params).fetchall()

        stores = []
        for row in result:
            stores.append({
                "id": row[0],
                "store_code": row[1],
                "store_name": row[2],
                "city": row[3],
                "district": row[4],
                "status": row[5],
                "equipment_count": int(row[6]),
                "normal_count": int(row[7]),
                "offline_count": int(row[8]),
                "maintenance_count": int(row[9]),
                "cleaning_count": int(row[10]),
                "pass_rate": round(float(row[11]), 2),
            })

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "items": stores
        }

    def get_offline_equipments(self, threshold_days: int = 7) -> List[Dict[str, Any]]:
        query = """
            SELECT
                e.id,
                e.equipment_code,
                e.equipment_name,
                e.equipment_type,
                e.store_id,
                s.store_code,
                s.store_name,
                s.city,
                e.status,
                e.last_cleaning_date,
                e.next_cleaning_date,
                e.cleaning_cycle_days,
                DATEDIFF('day', e.last_cleaning_date, CURRENT_DATE) as days_since_clean
            FROM equipments e
            LEFT JOIN stores s ON e.store_id = s.id
            WHERE e.status = 'offline'
               OR (e.last_cleaning_date IS NOT NULL
                   AND DATEDIFF('day', e.last_cleaning_date, CURRENT_DATE) > e.cleaning_cycle_days)
               OR e.last_cleaning_date IS NULL
            ORDER BY days_since_clean DESC NULLS LAST
        """
        result = self.con.execute(query).fetchall()
        equipments = []
        for row in result:
            equipments.append({
                "id": row[0],
                "equipment_code": row[1],
                "equipment_name": row[2],
                "equipment_type": row[3],
                "store_id": row[4],
                "store_code": row[5],
                "store_name": row[6],
                "city": row[7],
                "status": row[8],
                "last_cleaning_date": row[9],
                "next_cleaning_date": row[10],
                "cleaning_cycle_days": row[11],
                "days_since_clean": int(row[12]) if row[12] else 999,
            })
        return equipments

    def close(self):
        if self._con:
            self._con.close()
            self._con = None
