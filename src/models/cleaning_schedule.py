from typing import Optional
from datetime import datetime, date, timedelta
import polars as pl

from ..data_sync.duckdb_store import DuckDBStore
from ..config import CAPACITY_RULES


class CleaningScheduleModel:
    def __init__(self, db: Optional[DuckDBStore] = None):
        self.db = db or DuckDBStore()

    def transform(self, raw_df: pl.DataFrame) -> pl.DataFrame:
        return (
            raw_df.with_columns(
                [
                    pl.col("scheduled_date").cast(pl.Utf8, strict=False).str.strptime(pl.Date, strict=False),
                    pl.col("arrival_status").cast(pl.Utf8).fill_null("unknown"),
                    pl.col("reminder_sent").cast(pl.Boolean).fill_null(False),
                    pl.col("priority").cast(pl.Int64).fill_null(0),
                    pl.col("created_at")
                    .cast(pl.Utf8, strict=False)
                    .str.strptime(pl.Datetime, strict=False)
                    .fill_null(datetime.now()),
                    pl.col("updated_at")
                    .cast(pl.Utf8, strict=False)
                    .str.strptime(pl.Datetime, strict=False)
                    .fill_null(datetime.now()),
                ]
            )
            .with_columns(
                [
                    pl.col("id").cast(pl.Utf8),
                    pl.col("apartment_id").cast(pl.Utf8),
                    pl.col("cleaner_id").cast(pl.Utf8),
                    pl.col("region").cast(pl.Utf8),
                    pl.col("status").cast(pl.Utf8),
                    pl.col("scheduled_start").cast(pl.Utf8).fill_null("09:00"),
                    pl.col("scheduled_end").cast(pl.Utf8).fill_null("11:00"),
                    pl.when(pl.col("actual_start").cast(pl.Utf8) == "")
                    .then(None)
                    .otherwise(pl.col("actual_start").cast(pl.Utf8))
                    .alias("actual_start"),
                    pl.when(pl.col("actual_end").cast(pl.Utf8) == "")
                    .then(None)
                    .otherwise(pl.col("actual_end").cast(pl.Utf8))
                    .alias("actual_end"),
                ]
            )
            .unique(subset=["id"], keep="last")
        )

    def get_schedules(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        region: Optional[str] = None,
        status: Optional[str] = None,
        arrival_status: Optional[str] = None,
    ) -> pl.DataFrame:
        sql = "SELECT * FROM cleaning_schedules WHERE 1=1"
        params = []
        if start_date:
            sql += " AND scheduled_date >= ?"
            params.append(start_date)
        if end_date:
            sql += " AND scheduled_date <= ?"
            params.append(end_date)
        if region:
            sql += " AND region = ?"
            params.append(region)
        if status:
            sql += " AND status = ?"
            params.append(status)
        if arrival_status:
            sql += " AND arrival_status = ?"
            params.append(arrival_status)
        sql += " ORDER BY scheduled_date DESC, scheduled_start"
        return self.db.query(sql, params)

    def get_funnel_data(self, start_date: date, end_date: date, region: Optional[str] = None) -> pl.DataFrame:
        sql = """
            SELECT
                region,
                COUNT(*) AS total_scheduled,
                SUM(CASE WHEN reminder_sent THEN 1 ELSE 0 END) AS reminder_sent,
                SUM(CASE WHEN arrival_status = 'on_time' THEN 1 ELSE 0 END) AS on_time,
                SUM(CASE WHEN arrival_status = 'late' THEN 1 ELSE 0 END) AS late,
                SUM(CASE WHEN arrival_status = 'absent' THEN 1 ELSE 0 END) AS absent,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
            FROM cleaning_schedules
            WHERE scheduled_date BETWEEN ? AND ?
        """
        params = [start_date, end_date]
        if region:
            sql += " AND region = ?"
            params.append(region)
        sql += " GROUP BY region ORDER BY region"
        return self.db.query(sql, params)

    def get_arrival_rate(
        self, start_date: date, end_date: date, group_by: str = "date", region: Optional[str] = None
    ) -> pl.DataFrame:
        group_expr = {
            "date": "scheduled_date",
            "region": "region",
            "cleaner": "cleaner_id",
            "region_date": "region, scheduled_date",
        }.get(group_by, "scheduled_date")

        sql = f"""
            SELECT
                {group_expr},
                COUNT(*) AS total,
                SUM(CASE WHEN arrival_status = 'on_time' THEN 1 ELSE 0 END) AS on_time_count,
                SUM(CASE WHEN arrival_status = 'late' THEN 1 ELSE 0 END) AS late_count,
                SUM(CASE WHEN arrival_status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
                ROUND(
                    SUM(CASE WHEN arrival_status IN ('on_time', 'late') THEN 1 ELSE 0 END) * 100.0 /
                    NULLIF(COUNT(*), 0), 2
                ) AS arrival_rate,
                ROUND(
                    SUM(CASE WHEN arrival_status = 'on_time' THEN 1 ELSE 0 END) * 100.0 /
                    NULLIF(COUNT(*), 0), 2
                ) AS on_time_rate
            FROM cleaning_schedules
            WHERE scheduled_date BETWEEN ? AND ?
        """
        params = [start_date, end_date]
        if region and group_by != "region":
            sql += " AND region = ?"
            params.append(region)
        sql += f" GROUP BY {group_expr} ORDER BY {group_expr}"
        return self.db.query(sql, params)

    def get_time_conflicts(self, target_date: date) -> pl.DataFrame:
        return self.db.query(
            """
            SELECT
                a.id AS schedule_a,
                b.id AS schedule_b,
                a.cleaner_id,
                a.region,
                a.scheduled_date,
                a.scheduled_start AS a_start,
                a.scheduled_end AS a_end,
                b.scheduled_start AS b_start,
                b.scheduled_end AS b_end,
                a.apartment_id AS apartment_a,
                b.apartment_id AS apartment_b
            FROM cleaning_schedules a
            JOIN cleaning_schedules b
                ON a.cleaner_id = b.cleaner_id
                AND a.scheduled_date = b.scheduled_date
                AND a.id < b.id
                AND a.scheduled_start < b.scheduled_end
                AND b.scheduled_start < a.scheduled_end
            WHERE a.scheduled_date = ?
            ORDER BY a.cleaner_id, a.scheduled_start
            """,
            [target_date],
        )

    def get_schedule_detail(self, schedule_id: str) -> Optional[pl.DataFrame]:
        result = self.db.query("SELECT * FROM cleaning_schedules WHERE id = ?", [schedule_id])
        return result if not result.is_empty() else None

    def get_reminder_list(
        self, start_date: date, end_date: date, region: Optional[str] = None
    ) -> pl.DataFrame:
        sql = """
            SELECT
                id, apartment_id, cleaner_id, region,
                scheduled_date, scheduled_start, scheduled_end,
                arrival_status, reminder_sent, status
            FROM cleaning_schedules
            WHERE scheduled_date BETWEEN ? AND ?
              AND (reminder_sent = FALSE OR arrival_status = 'absent')
        """
        params = [start_date, end_date]
        if region:
            sql += " AND region = ?"
            params.append(region)
        sql += " ORDER BY scheduled_date, scheduled_start"
        return self.db.query(sql, params)

    def get_capacity_utilization(self, target_date: date, region: Optional[str] = None) -> pl.DataFrame:
        sql = """
            SELECT
                region,
                cleaner_id,
                COUNT(*) AS assigned_tasks,
                STRING_AGG(scheduled_start || '-' || scheduled_end, ', ') AS time_slots
            FROM cleaning_schedules
            WHERE scheduled_date = ?
        """
        params = [target_date]
        if region:
            sql += " AND region = ?"
            params.append(region)
        sql += " GROUP BY region, cleaner_id ORDER BY region, assigned_tasks DESC"
        return self.db.query(sql, params)

    def compare_yoy(
        self, metric: str, current_start: date, current_end: date, region: Optional[str] = None
    ) -> dict:
        prev_start = current_start - timedelta(days=365)
        prev_end = current_end - timedelta(days=365)
        return self._compare_periods(metric, current_start, current_end, prev_start, prev_end, region)

    def compare_mom(
        self, metric: str, current_start: date, current_end: date, region: Optional[str] = None
    ) -> dict:
        days = (current_end - current_start).days + 1
        prev_end = current_start - timedelta(days=1)
        prev_start = prev_end - timedelta(days=days - 1)
        return self._compare_periods(metric, current_start, current_end, prev_start, prev_end, region)

    def _compare_periods(
        self,
        metric: str,
        current_start: date,
        current_end: date,
        prev_start: date,
        prev_end: date,
        region: Optional[str],
    ) -> dict:
        metric_sql = {
            "arrival_rate": """
                ROUND(
                    SUM(CASE WHEN arrival_status IN ('on_time', 'late') THEN 1 ELSE 0 END) * 100.0 /
                    NULLIF(COUNT(*), 0), 2
                )
            """,
            "on_time_rate": """
                ROUND(
                    SUM(CASE WHEN arrival_status = 'on_time' THEN 1 ELSE 0 END) * 100.0 /
                    NULLIF(COUNT(*), 0), 2
                )
            """,
            "completion_rate": """
                ROUND(
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 /
                    NULLIF(COUNT(*), 0), 2
                )
            """,
            "total_scheduled": "COUNT(*)",
            "reminder_rate": """
                ROUND(
                    SUM(CASE WHEN reminder_sent THEN 1 ELSE 0 END) * 100.0 /
                    NULLIF(COUNT(*), 0), 2
                )
            """,
        }.get(metric, "COUNT(*)")

        def _query(s, e):
            sql = f"SELECT {metric_sql} AS val FROM cleaning_schedules WHERE scheduled_date BETWEEN ? AND ?"
            params = [s, e]
            if region:
                sql += " AND region = ?"
                params.append(region)
            result = self.db.query(sql, params)
            if result.is_empty():
                return 0.0
            val = result["val"][0]
            return float(val) if val is not None else 0.0

        current = _query(current_start, current_end)
        previous = _query(prev_start, prev_end)
        diff = current - previous
        pct = round((diff / previous * 100), 2) if previous != 0 else 0.0
        return {
            "current": current,
            "previous": previous,
            "diff": diff,
            "diff_pct": pct,
            "current_period": f"{current_start} ~ {current_end}",
            "previous_period": f"{prev_start} ~ {prev_end}",
        }
