from typing import Optional
from datetime import datetime, date
import polars as pl

from ..data_sync.duckdb_store import DuckDBStore


class EContractModel:
    def __init__(self, db: Optional[DuckDBStore] = None):
        self.db = db or DuckDBStore()

    def transform(self, raw_df: pl.DataFrame) -> pl.DataFrame:
        return (
            raw_df.with_columns(
                [
                    pl.col("contract_start").cast(pl.Utf8, strict=False).str.strptime(pl.Date, strict=False),
                    pl.col("contract_end").cast(pl.Utf8, strict=False).str.strptime(pl.Date, strict=False),
                    pl.col("monthly_rent").cast(pl.Float64).round(2),
                    pl.col("signed_at")
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
                    pl.col("cleaning_frequency").cast(pl.Utf8),
                    pl.col("region").cast(pl.Utf8),
                    pl.col("status").cast(pl.Utf8),
                ]
            )
            .unique(subset=["id"], keep="last")
        )

    def get_active_contracts(self, as_of_date: Optional[date] = None) -> pl.DataFrame:
        as_of = as_of_date or date.today()
        return self.db.query(
            """
            SELECT
                id, apartment_id, tenant_id, region,
                cleaning_frequency, monthly_rent,
                contract_start, contract_end, status
            FROM e_contracts
            WHERE contract_start <= ?
              AND contract_end >= ?
              AND status = 'active'
            """,
            [as_of, as_of],
        )

    def get_cleaning_frequency_map(self) -> dict:
        freq_map = {"weekly": 4, "biweekly": 2, "monthly": 1, "daily": 30, "none": 0}
        contracts = self.get_active_contracts()
        result = {}
        for row in contracts.iter_rows(named=True):
            apt_id = row["apartment_id"]
            freq = row["cleaning_frequency"] or "monthly"
            result[apt_id] = freq_map.get(freq, 4)
        return result
