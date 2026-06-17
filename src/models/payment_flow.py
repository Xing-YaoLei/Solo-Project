from typing import Optional
from datetime import datetime, date
import polars as pl

from ..data_sync.duckdb_store import DuckDBStore


class PaymentFlowModel:
    def __init__(self, db: Optional[DuckDBStore] = None):
        self.db = db or DuckDBStore()

    def transform(self, raw_df: pl.DataFrame) -> pl.DataFrame:
        return (
            raw_df.with_columns(
                [
                    pl.col("payment_date").cast(pl.Utf8, strict=False).str.strptime(pl.Date, strict=False),
                    pl.col("amount").cast(pl.Float64).round(2),
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
                    pl.col("tenant_id").cast(pl.Utf8),
                    pl.col("payment_type").cast(pl.Utf8),
                    pl.col("status").cast(pl.Utf8),
                    pl.col("region").cast(pl.Utf8),
                ]
            )
            .unique(subset=["id"], keep="last")
        )

    def get_payment_summary(
        self, start_date: Optional[date] = None, end_date: Optional[date] = None, region: Optional[str] = None
    ) -> pl.DataFrame:
        sql = """
            SELECT
                region,
                DATE_TRUNC('month', payment_date) AS payment_month,
                payment_type,
                status,
                COUNT(*) AS transaction_count,
                SUM(amount) AS total_amount,
                AVG(amount) AS avg_amount
            FROM payment_flows
            WHERE 1=1
        """
        params = []
        if start_date:
            sql += " AND payment_date >= ?"
            params.append(start_date)
        if end_date:
            sql += " AND payment_date <= ?"
            params.append(end_date)
        if region:
            sql += " AND region = ?"
            params.append(region)
        sql += " GROUP BY region, payment_month, payment_type, status ORDER BY payment_month DESC"
        return self.db.query(sql, params)

    def get_paid_apartments(self, start_date: date, end_date: date) -> pl.DataFrame:
        return self.db.query(
            """
            SELECT DISTINCT apartment_id, tenant_id, region
            FROM payment_flows
            WHERE payment_date BETWEEN ? AND ?
              AND status = 'success'
            """,
            [start_date, end_date],
        )
