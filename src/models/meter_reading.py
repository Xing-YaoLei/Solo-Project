from typing import Optional
from datetime import datetime, date
import polars as pl

from ..data_sync.duckdb_store import DuckDBStore


class MeterReadingModel:
    def __init__(self, db: Optional[DuckDBStore] = None):
        self.db = db or DuckDBStore()

    def transform(self, raw_df: pl.DataFrame) -> pl.DataFrame:
        return (
            raw_df.with_columns(
                [
                    pl.col("reading_date").cast(pl.Utf8, strict=False).str.strptime(pl.Date, strict=False),
                    pl.col("electricity_usage").cast(pl.Float64).fill_null(0.0),
                    pl.col("water_usage").cast(pl.Float64).fill_null(0.0),
                    pl.col("created_at")
                    .cast(pl.Utf8, strict=False)
                    .str.strptime(pl.Datetime, strict=False)
                    .fill_null(datetime.now()),
                ]
            )
            .with_columns(
                [
                    pl.col("id").cast(pl.Utf8),
                    pl.col("apartment_id").cast(pl.Utf8),
                    pl.col("meter_reader_id").cast(pl.Utf8),
                    pl.col("region").cast(pl.Utf8),
                    pl.col("notes").cast(pl.Utf8).fill_null(""),
                ]
            )
            .unique(subset=["id"], keep="last")
        )

    def get_recent_readings(self, region: Optional[str] = None, days: int = 30) -> pl.DataFrame:
        sql = """
            SELECT
                region,
                apartment_id,
                reading_date,
                electricity_usage,
                water_usage,
                meter_reader_id,
                notes
            FROM meter_readings
            WHERE reading_date >= CURRENT_DATE - INTERVAL ? DAY
        """
        params = [days]
        if region:
            sql += " AND region = ?"
            params.append(region)
        sql += " ORDER BY reading_date DESC"
        return self.db.query(sql, params)

    def get_high_usage_apartments(self, threshold_electricity: float = 500.0, threshold_water: float = 50.0) -> pl.DataFrame:
        return self.db.query(
            """
            SELECT
                apartment_id,
                region,
                AVG(electricity_usage) AS avg_electricity,
                AVG(water_usage) AS avg_water,
                COUNT(*) AS reading_count
            FROM meter_readings
            GROUP BY apartment_id, region
            HAVING AVG(electricity_usage) > ? OR AVG(water_usage) > ?
            ORDER BY avg_electricity DESC
            """,
            [threshold_electricity, threshold_water],
        )
