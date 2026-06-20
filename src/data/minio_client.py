import io
import json
from typing import Optional, List, Tuple
from minio import Minio
from minio.error import S3Error
import polars as pl
from src.config import minio_config


class MinIOClient:
    def __init__(self):
        self.endpoint = minio_config.endpoint
        self.access_key = minio_config.access_key
        self.secret_key = minio_config.secret_key
        self.secure = minio_config.secure
        self.bucket = minio_config.bucket
        self._client: Optional[Minio] = None
        self._available: Optional[bool] = None

    def _get_client(self) -> Tuple[Optional[Minio], bool]:
        if self._client is not None and self._available is not None:
            return self._client, self._available
        try:
            self._client = Minio(
                endpoint=self.endpoint,
                access_key=self.access_key,
                secret_key=self.secret_key,
                secure=self.secure,
            )
            if not self._client.bucket_exists(self.bucket):
                try:
                    self._client.make_bucket(self.bucket)
                except Exception:
                    pass
            self._available = True
        except Exception:
            self._client = None
            self._available = False
        return self._client, self._available

    def is_available(self, force_check: bool = False) -> bool:
        if force_check:
            self._client = None
            self._available = None
        _, available = self._get_client()
        return available

    def get_status_info(self) -> dict:
        available = self.is_available()
        return {
            "available": available,
            "endpoint": self.endpoint,
            "bucket": self.bucket,
            "secure": self.secure,
        }

    def upload_dataframe(self, df: pl.DataFrame, object_name: str) -> Tuple[bool, str]:
        client, available = self._get_client()
        if not available or not client:
            return False, "MinIO service not available"
        try:
            csv_bytes = df.write_csv().encode("utf-8")
            client.put_object(
                bucket_name=self.bucket,
                object_name=object_name,
                data=io.BytesIO(csv_bytes),
                length=len(csv_bytes),
                content_type="text/csv",
            )
            return True, object_name
        except S3Error as e:
            return False, str(e)

    def download_dataframe(self, object_name: str) -> Optional[pl.DataFrame]:
        client, available = self._get_client()
        if not available or not client:
            return None
        try:
            response = client.get_object(self.bucket, object_name)
            csv_data = response.read().decode("utf-8")
            return pl.read_csv(io.StringIO(csv_data))
        except S3Error:
            return None
        finally:
            try:
                response.close()
                response.release_conn()
            except Exception:
                pass

    def upload_json(self, data: dict, object_name: str) -> Tuple[bool, str]:
        client, available = self._get_client()
        if not available or not client:
            return False, "MinIO service not available"
        try:
            json_bytes = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
            client.put_object(
                bucket_name=self.bucket,
                object_name=object_name,
                data=io.BytesIO(json_bytes),
                length=len(json_bytes),
                content_type="application/json",
            )
            return True, object_name
        except S3Error as e:
            return False, str(e)

    def upload_bytes(self, data: bytes, object_name: str, content_type: str) -> Tuple[bool, str]:
        client, available = self._get_client()
        if not available or not client:
            return False, "MinIO service not available"
        try:
            client.put_object(
                bucket_name=self.bucket,
                object_name=object_name,
                data=io.BytesIO(data),
                length=len(data),
                content_type=content_type,
            )
            return True, object_name
        except S3Error as e:
            return False, str(e)

    def download_json(self, object_name: str) -> Optional[dict]:
        client, available = self._get_client()
        if not available or not client:
            return None
        try:
            response = client.get_object(self.bucket, object_name)
            return json.loads(response.read().decode("utf-8"))
        except S3Error:
            return None
        finally:
            try:
                response.close()
                response.release_conn()
            except Exception:
                pass

    def list_objects(self, prefix: str = "") -> List[str]:
        client, available = self._get_client()
        if not available or not client:
            return []
        try:
            return [
                obj.object_name
                for obj in client.list_objects(self.bucket, prefix=prefix, recursive=True)
            ]
        except S3Error:
            return []


minio_client = MinIOClient()
