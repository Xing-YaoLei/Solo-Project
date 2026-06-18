from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import polars as pl
import uuid

from .duckdb_engine import DuckDBEngine
from .minio_storage import MinIOStorage
from .polars_processor import PolarsProcessor
from config import DataSource, DATA_SOURCE_LABELS, SyncStatus


class DataRepository:
    def __init__(
        self,
        duckdb: Optional[DuckDBEngine] = None,
        minio: Optional[MinIOStorage] = None,
        processor: Optional[PolarsProcessor] = None,
    ):
        self.duckdb = duckdb or DuckDBEngine()
        self.minio = minio or MinIOStorage()
        self.processor = processor or PolarsProcessor()

    def _generate_id(self) -> str:
        return str(uuid.uuid4())

    def create_sync_batch(
        self,
        data_source: str,
        total_count: int = 0,
    ) -> str:
        batch_id = f"{data_source}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.duckdb.execute(
            """
            INSERT INTO sync_batches (batch_id, data_source, batch_date, status, total_count)
            VALUES (?, ?, ?, ?, ?)
            """,
            [batch_id, data_source, datetime.now(), SyncStatus.RUNNING, total_count],
        )
        return batch_id

    def update_sync_batch(
        self,
        batch_id: str,
        status: str,
        success_count: int = 0,
        failed_count: int = 0,
        error_message: Optional[str] = None,
    ):
        self.duckdb.execute(
            """
            UPDATE sync_batches
            SET status = ?, success_count = ?, failed_count = ?, error_message = ?, updated_at = ?
            WHERE batch_id = ?
            """,
            [status, success_count, failed_count, error_message, datetime.now(), batch_id],
        )

    def get_sync_batches(self, data_source: Optional[str] = None, limit: int = 50) -> pl.DataFrame:
        sql = "SELECT * FROM sync_batches"
        params = []
        if data_source:
            sql += " WHERE data_source = ?"
            params.append(data_source)
        sql += " ORDER BY batch_date DESC LIMIT ?"
        params.append(limit)
        return self.duckdb.query_df(sql, params)

    def insert_design_exports(self, df: pl.DataFrame, batch_id: Optional[str] = None) -> Dict[str, int]:
        if df.height == 0:
            return {"success": 0, "failed": 0, "total": 0}
        cleaned_df = self.processor.clean_data(df, DataSource.DESIGN_EXPORT)
        if batch_id:
            cleaned_df = cleaned_df.with_columns(pl.lit(batch_id).alias("batch_id"))
        if "id" not in cleaned_df.columns:
            cleaned_df = cleaned_df.with_columns(
                pl.Series([self._generate_id() for _ in range(cleaned_df.height)]).alias("id")
            )

        success_count = cleaned_df.filter(~pl.col("is_missing")).height if "is_missing" in cleaned_df.columns else cleaned_df.height
        failed_count = cleaned_df.filter(pl.col("is_missing")).height if "is_missing" in cleaned_df.columns else 0

        self.duckdb.write_df("design_exports", cleaned_df)

        return {"success": success_count, "failed": failed_count, "total": cleaned_df.height}

    def insert_payment_records(self, df: pl.DataFrame, batch_id: Optional[str] = None) -> Dict[str, int]:
        if df.height == 0:
            return {"success": 0, "failed": 0, "total": 0}
        cleaned_df = self.processor.clean_data(df, DataSource.PAYMENT_RECORD)
        if batch_id:
            cleaned_df = cleaned_df.with_columns(pl.lit(batch_id).alias("batch_id"))
        if "id" not in cleaned_df.columns:
            cleaned_df = cleaned_df.with_columns(
                pl.Series([self._generate_id() for _ in range(cleaned_df.height)]).alias("id")
            )

        success_count = cleaned_df.filter(~pl.col("is_missing")).height if "is_missing" in cleaned_df.columns else cleaned_df.height
        failed_count = cleaned_df.filter(pl.col("is_missing")).height if "is_missing" in cleaned_df.columns else 0

        self.duckdb.write_df("payment_records", cleaned_df)

        return {"success": success_count, "failed": failed_count, "total": cleaned_df.height}

    def insert_purchase_orders(self, df: pl.DataFrame, batch_id: Optional[str] = None) -> Dict[str, int]:
        if df.height == 0:
            return {"success": 0, "failed": 0, "total": 0}
        cleaned_df = self.processor.clean_data(df, DataSource.PURCHASE_ORDER)
        if batch_id:
            cleaned_df = cleaned_df.with_columns(pl.lit(batch_id).alias("batch_id"))
        if "id" not in cleaned_df.columns:
            cleaned_df = cleaned_df.with_columns(
                pl.Series([self._generate_id() for _ in range(cleaned_df.height)]).alias("id")
            )

        success_count = cleaned_df.filter(~pl.col("is_missing")).height if "is_missing" in cleaned_df.columns else cleaned_df.height
        failed_count = cleaned_df.filter(pl.col("is_missing")).height if "is_missing" in cleaned_df.columns else 0

        self.duckdb.write_df("purchase_orders", cleaned_df)

        return {"success": success_count, "failed": failed_count, "total": cleaned_df.height}

    def get_project_confirmations(
        self,
        region: Optional[str] = None,
        risk_level: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> pl.DataFrame:
        sql = "SELECT * FROM project_confirmations WHERE 1=1"
        params = []
        if region:
            sql += " AND region = ?"
            params.append(region)
        if risk_level:
            sql += " AND risk_level = ?"
            params.append(risk_level)
        if start_date:
            sql += " AND confirmation_date >= ?"
            params.append(start_date)
        if end_date:
            sql += " AND confirmation_date <= ?"
            params.append(end_date)
        sql += " ORDER BY last_updated DESC"
        return self.duckdb.query_df(sql, params)

    def get_missing_data_samples(self, data_source: Optional[str] = None) -> pl.DataFrame:
        dfs = []
        sources = [data_source] if data_source else list(DATA_SOURCE_LABELS.keys())
        table_map = {
            DataSource.DESIGN_EXPORT: "design_exports",
            DataSource.PAYMENT_RECORD: "payment_records",
            DataSource.PURCHASE_ORDER: "purchase_orders",
        }
        common_cols = [
            "id", "project_id", "project_name", "region", "is_missing",
            "missing_fields", "batch_id",
        ]
        for src in sources:
            table = table_map.get(src)
            if not table:
                continue
            try:
                df = self.duckdb.query_df(
                    f"SELECT *, '{src}' as data_source FROM {table} WHERE is_missing = true LIMIT 100"
                )
                if df.height > 0:
                    available = [c for c in common_cols if c in df.columns]
                    available.append("data_source")
                    dfs.append(df.select(available))
            except Exception:
                continue
        if not dfs:
            return pl.DataFrame(schema={
                "id": pl.Utf8, "project_id": pl.Utf8, "project_name": pl.Utf8,
                "region": pl.Utf8, "is_missing": pl.Boolean, "missing_fields": pl.Utf8,
                "batch_id": pl.Utf8, "data_source": pl.Utf8,
            })
        return pl.concat(dfs, how="diagonal")

    def get_design_exports(self, project_id: Optional[str] = None) -> pl.DataFrame:
        sql = "SELECT * FROM design_exports"
        params = []
        if project_id:
            sql += " WHERE project_id = ?"
            params.append(project_id)
        return self.duckdb.query_df(sql, params)

    def get_payment_records(self, project_id: Optional[str] = None) -> pl.DataFrame:
        sql = "SELECT * FROM payment_records"
        params = []
        if project_id:
            sql += " WHERE project_id = ?"
            params.append(project_id)
        return self.duckdb.query_df(sql, params)

    def get_purchase_orders(self, project_id: Optional[str] = None) -> pl.DataFrame:
        sql = "SELECT * FROM purchase_orders"
        params = []
        if project_id:
            sql += " WHERE project_id = ?"
            params.append(project_id)
        return self.duckdb.query_df(sql, params)

    def get_attachments(
        self,
        project_id: Optional[str] = None,
        category: Optional[str] = None,
    ) -> pl.DataFrame:
        sql = "SELECT * FROM attachments WHERE is_valid = true"
        params = []
        if project_id:
            sql += " AND project_id = ?"
            params.append(project_id)
        if category:
            sql += " AND category = ?"
            params.append(category)
        return self.duckdb.query_df(sql, params)

    def get_change_timeline(self, project_id: Optional[str] = None) -> pl.DataFrame:
        sql = "SELECT * FROM change_timeline"
        params = []
        if project_id:
            sql += " WHERE project_id = ?"
            params.append(project_id)
        sql += " ORDER BY changed_at DESC"
        return self.duckdb.query_df(sql, params)

    def get_auth_scope(self, user_id: str) -> Optional[Dict[str, Any]]:
        df = self.duckdb.query_df(
            "SELECT * FROM auth_scopes WHERE user_id = ? LIMIT 1",
            [user_id],
        )
        if df.height > 0:
            row = df.to_dicts()[0]
            if row.get("allowed_project_ids"):
                row["allowed_project_ids"] = row["allowed_project_ids"].split(",") if isinstance(row["allowed_project_ids"], str) else row["allowed_project_ids"]
            return row
        return None

    def refresh_project_confirmations(self):
        design_df = self.get_design_exports()
        payment_df = self.get_payment_records()
        purchase_df = self.get_purchase_orders()

        result_df = self.processor.calculate_overall_completeness(design_df, payment_df, purchase_df)
        if result_df.height == 0:
            return

        if "id" not in result_df.columns:
            result_df = result_df.with_columns(
                pl.Series([self._generate_id() for _ in range(result_df.height)]).alias("id")
            )
        result_df = result_df.with_columns(
            pl.lit(datetime.now()).alias("confirmation_date"),
            pl.lit(datetime.now()).alias("last_updated"),
        )

        self.duckdb.execute("DELETE FROM project_confirmations")
        self.duckdb.write_df("project_confirmations", result_df)

    def get_last_update_time(self, table_name: str) -> Optional[datetime]:
        return self.duckdb.get_last_update_time(table_name)
