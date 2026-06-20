import polars as pl
import io
import json
from datetime import date
from typing import Dict, Any, Optional
import hashlib

from src.data.minio_client import MinIOClient
from src.data.repository import DataRepository
from src.config import Config


class ExportManager:
    def __init__(self):
        self.minio = MinIOClient()
        self.repo = DataRepository()

    def generate_filter_hash(self, filters: dict) -> str:
        return self.repo.generate_filter_hash(filters)

    def export_to_csv(self, df: pl.DataFrame, filters: dict, report_name: str) -> bytes:
        buffer = io.BytesIO()

        header_info = self._build_header_info(filters, report_name)
        buffer.write(header_info.encode("utf-8"))
        buffer.write(b"\n")

        csv_content = df.write_csv()
        buffer.write(csv_content.encode("utf-8"))

        return buffer.getvalue()

    def export_to_parquet(self, df: pl.DataFrame, filters: dict, report_name: str) -> bytes:
        buffer = io.BytesIO()

        filter_metadata = {
            "report_name": report_name,
            "filters": filters,
            "filter_hash": self.generate_filter_hash(filters),
            "export_time": date.today().isoformat()
        }

        df = df.with_columns([
            pl.lit(filter_metadata["filter_hash"]).alias("_filter_hash"),
            pl.lit(filter_metadata["export_time"]).alias("_export_time")
        ])

        df.write_parquet(buffer)
        return buffer.getvalue()

    def save_export_to_minio(self, df: pl.DataFrame, filters: dict, report_name: str,
                             format: str = "parquet") -> str:
        filter_hash = self.generate_filter_hash(filters)
        object_name = f"exports/{report_name}/{filter_hash}_{date.today().isoformat()}.{format}"

        if format == "csv":
            content = self.export_to_csv(df, filters, report_name)
            content_type = "text/csv"
        else:
            content = self.export_to_parquet(df, filters, report_name)
            content_type = "application/parquet"

        import io as _io
        buffer = _io.BytesIO(content)

        self.minio.client.put_object(
            self.minio.bucket, object_name, buffer,
            length=len(content),
            content_type=content_type
        )

        meta_object = f"exports/{report_name}/{filter_hash}_meta.json"
        self.minio.put_json(meta_object, {
            "report_name": report_name,
            "filters": filters,
            "filter_hash": filter_hash,
            "data_file": object_name,
            "record_count": len(df),
            "export_time": date.today().isoformat()
        })

        return object_name

    def load_export_from_minio(self, filter_hash: str, report_name: str) -> Optional[dict]:
        meta_object = f"exports/{report_name}/{filter_hash}_meta.json"
        meta = self.minio.get_json(meta_object)

        if not meta:
            return None

        data_file = meta["data_file"]
        df = self.minio.download_dataframe(data_file, format="parquet")

        return {
            "metadata": meta,
            "dataframe": df
        }

    def _build_header_info(self, filters: dict, report_name: str) -> str:
        lines = [
            f"# 报表名称: {report_name}",
            f"# 筛选条件: {json.dumps(filters, ensure_ascii=False)}",
            f"# 筛选哈希: {self.generate_filter_hash(filters)}",
            f"# 导出时间: {date.today().isoformat()}",
            f"# --- 数据开始 ---"
        ]
        return "\n".join(lines)

    def get_export_list(self, report_name: str = None) -> list:
        prefix = "exports/"
        if report_name:
            prefix += f"{report_name}/"

        objects = self.minio.list_objects(prefix)
        meta_files = [o for o in objects if o.endswith("_meta.json")]

        results = []
        for meta_file in meta_files:
            meta = self.minio.get_json(meta_file)
            if meta:
                results.append(meta)

        return sorted(results, key=lambda x: x.get("export_time", ""), reverse=True)

    def build_shareable_filter_string(self, filters: dict) -> str:
        filter_json = json.dumps(filters, sort_keys=True, ensure_ascii=False)
        import base64
        encoded = base64.urlsafe_b64encode(filter_json.encode("utf-8")).decode("utf-8").rstrip("=")
        return f"filter={encoded}"

    def parse_shareable_filter_string(self, filter_str: str) -> Optional[dict]:
        try:
            import base64
            padded = filter_str + "=" * (-len(filter_str) % 4)
            decoded = base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8")
            return json.loads(decoded)
        except Exception:
            return None
