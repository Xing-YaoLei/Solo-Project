"""
数据摄入管道：原始数据 → MinIO 存储 → 清洗/去重/口径匹配 → DuckDB 入库
"""
import io
import logging
from datetime import datetime
from typing import Optional, Dict, Any, Tuple

import polars as pl

from src.data.duckdb_manager import duckdb_manager
from src.data.minio_client import minio_client
from src.utils.data_cleaner import DataCleaner

logger = logging.getLogger(__name__)


TABLE_CLEAN_MAP = {
    "reviews": DataCleaner.clean_reviews,
    "inventory": DataCleaner.clean_inventory,
    "cashier_transactions": DataCleaner.clean_cashier_transactions,
    "course_items": DataCleaner.clean_course_items,
    "material_usage": DataCleaner.clean_material_usage,
}

TABLE_LABELS = {
    "reviews": "点评记录",
    "inventory": "库存表",
    "cashier_transactions": "收银流水",
    "course_items": "项目卡项",
    "material_usage": "耗材使用",
}

POST_INGEST_HOOKS = {
    "reviews": "_after_reviews_ingest",
    "material_usage": "_after_material_usage_ingest",
}


class DataIngestionPipeline:
    """数据摄入管道：MinIO 存储 + 清洗入库"""

    def ingest(
        self,
        raw_bytes: bytes,
        file_name: str,
        table_name: str,
        skip_minio: bool = False,
    ) -> Dict[str, Any]:
        """完整摄入流程：原始文件 → MinIO → 清洗 → DuckDB

        Args:
            raw_bytes: 原始文件字节
            file_name: 文件名（用于判断格式和 MinIO 路径）
            table_name: 目标表名
            skip_minio: 是否跳过 MinIO 存储（MinIO 不可用时降级）

        Returns:
            包含统计信息的字典
        """
        result: Dict[str, Any] = {
            "table": table_name,
            "file_name": file_name,
            "minio_stored": False,
            "raw_rows": 0,
            "cleaned_rows": 0,
            "removed_duplicates": 0,
            "inserted_rows": 0,
            "errors": [],
        }

        # Step 1: 存 MinIO
        if not skip_minio:
            try:
                object_name = self._build_minio_path(table_name, file_name)
                minio_client.upload_bytes(
                    object_name=object_name,
                    data=raw_bytes,
                    content_type=self._guess_content_type(file_name),
                )
                result["minio_stored"] = True
                result["minio_object"] = object_name
                logger.info("原始文件已存入 MinIO: %s", object_name)
            except Exception as e:
                logger.warning("MinIO 存储失败，继续后续流程: %s", e)
                result["errors"].append(f"MinIO存储失败: {e}")

        # Step 2: 加载为 DataFrame
        try:
            raw_df = DataCleaner.load_dataframe(raw_bytes, file_name)
            result["raw_rows"] = raw_df.height
        except Exception as e:
            result["errors"].append(f"文件加载失败: {e}")
            logger.error("文件加载失败: %s", e)
            return result

        # Step 3: 清洗 / 去重 / 口径匹配
        clean_fn = TABLE_CLEAN_MAP.get(table_name)
        if clean_fn is None:
            result["errors"].append(f"不支持的表类型: {table_name}")
            return result

        try:
            cleaned_df, stats = clean_fn(raw_df)
            result["cleaned_rows"] = stats.get("cleaned_rows", cleaned_df.height)
            result["removed_duplicates"] = stats.get("removed_duplicates", 0)
        except Exception as e:
            result["errors"].append(f"数据清洗失败: {e}")
            logger.error("数据清洗失败: %s", e)
            return result

        # Step 4: 对齐表结构（补齐默认列）
        try:
            cleaned_df = duckdb_manager.align_dataframe_to_table(table_name, cleaned_df)
        except Exception as e:
            logger.warning("表结构对齐失败: %s", e)
            result["errors"].append(f"表结构对齐失败: {e}")

        # Step 5: 写入 DuckDB
        try:
            inserted = duckdb_manager.insert_dataframe(
                table_name, cleaned_df, if_exists="upsert"
            )
            result["inserted_rows"] = inserted
        except Exception as e:
            result["errors"].append(f"DuckDB写入失败: {e}")
            logger.error("DuckDB写入失败: %s", e)
            return result

        # Step 6: 后置钩子
        hook_name = POST_INGEST_HOOKS.get(table_name)
        if hook_name:
            try:
                getattr(self, hook_name)()
            except Exception as e:
                logger.warning("后置钩子 %s 执行失败: %s", hook_name, e)

        logger.info(
            "摄入完成: %s → %s, %d→%d行, 入库%d行",
            file_name, table_name,
            result["raw_rows"], result["cleaned_rows"], result["inserted_rows"],
        )
        return result

    def ingest_from_minio(
        self,
        object_name: str,
        table_name: str,
    ) -> Dict[str, Any]:
        """从 MinIO 已有对象摄入数据

        Args:
            object_name: MinIO 中的对象路径
            table_name: 目标表名

        Returns:
            包含统计信息的字典
        """
        raw_bytes = minio_client.download_bytes(object_name)
        file_name = object_name.rsplit("/", 1)[-1]
        return self.ingest(raw_bytes, file_name, table_name, skip_minio=True)

    def _after_reviews_ingest(self) -> None:
        """点评记录入库后：标注延迟"""
        try:
            from src.modules.risk_engine import RiskEngine
            engine = RiskEngine()
            engine.mark_review_delays()
            logger.info("点评延迟标注完成")
        except Exception as e:
            logger.warning("点评延迟标注失败: %s", e)

    def _after_material_usage_ingest(self) -> None:
        """耗材使用入库后：检测异常"""
        try:
            from src.modules.risk_engine import RiskEngine
            engine = RiskEngine()
            engine.detect_material_abnormalities()
            logger.info("耗材异常检测完成")
        except Exception as e:
            logger.warning("耗材异常检测失败: %s", e)

    @staticmethod
    def _build_minio_path(table_name: str, file_name: str) -> str:
        """构建 MinIO 对象存储路径: raw/{table_name}/{date}/{file_name}"""
        date_prefix = datetime.now().strftime("%Y%m%d")
        return f"raw/{table_name}/{date_prefix}/{file_name}"

    @staticmethod
    def _guess_content_type(file_name: str) -> str:
        ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
        mapping = {
            "csv": "text/csv",
            "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "xls": "application/vnd.ms-excel",
            "parquet": "application/octet-stream",
            "json": "application/json",
        }
        return mapping.get(ext, "application/octet-stream")

    def list_minio_sources(self, table_name: Optional[str] = None) -> Dict[str, list]:
        """列出 MinIO 中可用的原始数据源"""
        prefix = f"raw/{table_name}/" if table_name else "raw/"
        try:
            objects = minio_client.list_objects(prefix=prefix)
            grouped: Dict[str, list] = {}
            for obj_name in objects:
                parts = obj_name.split("/")
                if len(parts) >= 3:
                    tbl = parts[1]
                    if tbl not in grouped:
                        grouped[tbl] = []
                    grouped[tbl].append(obj_name)
            return grouped
        except Exception as e:
            logger.warning("列出 MinIO 数据源失败: %s", e)
            return {}


ingestion_pipeline = DataIngestionPipeline()
