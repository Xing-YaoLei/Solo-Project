from __future__ import annotations

import io
from typing import Optional

import polars as pl
from minio import Minio
from minio.error import S3Error

from src.config import minio_config


class MinIOClient:
    _instance: Optional["MinIOClient"] = None

    def __new__(cls) -> "MinIOClient":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._client = Minio(
                endpoint=minio_config.endpoint,
                access_key=minio_config.access_key,
                secret_key=minio_config.secret_key,
                secure=minio_config.secure,
            )
        return cls._instance

    @property
    def client(self) -> Minio:
        return self._client

    def ensure_bucket(self) -> None:
        if not self._client.bucket_exists(minio_config.bucket):
            self._client.make_bucket(minio_config.bucket)

    def put_parquet(self, object_name: str, df: pl.DataFrame) -> None:
        self.ensure_bucket()
        buf = io.BytesIO()
        df.write_parquet(buf)
        buf.seek(0)
        self._client.put_object(
            bucket_name=minio_config.bucket,
            object_name=object_name,
            data=buf,
            length=len(buf.getvalue()),
            content_type="application/octet-stream",
        )

    def get_parquet(self, object_name: str) -> Optional[pl.DataFrame]:
        try:
            response = self._client.get_object(minio_config.bucket, object_name)
            buf = io.BytesIO(response.read())
            buf.seek(0)
            return pl.read_parquet(buf)
        except S3Error:
            return None
        finally:
            try:
                response.close()
                response.release_conn()
            except Exception:
                pass

    def list_objects(self, prefix: str = ""):
        return self._client.list_objects(minio_config.bucket, prefix=prefix, recursive=True)
