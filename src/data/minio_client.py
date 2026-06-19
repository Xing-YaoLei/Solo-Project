import io
import json
from typing import Optional, Any
import polars as pl

from src.config.settings import settings


class MinIOClient:
    def __init__(self):
        self._client = None
        self._bucket_exists = False
        self._init_client()

    def _init_client(self):
        try:
            from minio import Minio
            from minio.error import S3Error

            self._client = Minio(
                settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=settings.MINIO_SECURE,
            )
            self._bucket_exists = self._client.bucket_exists(settings.MINIO_BUCKET)
            if not self._bucket_exists:
                self._client.make_bucket(settings.MINIO_BUCKET)
                self._bucket_exists = True
        except Exception as e:
            print(f"MinIO 连接失败，使用本地存储模式: {e}")
            self._client = None
            self._bucket_exists = False

    @property
    def is_connected(self) -> bool:
        return self._client is not None and self._bucket_exists

    def put_dataframe(self, object_name: str, df: pl.DataFrame, file_format: str = "parquet") -> bool:
        if not self.is_connected:
            return self._save_local(object_name, df, file_format)

        try:
            if file_format == "parquet":
                buffer = io.BytesIO()
                df.write_parquet(buffer)
                buffer.seek(0)
                self._client.put_object(
                    settings.MINIO_BUCKET,
                    object_name,
                    buffer,
                    length=buffer.getbuffer().nbytes,
                    content_type="application/octet-stream",
                )
            elif file_format == "json":
                data = json.dumps(df.to_dicts(), ensure_ascii=False).encode("utf-8")
                buffer = io.BytesIO(data)
                self._client.put_object(
                    settings.MINIO_BUCKET,
                    object_name,
                    buffer,
                    length=len(data),
                    content_type="application/json",
                )
            elif file_format == "csv":
                buffer = io.BytesIO()
                df.write_csv(buffer)
                buffer.seek(0)
                self._client.put_object(
                    settings.MINIO_BUCKET,
                    object_name,
                    buffer,
                    length=buffer.getbuffer().nbytes,
                    content_type="text/csv",
                )
            return True
        except Exception as e:
            print(f"MinIO 上传失败: {e}")
            return self._save_local(object_name, df, file_format)

    def get_dataframe(self, object_name: str, file_format: str = "parquet") -> Optional[pl.DataFrame]:
        if not self.is_connected:
            return self._load_local(object_name, file_format)

        try:
            response = self._client.get_object(settings.MINIO_BUCKET, object_name)
            data = response.read()
            buffer = io.BytesIO(data)

            if file_format == "parquet":
                return pl.read_parquet(buffer)
            elif file_format == "json":
                return pl.read_json(buffer)
            elif file_format == "csv":
                return pl.read_csv(buffer)
        except Exception as e:
            print(f"MinIO 下载失败: {e}")
            return self._load_local(object_name, file_format)
        return None

    def _save_local(self, object_name: str, df: pl.DataFrame, file_format: str) -> bool:
        import os
        os.makedirs(settings.DATA_DIR, exist_ok=True)
        filepath = os.path.join(settings.DATA_DIR, object_name)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        try:
            if file_format == "parquet":
                df.write_parquet(filepath)
            elif file_format == "json":
                df.write_json(filepath)
            elif file_format == "csv":
                df.write_csv(filepath)
            return True
        except Exception as e:
            print(f"本地保存失败: {e}")
            return False

    def _load_local(self, object_name: str, file_format: str) -> Optional[pl.DataFrame]:
        import os
        filepath = os.path.join(settings.DATA_DIR, object_name)

        if not os.path.exists(filepath):
            return None

        try:
            if file_format == "parquet":
                return pl.read_parquet(filepath)
            elif file_format == "json":
                return pl.read_json(filepath)
            elif file_format == "csv":
                return pl.read_csv(filepath)
        except Exception as e:
            print(f"本地读取失败: {e}")
        return None

    def list_objects(self, prefix: str = "") -> list:
        if not self.is_connected:
            import os
            if not os.path.exists(settings.DATA_DIR):
                return []
            return [
                os.path.relpath(os.path.join(root, f), settings.DATA_DIR)
                for root, _, files in os.walk(settings.DATA_DIR)
                for f in files
                if f.startswith(prefix) or prefix == ""
            ]

        try:
            return [
                obj.object_name
                for obj in self._client.list_objects(settings.MINIO_BUCKET, prefix=prefix, recursive=True)
            ]
        except Exception as e:
            print(f"MinIO 列表获取失败: {e}")
            return []


minio_client = MinIOClient()
