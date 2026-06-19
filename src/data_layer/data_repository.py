from typing import Optional, List, Dict, Any
from datetime import date, datetime
import polars as pl
from src.data_layer.duckdb_warehouse import DuckDBWarehouse
from src.data_layer.minio_client import MinioClient
from src.data_layer.polars_processor import PolarsProcessor
from src.utils.config import AppConfig


class DataRepository:
    def __init__(self, config: AppConfig, use_minio: bool = False):
        self.config = config
        self.warehouse = DuckDBWarehouse(config.duckdb)
        self.use_minio = use_minio
        if use_minio:
            try:
                self.minio = MinioClient(config.minio)
            except Exception:
                self.use_minio = False
        self.processor = PolarsProcessor()

    def _dual_write(self, table_name: str, df: pl.DataFrame, pk_cols: Optional[List[str]] = None) -> None:
        self.warehouse.insert_dataframe(table_name, df)
        if self.use_minio:
            try:
                ts = datetime.now().strftime("%Y%m%d_%H%M%S")
                object_name = f"{table_name}/{table_name}_{ts}.parquet"
                self.minio.upload_dataframe(df, object_name, format="parquet")
            except Exception:
                pass

    def _dual_upsert(self, table_name: str, df: pl.DataFrame, conflict_columns: List[str]) -> None:
        self.warehouse.upsert_dataframe(table_name, df, conflict_columns)
        if self.use_minio:
            try:
                ts = datetime.now().strftime("%Y%m%d_%H%M%S")
                object_name = f"{table_name}/{table_name}_{ts}.parquet"
                self.minio.upload_dataframe(df, object_name, format="parquet")
            except Exception:
                pass

    def get_ota_orders(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        package_id: Optional[str] = None,
        channel: Optional[str] = None,
        order_status: Optional[List[str]] = None,
    ) -> pl.DataFrame:
        query = "SELECT * FROM ota_orders WHERE 1=1"
        params: Dict[str, Any] = {}

        if start_date:
            query += " AND order_date >= $start_date"
            params["start_date"] = start_date
        if end_date:
            query += " AND order_date <= $end_date"
            params["end_date"] = end_date
        if package_id:
            query += " AND package_id = $package_id"
            params["package_id"] = package_id
        if channel:
            query += " AND channel = $channel"
            params["channel"] = channel
        if order_status:
            status_params = []
            for i, s in enumerate(order_status):
                param_key = f"order_status_{i}"
                status_params.append(f"${param_key}")
                params[param_key] = s
            query += f" AND order_status IN ({', '.join(status_params)})"

        query += " ORDER BY order_date DESC"
        return self.warehouse.execute_query(query, params)

    def get_door_lock_records(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        order_id: Optional[str] = None,
        room_id: Optional[str] = None,
    ) -> pl.DataFrame:
        query = "SELECT * FROM door_lock_records WHERE 1=1"
        params: Dict[str, Any] = {}

        if start_date:
            query += " AND checkin_time >= $start_date"
            params["start_date"] = start_date
        if end_date:
            query += " AND checkout_time <= $end_date"
            params["end_date"] = end_date
        if order_id:
            query += " AND order_id = $order_id"
            params["order_id"] = order_id
        if room_id:
            query += " AND room_id = $room_id"
            params["room_id"] = room_id

        query += " ORDER BY checkin_time DESC"
        return self.warehouse.execute_query(query, params)

    def get_payment_transactions(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        order_id: Optional[str] = None,
        transaction_status: Optional[List[str]] = None,
    ) -> pl.DataFrame:
        query = "SELECT * FROM payment_transactions WHERE 1=1"
        params: Dict[str, Any] = {}

        if start_date:
            query += " AND transaction_date >= $start_date"
            params["start_date"] = start_date
        if end_date:
            query += " AND transaction_date <= $end_date"
            params["end_date"] = end_date
        if order_id:
            query += " AND order_id = $order_id"
            params["order_id"] = order_id
        if transaction_status:
            status_params = []
            for i, s in enumerate(transaction_status):
                param_key = f"trans_status_{i}"
                status_params.append(f"${param_key}")
                params[param_key] = s
            query += f" AND transaction_status IN ({', '.join(status_params)})"

        query += " ORDER BY transaction_date DESC"
        return self.warehouse.execute_query(query, params)

    def get_package_inventory(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        package_id: Optional[str] = None,
    ) -> pl.DataFrame:
        query = "SELECT * FROM package_inventory WHERE 1=1"
        params: Dict[str, Any] = {}

        if start_date:
            query += " AND date >= $start_date"
            params["start_date"] = start_date
        if end_date:
            query += " AND date <= $end_date"
            params["end_date"] = end_date
        if package_id:
            query += " AND package_id = $package_id"
            params["package_id"] = package_id

        query += " ORDER BY date DESC"
        return self.warehouse.execute_query(query, params)

    def get_pricing_rules(
        self,
        package_id: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> pl.DataFrame:
        query = "SELECT * FROM pricing_rules WHERE 1=1"
        params: Dict[str, Any] = {}

        if package_id:
            query += " AND package_id = $package_id"
            params["package_id"] = package_id
        if is_active is not None:
            query += " AND is_active = $is_active"
            params["is_active"] = is_active

        query += " ORDER BY created_at DESC"
        return self.warehouse.execute_query(query, params)

    def get_oversell_records(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        status: Optional[List[str]] = None,
        package_id: Optional[str] = None,
    ) -> pl.DataFrame:
        query = "SELECT * FROM oversell_records WHERE 1=1"
        params: Dict[str, Any] = {}

        if start_date:
            query += " AND oversell_date >= $start_date"
            params["start_date"] = start_date
        if end_date:
            query += " AND oversell_date <= $end_date"
            params["end_date"] = end_date
        if status:
            status_params = []
            for i, s in enumerate(status):
                param_key = f"status_{i}"
                status_params.append(f"${param_key}")
                params[param_key] = s
            query += f" AND status IN ({', '.join(status_params)})"
        if package_id:
            query += " AND package_id = $package_id"
            params["package_id"] = package_id

        query += " ORDER BY detected_at DESC"
        return self.warehouse.execute_query(query, params)

    def get_conversion_rate_versions(
        self,
        is_active: Optional[bool] = None,
        version_code: Optional[str] = None,
    ) -> pl.DataFrame:
        query = "SELECT * FROM conversion_rate_versions WHERE 1=1"
        params: Dict[str, Any] = {}

        if is_active is not None:
            query += " AND is_active = $is_active"
            params["is_active"] = is_active
        if version_code:
            query += " AND version_code = $version_code"
            params["version_code"] = version_code

        query += " ORDER BY created_at DESC"
        return self.warehouse.execute_query(query, params)

    def get_analysis_notes(
        self,
        record_type: Optional[str] = None,
        record_id: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> pl.DataFrame:
        query = "SELECT * FROM analysis_notes WHERE 1=1"
        params: Dict[str, Any] = {}

        if record_type:
            query += " AND record_type = $record_type"
            params["record_type"] = record_type
        if record_id:
            query += " AND record_id = $record_id"
            params["record_id"] = record_id
        if start_date:
            query += " AND analysis_date >= $start_date"
            params["start_date"] = start_date
        if end_date:
            query += " AND analysis_date <= $end_date"
            params["end_date"] = end_date

        query += " ORDER BY created_at DESC"
        return self.warehouse.execute_query(query, params)

    def save_oversell_record(self, data: Dict[str, Any]) -> str:
        import random
        import string
        random_suffix = ''.join(random.choices(string.digits, k=6))
        oversell_id = f"OS{datetime.now().strftime('%Y%m%d%H%M%S')}{random_suffix}"
        data["oversell_id"] = oversell_id
        df = pl.DataFrame([data])
        self._dual_write("oversell_records", df)
        return oversell_id

    def update_oversell_status(
        self,
        oversell_id: str,
        status: str,
        handler: Optional[str] = None,
        handling_result: Optional[str] = None,
        remark: Optional[str] = None,
    ) -> None:
        query = """
            UPDATE oversell_records
            SET status = $status,
                handler = COALESCE($handler, handler),
                handling_result = COALESCE($handling_result, handling_result),
                remark = COALESCE($remark, remark),
                handled_at = CASE WHEN $status IN ('resolved', 'cancelled')
                                  THEN CURRENT_TIMESTAMP ELSE handled_at END
            WHERE oversell_id = $oversell_id
        """
        params = {
            "status": status,
            "handler": handler,
            "handling_result": handling_result,
            "remark": remark,
            "oversell_id": oversell_id,
        }
        self.warehouse.execute_update(query, params)

    def save_analysis_note(self, data: Dict[str, Any]) -> str:
        import random
        import string
        random_suffix = ''.join(random.choices(string.digits, k=6))
        note_id = f"AN{datetime.now().strftime('%Y%m%d%H%M%S')}{random_suffix}"
        data["note_id"] = note_id
        df = pl.DataFrame([data])
        self._dual_write("analysis_notes", df)
        return note_id

    def save_conversion_rate_version(self, data: Dict[str, Any]) -> str:
        import random
        import string
        random_suffix = ''.join(random.choices(string.digits, k=6))
        version_id = f"CV{datetime.now().strftime('%Y%m%d%H%M%S')}{random_suffix}"
        data["version_id"] = version_id
        df = pl.DataFrame([data])
        self._dual_write("conversion_rate_versions", df)
        return version_id

    def save_ota_orders_batch(self, df: pl.DataFrame) -> None:
        self._dual_write("ota_orders", df)

    def save_door_lock_records_batch(self, df: pl.DataFrame) -> None:
        self._dual_write("door_lock_records", df)

    def save_payment_transactions_batch(self, df: pl.DataFrame) -> None:
        self._dual_write("payment_transactions", df)

    def save_package_inventory_batch(self, df: pl.DataFrame) -> None:
        self._dual_upsert("package_inventory", df, ["package_id", "date"])

    def save_pricing_rules_batch(self, df: pl.DataFrame) -> None:
        self._dual_write("pricing_rules", df)

    def save_analysis_notes_batch(self, df: pl.DataFrame) -> None:
        self._dual_write("analysis_notes", df)

    def save_conversion_rate_versions_batch(self, df: pl.DataFrame) -> None:
        self._dual_write("conversion_rate_versions", df)

    def sync_from_minio(self, object_prefix: str) -> None:
        if not self.use_minio:
            raise RuntimeError("MinIO client not initialized")

        objects = self.minio.list_objects(prefix=object_prefix)
        for obj_name in objects:
            if obj_name.endswith(".csv"):
                df = self.minio.download_dataframe(obj_name)
                table_name = obj_name.split("/")[-1].replace(".csv", "")
                self.warehouse.upsert_dataframe(table_name, df, ["order_id"])

    def sync_to_minio(self, table_name: str, object_name: str) -> None:
        if not self.use_minio:
            raise RuntimeError("MinIO client not initialized")

        df = self.warehouse.execute_query(f"SELECT * FROM {table_name}")
        self.minio.upload_dataframe(df, object_name)

    def close(self) -> None:
        self.warehouse.close()
