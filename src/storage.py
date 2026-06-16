from minio import Minio
from minio.error import S3Error
import io
from typing import Optional, List
import polars as pl
import json

from config import config


class MinIOManager:
    _instance: Optional["MinIOManager"] = None
    _client: Optional[Minio] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            self._initialize_client()

    def _initialize_client(self):
        self._client = Minio(
            endpoint=config.MINIO_ENDPOINT,
            access_key=config.MINIO_ACCESS_KEY,
            secret_key=config.MINIO_SECRET_KEY,
            secure=config.MINIO_SECURE
        )
        self._ensure_bucket()

    def _ensure_bucket(self):
        try:
            if not self._client.bucket_exists(config.MINIO_BUCKET):
                self._client.make_bucket(config.MINIO_BUCKET)
        except S3Error:
            pass

    def upload_dataframe(self, object_name: str, df: pl.DataFrame, format: str = "parquet"):
        if format == "parquet":
            buffer = io.BytesIO()
            df.write_parquet(buffer)
            buffer.seek(0)
            self._client.put_object(
                bucket_name=config.MINIO_BUCKET,
                object_name=object_name,
                data=buffer,
                length=len(buffer.getvalue()),
                content_type="application/octet-stream"
            )
        elif format == "csv":
            buffer = io.BytesIO(df.write_csv().encode("utf-8"))
            self._client.put_object(
                bucket_name=config.MINIO_BUCKET,
                object_name=object_name,
                data=buffer,
                length=len(buffer.getvalue()),
                content_type="text/csv"
            )
        elif format == "json":
            buffer = io.BytesIO(json.dumps(df.to_dicts(), ensure_ascii=False, default=str).encode("utf-8"))
            self._client.put_object(
                bucket_name=config.MINIO_BUCKET,
                object_name=object_name,
                data=buffer,
                length=len(buffer.getvalue()),
                content_type="application/json"
            )

    def download_dataframe(self, object_name: str, format: str = "parquet") -> Optional[pl.DataFrame]:
        try:
            response = self._client.get_object(
                bucket_name=config.MINIO_BUCKET,
                object_name=object_name
            )
            data = io.BytesIO(response.read())
            if format == "parquet":
                return pl.read_parquet(data)
            elif format == "csv":
                return pl.read_csv(data)
            elif format == "json":
                return pl.read_json(data)
        except S3Error:
            return None
        finally:
            try:
                response.close()
                response.release_conn()
            except:
                pass

    def list_objects(self, prefix: str = "") -> List[str]:
        try:
            objects = self._client.list_objects(config.MINIO_BUCKET, prefix=prefix, recursive=True)
            return [obj.object_name for obj in objects]
        except S3Error:
            return []

    def delete_object(self, object_name: str):
        try:
            self._client.remove_object(config.MINIO_BUCKET, object_name)
        except S3Error:
            pass

    def upload_bytes(self, object_name: str, data: bytes, content_type: str = "application/octet-stream"):
        buffer = io.BytesIO(data)
        self._client.put_object(
            bucket_name=config.MINIO_BUCKET,
            object_name=object_name,
            data=buffer,
            length=len(data),
            content_type=content_type
        )

    def download_bytes(self, object_name: str) -> Optional[bytes]:
        try:
            response = self._client.get_object(
                bucket_name=config.MINIO_BUCKET,
                object_name=object_name
            )
            return response.read()
        except S3Error:
            return None
        finally:
            try:
                response.close()
                response.release_conn()
            except:
                pass


def get_minio() -> MinIOManager:
    return MinIOManager()
