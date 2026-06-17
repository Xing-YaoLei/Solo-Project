import polars as pl
from typing import Dict, List, Tuple
from datetime import date, datetime, timedelta


class AttendanceAnalyzer:
    def __init__(self, db):
        self.db = db

    def get_daily_attendance_rate(self, start_date: date, end_date: date) -> pl.DataFrame:
        sql = f"""
        SELECT 
            scheduled_date,
            COUNT(*) as total_scheduled,
            SUM(CASE WHEN status = 'arrived' THEN 1 ELSE 0 END) as arrived_count,
            SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show_count,
            SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
            SUM(CASE WHEN status = 'abnormal' THEN 1 ELSE 0 END) as abnormal_count,
            ROUND(SUM(CASE WHEN status = 'arrived' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as attendance_rate,
            ROUND(SUM(CASE WHEN status IN ('arrived', 'late') THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as on_site_rate
        FROM attendance_records
        WHERE scheduled_date BETWEEN '{start_date}' AND '{end_date}'
        GROUP BY scheduled_date
        ORDER BY scheduled_date
        """
        return self.db.query(sql)

    def get_attendance_trend(self, start_date: date, end_date: date, window_days: int = 7) -> pl.DataFrame:
        daily = self.get_daily_attendance_rate(start_date, end_date)
        if len(daily) == 0:
            return daily

        daily = daily.with_columns([
            pl.col("scheduled_date").cast(pl.Date),
            pl.col("attendance_rate").cast(pl.Float64),
            pl.col("on_site_rate").cast(pl.Float64),
        ])

        result = daily.with_columns([
            pl.col("attendance_rate").rolling_mean(window_size=window_days).alias("attendance_ma{window_days}"),
            pl.col("on_site_rate").rolling_mean(window_size=window_days).alias("on_site_ma{window_days}"),
        ])

        return result

    def get_attendance_by_apartment(self, start_date: date, end_date: date) -> pl.DataFrame:
        sql = f"""
        SELECT 
            apartment_id,
            COUNT(*) as total_scheduled,
            SUM(CASE WHEN status = 'arrived' THEN 1 ELSE 0 END) as arrived_count,
            SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show_count,
            ROUND(SUM(CASE WHEN status = 'arrived' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as attendance_rate,
            ROUND(SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as no_show_rate
        FROM attendance_records
        WHERE scheduled_date BETWEEN '{start_date}' AND '{end_date}'
        GROUP BY apartment_id
        ORDER BY attendance_rate ASC
        """
        return self.db.query(sql)

    def get_attendance_by_time_slot(self, start_date: date, end_date: date) -> pl.DataFrame:
        sql = f"""
        SELECT 
            scheduled_time_slot,
            COUNT(*) as total_scheduled,
            SUM(CASE WHEN status = 'arrived' THEN 1 ELSE 0 END) as arrived_count,
            SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show_count,
            ROUND(SUM(CASE WHEN status = 'arrived' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as attendance_rate
        FROM attendance_records
        WHERE scheduled_date BETWEEN '{start_date}' AND '{end_date}'
        GROUP BY scheduled_time_slot
        ORDER BY scheduled_time_slot
        """
        return self.db.query(sql)

    def compare_periods(
        self,
        current_start: date,
        current_end: date,
        previous_start: date,
        previous_end: date
    ) -> Dict:
        current_rate = self._get_period_rate(current_start, current_end)
        previous_rate = self._get_period_rate(previous_start, previous_end)

        return {
            "current_period": {
                "start": current_start,
                "end": current_end,
                "total": current_rate["total"],
                "arrived": current_rate["arrived"],
                "attendance_rate": current_rate["rate"],
            },
            "previous_period": {
                "start": previous_start,
                "end": previous_end,
                "total": previous_rate["total"],
                "arrived": previous_rate["arrived"],
                "attendance_rate": previous_rate["rate"],
            },
            "improvement": {
                "absolute_diff": round(current_rate["rate"] - previous_rate["rate"], 2),
                "relative_diff": round(
                    (current_rate["rate"] - previous_rate["rate"]) / previous_rate["rate"] * 100, 2
                ) if previous_rate["rate"] > 0 else 0,
                "is_improved": current_rate["rate"] > previous_rate["rate"],
            }
        }

    def _get_period_rate(self, start_date: date, end_date: date) -> Dict:
        sql = f"""
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'arrived' THEN 1 ELSE 0 END) as arrived,
            ROUND(SUM(CASE WHEN status = 'arrived' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as rate
        FROM attendance_records
        WHERE scheduled_date BETWEEN '{start_date}' AND '{end_date}'
        """
        result = self.db.query(sql)
        if len(result) == 0:
            return {"total": 0, "arrived": 0, "rate": 0.0}
        row = result.row(0)
        return {
            "total": row[0] or 0,
            "arrived": row[1] or 0,
            "rate": row[2] or 0.0,
        }

    def get_reschedule_impact(self, start_date: date, end_date: date) -> pl.DataFrame:
        sql = f"""
        SELECT 
            r.apartment_id,
            r.room_id,
            r.new_date as schedule_date,
            r.new_time_slot,
            r.reason,
            r.status as reschedule_status,
            a.status as attendance_status,
            CASE 
                WHEN r.data_quality != 'complete' THEN true
                ELSE false
            END as has_data_gap,
            r.data_quality
        FROM reschedule_records r
        LEFT JOIN attendance_records a 
            ON r.apartment_id = a.apartment_id 
            AND r.room_id = a.room_id
            AND r.new_date = a.scheduled_date
        WHERE r.new_date BETWEEN '{start_date}' AND '{end_date}'
        ORDER BY r.new_date
        """
        return self.db.query(sql)

    def get_data_gap_stats(self, start_date: date, end_date: date) -> Dict:
        sql = f"""
        SELECT 
            data_quality,
            COUNT(*) as count
        FROM reschedule_records
        WHERE new_date BETWEEN '{start_date}' AND '{end_date}'
        GROUP BY data_quality
        """
        result = self.db.query(sql)
        stats = {}
        for row in result.rows():
            stats[row[0]] = row[1]
        return stats
