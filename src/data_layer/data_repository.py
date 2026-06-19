import logging
from typing import Optional, List, Dict, Any, Tuple
from datetime import date, datetime
import polars as pl
from src.data_layer.duckdb_warehouse import DuckDBWarehouse
from src.data_layer.minio_client import MinioClient
from src.data_layer.polars_processor import PolarsProcessor
from src.utils.config import AppConfig

logger = logging.getLogger(__name__)

TABLE_PRIMARY_KEYS: Dict[str, List[str]] = {
    "ota_orders": ["order_id"],
    "door_lock_records": ["record_id"],
    "payment_transactions": ["transaction_id"],
    "package_inventory": ["package_id", "date"],
    "pricing_rules": ["rule_id"],
    "oversell_records": ["oversell_id"],
    "conversion_rate_versions": ["version_id"],
    "analysis_notes": ["note_id"],
}

CORE_TABLES: List[str] = [
    "ota_orders",
    "door_lock_records",
    "payment_transactions",
]


class DualWriteResult:
    def __init__(self, table_name: str, row_count: int):
        self.table_name = table_name
        self.row_count = row_count
        self.duckdb_ok: bool = True
        self.duckdb_error: Optional[str] = None
        self.minio_ok: Optional[bool] = None
        self.minio_error: Optional[str] = None
        self.minio_object_name: Optional[str] = None

    @property
    def duckdb_only(self) -> bool:
        return self.duckdb_ok and (self.minio_ok is False or self.minio_ok is None)

    def summary(self) -> str:
        parts = [f"[{self.table_name}] {self.row_count}行"]
        if self.duckdb_ok:
            parts.append("DuckDB:OK")
        else:
            parts.append(f"DuckDB:FAIL({self.duckdb_error})")
        if self.minio_ok is True:
            parts.append(f"MinIO:OK({self.minio_object_name})")
        elif self.minio_ok is False:
            parts.append(f"MinIO:FAIL({self.minio_error})")
        else:
            parts.append("MinIO:SKIP")
        return " | ".join(parts)

    def __repr__(self) -> str:
        return self.summary()


class DataRepository:
    def __init__(self, config: AppConfig, use_minio: bool = False):
        self.config = config
        self.warehouse = DuckDBWarehouse(config.duckdb)
        self.use_minio = use_minio and config.minio.enabled
        self.minio_init_error: Optional[str] = None
        if self.use_minio:
            try:
                self.minio = MinioClient(config.minio)
                logger.info(f"MinIO 已连接: endpoint={config.minio.endpoint}, bucket={config.minio.bucket}")
            except Exception as e:
                self.use_minio = False
                self.minio_init_error = str(e)
                logger.error(f"MinIO 连接失败，已降级为仅 DuckDB: {e}")
        elif use_minio and not config.minio.enabled:
            self.minio_init_error = "MinIO 已在配置中禁用 (MINIO_ENABLED=false)"
            logger.warning(f"MinIO 配置已禁用，所有写入将仅保留在 DuckDB。")
        self.processor = PolarsProcessor()

    def _dual_write(self, table_name: str, df: pl.DataFrame, pk_cols: Optional[List[str]] = None) -> DualWriteResult:
        result = DualWriteResult(table_name, len(df))

        try:
            self.warehouse.insert_dataframe(table_name, df)
        except Exception as e:
            result.duckdb_ok = False
            result.duckdb_error = str(e)
            logger.error(f"DuckDB 写入失败 [{table_name}]: {e}")
            raise

        if not self.use_minio:
            if table_name in CORE_TABLES:
                error_msg = (
                    f"核心交易表 [{table_name}] 必须双写 MinIO，"
                    f"但 MinIO 当前不可用: {self.minio_init_error or '未初始化'}. "
                    f"DuckDB 已写入 ({len(df)} 行)，但 MinIO 对象缺失。"
                )
                result.minio_ok = False
                result.minio_error = error_msg
                logger.error(error_msg)
                raise RuntimeError(error_msg)
            return result

        try:
            ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            object_name = f"{table_name}/{table_name}_{ts}.parquet"
            self.minio.upload_dataframe(df, object_name, format="parquet")
            result.minio_ok = True
            result.minio_object_name = object_name
            logger.info(f"MinIO 写入成功 [{table_name}]: {object_name} ({len(df)} 行)")
        except Exception as e:
            result.minio_ok = False
            result.minio_error = str(e)
            logger.error(
                f"MinIO 写入失败 [{table_name}]: {e} "
                f"—— 数据已保留在 DuckDB，可稍后通过 sync_to_minio 补发"
            )
            raise RuntimeError(
                f"MinIO 写入失败 [{table_name}]: {e}. "
                f"DuckDB 已完成写入 ({len(df)} 行)，但对象未保存。"
            ) from e

        return result

    def _dual_upsert(self, table_name: str, df: pl.DataFrame, conflict_columns: List[str]) -> DualWriteResult:
        result = DualWriteResult(table_name, len(df))

        try:
            self.warehouse.upsert_dataframe(table_name, df, conflict_columns)
        except Exception as e:
            result.duckdb_ok = False
            result.duckdb_error = str(e)
            logger.error(f"DuckDB upsert 失败 [{table_name}]: {e}")
            raise

        if not self.use_minio:
            if table_name in CORE_TABLES:
                error_msg = (
                    f"核心交易表 [{table_name}] 必须双写 MinIO，"
                    f"但 MinIO 当前不可用: {self.minio_init_error or '未初始化'}. "
                    f"DuckDB 已 upsert ({len(df)} 行)，但 MinIO 对象缺失。"
                )
                result.minio_ok = False
                result.minio_error = error_msg
                logger.error(error_msg)
                raise RuntimeError(error_msg)
            return result

        try:
            ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            object_name = f"{table_name}/{table_name}_{ts}.parquet"
            self.minio.upload_dataframe(df, object_name, format="parquet")
            result.minio_ok = True
            result.minio_object_name = object_name
            logger.info(f"MinIO 写入成功 [{table_name} upsert]: {object_name} ({len(df)} 行)")
        except Exception as e:
            result.minio_ok = False
            result.minio_error = str(e)
            logger.error(
                f"MinIO 写入失败 [{table_name} upsert]: {e} "
                f"—— 数据已保留在 DuckDB，可稍后通过 sync_to_minio 补发"
            )
            raise RuntimeError(
                f"MinIO 写入失败 [{table_name} upsert]: {e}. "
                f"DuckDB 已完成 upsert ({len(df)} 行)，但对象未保存。"
            ) from e

        return result

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

    def save_ota_orders_batch(self, df: pl.DataFrame) -> DualWriteResult:
        return self._dual_write("ota_orders", df)

    def save_door_lock_records_batch(self, df: pl.DataFrame) -> DualWriteResult:
        return self._dual_write("door_lock_records", df)

    def save_payment_transactions_batch(self, df: pl.DataFrame) -> DualWriteResult:
        return self._dual_write("payment_transactions", df)

    def save_package_inventory_batch(self, df: pl.DataFrame) -> DualWriteResult:
        return self._dual_upsert("package_inventory", df, ["package_id", "date"])

    def save_pricing_rules_batch(self, df: pl.DataFrame) -> DualWriteResult:
        return self._dual_write("pricing_rules", df)

    def save_analysis_notes_batch(self, df: pl.DataFrame) -> DualWriteResult:
        return self._dual_write("analysis_notes", df)

    def save_oversell_records_batch(self, df: pl.DataFrame) -> DualWriteResult:
        return self._dual_write("oversell_records", df)

    def save_conversion_rate_versions_batch(self, df: pl.DataFrame) -> DualWriteResult:
        return self._dual_write("conversion_rate_versions", df)

    def sync_from_minio(
        self,
        table_names: Optional[List[str]] = None,
        object_prefix: Optional[str] = None,
    ) -> Dict[str, Dict[str, Any]]:
        if not self.use_minio:
            raise RuntimeError(
                "MinIO 客户端未初始化。" +
                (f" 初始化错误: {self.minio_init_error}" if self.minio_init_error else "")
            )

        if table_names is None:
            table_names = list(TABLE_PRIMARY_KEYS.keys())

        sync_results: Dict[str, Dict[str, Any]] = {}

        for table_name in table_names:
            prefix = object_prefix or f"{table_name}/"
            primary_keys = TABLE_PRIMARY_KEYS.get(table_name)
            if primary_keys is None:
                logger.warning(f"sync_from_minio: 未知表 {table_name}，跳过")
                continue

            is_core = table_name in CORE_TABLES
            if is_core:
                logger.info(
                    f"sync_from_minio 核心交易表 [{table_name}]: "
                    f"目录前缀={prefix}, 使用主键={primary_keys} 做 upsert"
                )

            objects = self.minio.list_objects(prefix=prefix, recursive=True)
            target_objects = [
                obj for obj in objects
                if obj.startswith(prefix) and (obj.endswith(".parquet") or obj.endswith(".csv"))
            ]

            table_rows = 0
            table_objs_ok = 0
            table_objs_fail = 0
            errors: List[str] = []

            for obj_name in sorted(target_objects):
                try:
                    if obj_name.endswith(".parquet"):
                        df = self.minio.download_dataframe(obj_name, format="parquet")
                    else:
                        df = self.minio.download_dataframe(obj_name, format="csv")

                    if df.is_empty():
                        continue

                    self.warehouse.upsert_dataframe(table_name, df, primary_keys)
                    table_rows += len(df)
                    table_objs_ok += 1
                    logger.info(
                        f"sync_from_minio [{table_name}]: "
                        f"已同步 {obj_name} ({len(df)} 行), 主键={primary_keys}"
                    )
                except Exception as e:
                    table_objs_fail += 1
                    error_msg = f"对象 {obj_name} 同步失败: {e}"
                    errors.append(error_msg)
                    logger.error(f"sync_from_minio [{table_name}]: {error_msg}")

            sync_results[table_name] = {
                "objects_total": len(target_objects),
                "objects_ok": table_objs_ok,
                "objects_fail": table_objs_fail,
                "rows_synced": table_rows,
                "primary_keys": primary_keys,
                "primary_keys_used": primary_keys,
                "is_core_table": is_core,
                "errors": errors,
            }

        summary_parts = [
            f"sync_from_minio 完成: {len(sync_results)} 张表",
        ]
        for t, info in sync_results.items():
            tag = " [核心]" if info["is_core_table"] else ""
            summary_parts.append(
                f"  {t}{tag}: {info['rows_synced']} 行, 主键={info['primary_keys']}"
            )
        logger.info("\n".join(summary_parts))

        return sync_results

    def sync_to_minio(
        self,
        table_names: Optional[List[str]] = None,
        format: str = "parquet",
    ) -> Dict[str, Dict[str, Any]]:
        if not self.use_minio:
            raise RuntimeError(
                "MinIO 客户端未初始化。" +
                (f" 初始化错误: {self.minio_init_error}" if self.minio_init_error else "")
            )

        if table_names is None:
            table_names = list(TABLE_PRIMARY_KEYS.keys())

        sync_results: Dict[str, Dict[str, Any]] = {}
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")

        for table_name in table_names:
            try:
                df = self.warehouse.execute_query(f"SELECT * FROM {table_name}")
                object_name = f"{table_name}/{table_name}_full_sync_{ts}.{format}"
                self.minio.upload_dataframe(df, object_name, format=format)
                sync_results[table_name] = {
                    "success": True,
                    "rows": len(df),
                    "object_name": object_name,
                }
                logger.info(
                    f"sync_to_minio [{table_name}]: {object_name} ({len(df)} 行)"
                )
            except Exception as e:
                sync_results[table_name] = {
                    "success": False,
                    "error": str(e),
                }
                logger.error(f"sync_to_minio [{table_name}] 失败: {e}")

        return sync_results

    def list_minio_objects(
        self,
        table_name: Optional[str] = None,
        prefix: Optional[str] = None,
    ) -> List[str]:
        if not self.use_minio:
            raise RuntimeError(
                "MinIO 客户端未初始化。" +
                (f" 初始化错误: {self.minio_init_error}" if self.minio_init_error else "")
            )
        search_prefix = prefix or (f"{table_name}/" if table_name else "")
        return self.minio.list_objects(prefix=search_prefix, recursive=True)

    def close(self) -> None:
        self.warehouse.close()
