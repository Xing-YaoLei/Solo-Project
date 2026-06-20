from minio import Minio
from minio.error import S3Error
import io
from typing import List, Optional
import json
import polars as pl
from pathlib import Path
import logging

from src.config import Config

logger = logging.getLogger(__name__)


class MinIOClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_client()
        return cls._instance

    def _init_client(self):
        self.client = Minio(
            Config.MINIO_ENDPOINT,
            access_key=Config.MINIO_ACCESS_KEY,
            secret_key=Config.MINIO_SECRET_KEY,
            secure=Config.MINIO_SECURE,
        )
        self.bucket = Config.MINIO_BUCKET
        self._ensure_bucket()

    def _ensure_bucket(self):
        self._fallback_dir = Path("./data/minio_fallback")
        self._fallback_dir.mkdir(parents=True, exist_ok=True)
        self._use_fallback = False

        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
                logger.info(f"Bucket {self.bucket} created")
        except Exception as e:
            logger.warning(f"MinIO connection failed: {e}. Using local fallback mode")
            self._use_fallback = True

    def upload_file(self, object_name: str, file_path: str, content_type: str = "application/octet-stream"):
        if self._use_fallback:
            dest = self._fallback_dir / object_name
            dest.parent.mkdir(parents=True, exist_ok=True)
            with open(file_path, "rb") as f:
                dest.write_bytes(f.read())
            return str(dest)

        try:
            self.client.fput_object(self.bucket, object_name, file_path, content_type=content_type)
            return f"{self.bucket}/{object_name}"
        except S3Error as e:
            logger.error(f"Upload failed: {e}")
            raise

    def upload_dataframe(self, object_name: str, df: pl.DataFrame, format: str = "parquet"):
        buffer = io.BytesIO()

        if format == "parquet":
            df.write_parquet(buffer)
        elif format == "csv":
            df.write_csv(buffer)

        buffer.seek(0)

        if self._use_fallback:
            dest = self._fallback_dir / object_name
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(buffer.getvalue())
            return str(dest)

        try:
            self.client.put_object(
                self.bucket, object_name, buffer,
                length=buffer.getbuffer().nbytes,
                content_type=f"application/{format}"
            )
            return f"{self.bucket}/{object_name}"
        except S3Error as e:
            logger.error(f"Upload dataframe failed: {e}")
            raise

    def download_dataframe(self, object_name: str, format: str = "parquet") -> pl.DataFrame:
        if self._use_fallback:
            path = self._fallback_dir / object_name
            if format == "parquet":
                return pl.read_parquet(path)
            elif format == "csv":
                return pl.read_csv(path)

        try:
            response = self.client.get_object(self.bucket, object_name)
            buffer = io.BytesIO(response.read())
            buffer.seek(0)
            if format == "parquet":
                return pl.read_parquet(buffer)
            elif format == "csv":
                return pl.read_csv(buffer)
        except S3Error as e:
            logger.error(f"Download failed: {e}")
            raise

    def list_objects(self, prefix: str = "") -> List[str]:
        if self._use_fallback:
            path = self._fallback_dir / prefix
            if not path.exists():
                return []
            return [str(p.relative_to(self._fallback_dir)) for p in path.rglob("*") if p.is_file()]

        try:
            objects = self.client.list_objects(self.bucket, prefix=prefix, recursive=True)
            return [obj.object_name for obj in objects]
        except S3Error as e:
            logger.error(f"List objects failed: {e}")
            return []

    def delete_object(self, object_name: str):
        if self._use_fallback:
            path = self._fallback_dir / object_name
            if path.exists():
                path.unlink()
            return

        try:
            self.client.remove_object(self.bucket, object_name)
        except S3Error as e:
            logger.error(f"Delete failed: {e}")
            raise

    def put_json(self, object_name: str, data: dict):
        json_str = json.dumps(data, ensure_ascii=False)
        buffer = io.BytesIO(json_str.encode("utf-8"))

        if self._use_fallback:
            dest = self._fallback_dir / object_name
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(buffer.getvalue())
            return

        try:
            self.client.put_object(
                self.bucket, object_name, buffer,
                length=buffer.getbuffer().nbytes,
                content_type="application/json"
            )
        except S3Error as e:
            logger.error(f"Put json failed: {e}")
            raise

    def get_json(self, object_name: str) -> Optional[dict]:
        if self._use_fallback:
            path = self._fallback_dir / object_name
            if not path.exists():
                return None
            return json.loads(path.read_text())

        try:
            response = self.client.get_object(self.bucket, object_name)
            return json.loads(response.read().decode("utf-8"))
        except S3Error as e:
            logger.error(f"Get json failed: {e}")
            return None
