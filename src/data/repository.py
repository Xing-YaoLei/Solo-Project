import polars as pl
from typing import Optional, List, Tuple
from datetime import date, timedelta
import hashlib
import json

from src.data.duckdb_manager import DuckDBManager
from src.config import Config


class DataRepository:
    def __init__(self):
        self.db = DuckDBManager()

    def get_complaints_funnel(self, start_date: date, end_date: date,
                              region: Optional[str] = None) -> pl.DataFrame:
        query = """
            SELECT
                complaint_date,
                region,
                status,
                COUNT(*) as count
            FROM complaints
            WHERE complaint_date BETWEEN ? AND ?
        """
        params = [start_date, end_date]

        if region:
            query += " AND region = ?"
            params.append(region)

        query += " GROUP BY complaint_date, region, status ORDER BY complaint_date"

        return self.db.execute_query(query, params)

    def get_complaints_by_tag(self, start_date: date, end_date: date,
                              region: Optional[str] = None) -> pl.DataFrame:
        query = """
            SELECT
                tag,
                COUNT(*) as count,
                AVG(close_hours) as avg_close_hours
            FROM complaints
            WHERE complaint_date BETWEEN ? AND ?
        """
        params = [start_date, end_date]

        if region:
            query += " AND region = ?"
            params.append(region)

        query += " GROUP BY tag ORDER BY count DESC"

        return self.db.execute_query(query, params)

    def get_complaints_by_region(self, start_date: date, end_date: date) -> pl.DataFrame:
        return self.db.execute_query("""
            SELECT
                region,
                COUNT(*) as total_count,
                SUM(CASE WHEN status = '已关闭' THEN 1 ELSE 0 END) as closed_count,
                SUM(CASE WHEN status = '处理中' THEN 1 ELSE 0 END) as processing_count,
                AVG(close_hours) as avg_close_hours
            FROM complaints
            WHERE complaint_date BETWEEN ? AND ?
            GROUP BY region
            ORDER BY total_count DESC
        """, [start_date, end_date])

    def get_close_hours_distribution(self, start_date: date, end_date: date,
                                     region: Optional[str] = None) -> pl.DataFrame:
        query = """
            SELECT
                CASE
                    WHEN close_hours <= 2 THEN '0-2小时'
                    WHEN close_hours <= 8 THEN '2-8小时'
                    WHEN close_hours <= 24 THEN '8-24小时'
                    WHEN close_hours <= 72 THEN '24-72小时'
                    ELSE '72小时以上'
                END as close_duration,
                COUNT(*) as count
            FROM complaints
            WHERE complaint_date BETWEEN ? AND ?
              AND status = '已关闭'
        """
        params = [start_date, end_date]

        if region:
            query += " AND region = ?"
            params.append(region)

        query += """
            GROUP BY close_duration
            ORDER BY
                CASE close_duration
                    WHEN '0-2小时' THEN 1
                    WHEN '2-8小时' THEN 2
                    WHEN '8-24小时' THEN 3
                    WHEN '24-72小时' THEN 4
                    ELSE 5
                END
        """

        return self.db.execute_query(query, params)

    def get_followup_results(self, start_date: date, end_date: date,
                             region: Optional[str] = None) -> pl.DataFrame:
        query = """
            SELECT
                followup_result,
                COUNT(*) as count
            FROM complaints
            WHERE complaint_date BETWEEN ? AND ?
              AND followup_result IS NOT NULL
        """
        params = [start_date, end_date]

        if region:
            query += " AND region = ?"
            params.append(region)

        query += " GROUP BY followup_result ORDER BY count DESC"

        return self.db.execute_query(query, params)

    def get_responsibility_distribution(self, start_date: date, end_date: date,
                                        region: Optional[str] = None) -> pl.DataFrame:
        query = """
            SELECT
                responsibility,
                COUNT(*) as count,
                AVG(close_hours) as avg_close_hours
            FROM complaints
            WHERE complaint_date BETWEEN ? AND ?
              AND responsibility IS NOT NULL
        """
        params = [start_date, end_date]

        if region:
            query += " AND region = ?"
            params.append(region)

        query += " GROUP BY responsibility ORDER BY count DESC"

        return self.db.execute_query(query, params)

    def get_daily_trend(self, start_date: date, end_date: date,
                        region: Optional[str] = None) -> pl.DataFrame:
        query = """
            SELECT
                complaint_date,
                COUNT(*) as total_count,
                SUM(CASE WHEN status = '已关闭' THEN 1 ELSE 0 END) as closed_count,
                SUM(CASE WHEN status = '处理中' THEN 1 ELSE 0 END) as processing_count
            FROM complaints
            WHERE complaint_date BETWEEN ? AND ?
        """
        params = [start_date, end_date]

        if region:
            query += " AND region = ?"
            params.append(region)

        query += " GROUP BY complaint_date ORDER BY complaint_date"

        return self.db.execute_query(query, params)

    def get_complaint_detail(self, complaint_id: str) -> pl.DataFrame:
        return self.db.execute_query("""
            SELECT * FROM complaints WHERE complaint_id = ?
        """, [complaint_id])

    def get_complaints_by_tag_detail(self, tag: str, start_date: date, end_date: date,
                                     region: Optional[str] = None) -> pl.DataFrame:
        query = """
            SELECT
                complaint_id,
                complaint_date,
                region,
                tag,
                description,
                status,
                close_hours,
                responsibility,
                followup_result
            FROM complaints
            WHERE tag = ?
              AND complaint_date BETWEEN ? AND ?
        """
        params = [tag, start_date, end_date]

        if region:
            query += " AND region = ?"
            params.append(region)

        query += " ORDER BY complaint_date DESC"

        return self.db.execute_query(query, params)

    def get_yo_y_data(self, current_start: date, current_end: date,
                      region: Optional[str] = None) -> Tuple[pl.DataFrame, pl.DataFrame]:
        last_year_start = date(current_start.year - 1, current_start.month, current_start.day)
        last_year_end = date(current_end.year - 1, current_end.month, current_end.day)

        current = self.get_daily_trend(current_start, current_end, region)
        previous = self.get_daily_trend(last_year_start, last_year_end, region)

        return current, previous

    def get_mo_m_data(self, current_start: date, current_end: date,
                      region: Optional[str] = None) -> Tuple[pl.DataFrame, pl.DataFrame]:
        prev_month_start = date(current_start.year, current_start.month - 1, 1) if current_start.month > 1 else date(current_start.year - 1, 12, 1)
        prev_month_end = date(current_start.year, current_start.month, 1) - timedelta(days=1)

        current = self.get_daily_trend(current_start, current_end, region)
        previous = self.get_daily_trend(prev_month_start, prev_month_end, region)

        return current, previous

    def get_pipeline_runs(self, limit: int = 50) -> pl.DataFrame:
        return self.db.get_pipeline_runs(limit)

    def get_timeout_complaints(self, threshold_hours: float, start_date: date, end_date: date,
                               region: Optional[str] = None) -> pl.DataFrame:
        query = """
            SELECT
                complaint_id,
                complaint_date,
                region,
                tag,
                description,
                status,
                close_hours,
                responsibility
            FROM complaints
            WHERE complaint_date BETWEEN ? AND ?
              AND close_hours > ?
        """
        params = [start_date, end_date, threshold_hours]

        if region:
            query += " AND region = ?"
            params.append(region)

        query += " ORDER BY close_hours DESC"

        return self.db.execute_query(query, params)

    def generate_filter_hash(self, filters: dict) -> str:
        filter_str = json.dumps(filters, sort_keys=True, ensure_ascii=False)
        return hashlib.md5(filter_str.encode("utf-8")).hexdigest()[:8]

    def get_visitor_volume(self, start_date: date, end_date: date,
                           region: Optional[str] = None) -> pl.DataFrame:
        query = """
            SELECT
                stat_date as date,
                SUM(visitor_in) as total_visitors
            FROM camera_statistics
            WHERE stat_date BETWEEN ? AND ?
        """
        params = [start_date, end_date]

        if region:
            query += " AND region = ?"
            params.append(region)

        query += " GROUP BY stat_date ORDER BY stat_date"

        return self.db.execute_query(query, params)
