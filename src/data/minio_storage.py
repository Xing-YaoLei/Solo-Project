import io
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
import polars as pl

try:
    from minio import Minio
    from minio.error import S3Error
    MINIO_AVAILABLE = True
except ImportError:
    MINIO_AVAILABLE = False

from config.settings import MINIO_CONFIG


class MinioStorage:
    def __init__(self):
        self.client = None
        self.bucket = MINIO_CONFIG["bucket"]
        if MINIO_AVAILABLE:
            try:
                self.client = Minio(
                    MINIO_CONFIG["endpoint"],
                    access_key=MINIO_CONFIG["access_key"],
                    secret_key=MINIO_CONFIG["secret_key"],
                    secure=MINIO_CONFIG["secure"],
                )
                self._ensure_bucket()
            except Exception:
                self.client = None

    def _ensure_bucket(self):
        if self.client and not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)

    @property
    def is_connected(self) -> bool:
        return self.client is not None

    def list_objects(self, prefix: str = "") -> List[str]:
        if not self.client:
            return []
        try:
            objects = self.client.list_objects(self.bucket, prefix=prefix, recursive=True)
            return [obj.object_name for obj in objects]
        except S3Error:
            return []

    def read_parquet(self, object_name: str) -> Optional[pl.DataFrame]:
        if not self.client:
            return None
        try:
            response = self.client.get_object(self.bucket, object_name)
            data = response.read()
            df = pl.read_parquet(io.BytesIO(data))
            return df
        except Exception:
            return None
        finally:
            if 'response' in locals():
                response.close()
                response.release_conn()

    def read_json(self, object_name: str) -> Optional[Dict[str, Any]]:
        if not self.client:
            return None
        try:
            response = self.client.get_object(self.bucket, object_name)
            data = response.read()
            return json.loads(data.decode('utf-8'))
        except Exception:
            return None
        finally:
            if 'response' in locals():
                response.close()
                response.release_conn()

    def write_parquet(self, object_name: str, df: pl.DataFrame) -> bool:
        if not self.client:
            return False
        try:
            buf = io.BytesIO()
            df.write_parquet(buf)
            buf.seek(0)
            self.client.put_object(
                self.bucket, object_name, buf,
                length=buf.getbuffer().nbytes,
                content_type="application/parquet"
            )
            return True
        except Exception:
            return False

    def get_object_info(self, object_name: str) -> Optional[Dict[str, Any]]:
        if not self.client:
            return None
        try:
            stat = self.client.stat_object(self.bucket, object_name)
            return {
                "object_name": stat.object_name,
                "size": stat.size,
                "last_modified": stat.last_modified,
                "etag": stat.etag,
            }
        except Exception:
            return None


minio_storage = MinioStorage()
