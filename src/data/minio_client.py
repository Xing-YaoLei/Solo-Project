import io
import json
import os
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
        self._fallback_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "archive")

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
            "fallback_dir": self._fallback_dir if not available else None,
        }

    def _fallback_upload(self, data: bytes, object_name: str) -> Tuple[bool, str]:
        try:
            full_path = os.path.join(self._fallback_dir, object_name)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "wb") as f:
                f.write(data)
            return True, f"local://{full_path}"
        except Exception as e:
            return False, f"Local fallback failed: {str(e)}"

    def upload_dataframe(self, df: pl.DataFrame, object_name: str) -> Tuple[bool, str]:
        csv_bytes = df.write_csv().encode("utf-8")
        client, available = self._get_client()
        if available and client:
            try:
                client.put_object(
                    bucket_name=self.bucket,
                    object_name=object_name,
                    data=io.BytesIO(csv_bytes),
                    length=len(csv_bytes),
                    content_type="text/csv",
                )
                return True, f"s3://{self.bucket}/{object_name}"
            except S3Error as e:
                return self._fallback_upload(csv_bytes, object_name)
        return self._fallback_upload(csv_bytes, object_name)

    def download_dataframe(self, object_name: str) -> Optional[pl.DataFrame]:
        client, available = self._get_client()
        if available and client:
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
        local_path = os.path.join(self._fallback_dir, object_name)
        if os.path.exists(local_path):
            try:
                return pl.read_csv(local_path)
            except Exception:
                return None
        return None

    def upload_json(self, data: dict, object_name: str) -> Tuple[bool, str]:
        json_bytes = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        client, available = self._get_client()
        if available and client:
            try:
                client.put_object(
                    bucket_name=self.bucket,
                    object_name=object_name,
                    data=io.BytesIO(json_bytes),
                    length=len(json_bytes),
                    content_type="application/json",
                )
                return True, f"s3://{self.bucket}/{object_name}"
            except S3Error as e:
                return self._fallback_upload(json_bytes, object_name)
        return self._fallback_upload(json_bytes, object_name)

    def upload_bytes(self, data: bytes, object_name: str, content_type: str) -> Tuple[bool, str]:
        client, available = self._get_client()
        if available and client:
            try:
                client.put_object(
                    bucket_name=self.bucket,
                    object_name=object_name,
                    data=io.BytesIO(data),
                    length=len(data),
                    content_type=content_type,
                )
                return True, f"s3://{self.bucket}/{object_name}"
            except S3Error as e:
                return self._fallback_upload(data, object_name)
        return self._fallback_upload(data, object_name)

    def download_json(self, object_name: str) -> Optional[dict]:
        client, available = self._get_client()
        if available and client:
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
        local_path = os.path.join(self._fallback_dir, object_name)
        if os.path.exists(local_path):
            try:
                with open(local_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return None
        return None

    def list_objects(self, prefix: str = "") -> List[str]:
        client, available = self._get_client()
        results: List[str] = []
        if available and client:
            try:
                results.extend([
                    obj.object_name
                    for obj in client.list_objects(self.bucket, prefix=prefix, recursive=True)
                ])
            except S3Error:
                pass
        local_prefix = os.path.join(self._fallback_dir, prefix)
        if os.path.isdir(local_prefix):
            for root, _, files in os.walk(local_prefix):
                for fname in files:
                    full = os.path.join(root, fname)
                    rel = os.path.relpath(full, self._fallback_dir)
                    results.append(rel)
        return results


minio_client = MinIOClient()
