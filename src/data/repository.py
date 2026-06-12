from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional

import polars as pl

from src.data.duckdb_manager import DuckDBManager
from src.data.minio_client import MinIOClient


@dataclass
class DataRepository:
    def __post_init__(self) -> None:
        self.db = DuckDBManager()
        self.minio = MinIOClient()

    def get_inventory(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        store_ids: Optional[list[str]] = None,
    ) -> pl.DataFrame:
        conditions = []
        params: list = []
        if start_date:
            conditions.append("record_date >= ?")
            params.append(start_date.isoformat())
        if end_date:
            conditions.append("record_date <= ?")
            params.append(end_date.isoformat())
        if store_ids:
            placeholders = ",".join(["?"] * len(store_ids))
            conditions.append(f"store_id IN ({placeholders})")
            params.extend(store_ids)
        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        sql = f"SELECT * FROM inventory {where} ORDER BY record_date DESC"
        return self.db.query_df(sql, params)

    def get_member_receipts(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        store_ids: Optional[list[str]] = None,
    ) -> pl.DataFrame:
        conditions = []
        params: list = []
        if start_date:
            conditions.append("sale_date >= ?")
            params.append(start_date.isoformat())
        if end_date:
            conditions.append("sale_date <= ?")
            params.append(end_date.isoformat())
        if store_ids:
            placeholders = ",".join(["?"] * len(store_ids))
            conditions.append(f"store_id IN ({placeholders})")
            params.extend(store_ids)
        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        sql = f"SELECT * FROM member_receipts {where} ORDER BY sale_date DESC"
        return self.db.query_df(sql, params)

    def get_delivery_orders(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        store_ids: Optional[list[str]] = None,
    ) -> pl.DataFrame:
        conditions = []
        params: list = []
        if start_date:
            conditions.append("order_date >= ?")
            params.append(start_date.isoformat())
        if end_date:
            conditions.append("order_date <= ?")
            params.append(end_date.isoformat())
        if store_ids:
            placeholders = ",".join(["?"] * len(store_ids))
            conditions.append(f"store_id IN ({placeholders})")
            params.extend(store_ids)
        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        sql = f"SELECT * FROM delivery_orders {where} ORDER BY order_date DESC"
        return self.db.query_df(sql, params)

    def get_loss_reports(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        store_ids: Optional[list[str]] = None,
        review_status: Optional[list[str]] = None,
    ) -> pl.DataFrame:
        conditions = []
        params: list = []
        if start_date:
            conditions.append("report_date >= ?")
            params.append(start_date.isoformat())
        if end_date:
            conditions.append("report_date <= ?")
            params.append(end_date.isoformat())
        if store_ids:
            placeholders = ",".join(["?"] * len(store_ids))
            conditions.append(f"store_id IN ({placeholders})")
            params.extend(store_ids)
        if review_status:
            placeholders = ",".join(["?"] * len(review_status))
            conditions.append(f"review_status IN ({placeholders})")
            params.extend(review_status)
        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        sql = f"SELECT * FROM loss_report {where} ORDER BY report_date DESC"
        return self.db.query_df(sql, params)

    def insert_loss_reports(self, df: pl.DataFrame) -> None:
        if df.is_empty():
            return
        self.db.register_polars("tmp_loss_report", df)
        self.db.execute(
            """
            INSERT OR REPLACE INTO loss_report SELECT * FROM tmp_loss_report
            """
        )
        self.db.execute("DROP VIEW IF EXISTS tmp_loss_report")

    def get_metric_versions(self) -> pl.DataFrame:
        return self.db.query_df(
            "SELECT * FROM metric_versions ORDER BY effective_date DESC"
        )

    def insert_metric_version(
        self,
        version: str,
        description: str,
        formula: str,
        effective_date: date,
        created_by: str,
        changelog: str,
    ) -> None:
        self.db.execute(
            """
            INSERT OR REPLACE INTO metric_versions
            (version, description, formula, effective_date, created_by, changelog)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            [version, description, formula, effective_date.isoformat(), created_by, changelog],
        )

    def get_stores(self) -> pl.DataFrame:
        return self.db.query_df(
            """
            SELECT DISTINCT store_id, store_name
            FROM (
                SELECT store_id, store_name FROM loss_report
                UNION
                SELECT store_id, store_name FROM inventory
                UNION
                SELECT store_id, store_name FROM member_receipts
                UNION
                SELECT store_id, store_name FROM delivery_orders
            )
            ORDER BY store_id
            """
        )

    def get_loss_reasons(self) -> pl.DataFrame:
        return self.db.query_df(
            "SELECT DISTINCT loss_reason FROM loss_report WHERE loss_reason IS NOT NULL ORDER BY loss_reason"
        )

    def save_refresh_time(self) -> None:
        import json
        import os

        from src.config import app_config

        os.makedirs(os.path.dirname(app_config.refresh_cache_path), exist_ok=True)
        data = {"last_refresh": datetime.now().isoformat()}
        with open(app_config.refresh_cache_path, "w", encoding="utf-8") as f:
            json.dump(data, f)

    def get_refresh_time(self) -> Optional[str]:
        import json
        import os

        from src.config import app_config

        if not os.path.exists(app_config.refresh_cache_path):
            return None
        try:
            with open(app_config.refresh_cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("last_refresh")
        except Exception:
            return None

    def sync_from_minio(self, object_name: str, target_table: str) -> int:
        df = self.minio.get_parquet(object_name)
        if df is None or df.is_empty():
            return 0
        self.db.register_polars(f"tmp_{target_table}", df)
        self.db.execute(f"INSERT OR REPLACE INTO {target_table} SELECT * FROM tmp_{target_table}")
        self.db.execute(f"DROP VIEW IF EXISTS tmp_{target_table}")
        return len(df)

    def sync_all_from_minio(self) -> dict[str, int]:
        mapping = {
            "inventory.parquet": "inventory",
            "member_receipts.parquet": "member_receipts",
            "delivery_orders.parquet": "delivery_orders",
            "loss_report.parquet": "loss_report",
            "metric_versions.parquet": "metric_versions",
        }
        result = {}
        for obj, table in mapping.items():
            result[table] = self.sync_from_minio(obj, table)
        self.save_refresh_time()
        return result
