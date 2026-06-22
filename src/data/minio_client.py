import io
import hashlib
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from minio import Minio
from minio.error import S3Error
from src.utils.config import settings


class MinioConnector:
    def __init__(self):
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self.buckets = {
            "audit": settings.MINIO_BUCKET_AUDIT,
            "logs": settings.MINIO_BUCKET_LOGS,
            "mail": settings.MINIO_BUCKET_MAIL
        }

    def ensure_buckets(self) -> None:
        for bucket_name in self.buckets.values():
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)

    def upload_file(self, bucket_type: str, object_key: str,
                   file_data: bytes, file_name: str,
                   content_type: str = "application/octet-stream") -> Dict[str, Any]:
        bucket_name = self.buckets.get(bucket_type)
        if not bucket_name:
            raise ValueError(f"Invalid bucket type: {bucket_type}")

        file_hash = hashlib.sha256(file_data).hexdigest()
        file_size = len(file_data)

        self.client.put_object(
            bucket_name=bucket_name,
            object_name=object_key,
            data=io.BytesIO(file_data),
            length=file_size,
            content_type=content_type
        )

        return {
            "bucket": bucket_name,
            "object_key": object_key,
            "file_name": file_name,
            "file_size": file_size,
            "file_hash": file_hash,
            "content_type": content_type
        }

    def upload_file_from_path(self, bucket_type: str, object_key: str,
                            local_file_path: str, content_type: str = "application/octet-stream") -> Dict[str, Any]:
        with open(local_file_path, "rb") as f:
            file_data = f.read()
        file_name = local_file_path.split("/")[-1]
        return self.upload_file(bucket_type, object_key, file_data, file_name, content_type)

    def download_file(self, bucket_type: str, object_key: str) -> bytes:
        bucket_name = self.buckets.get(bucket_type)
        if not bucket_name:
            raise ValueError(f"Invalid bucket type: {bucket_type}")

        response = self.client.get_object(bucket_name, object_key)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    def get_file_info(self, bucket_type: str, object_key: str) -> Optional[Dict[str, Any]]:
        bucket_name = self.buckets.get(bucket_type)
        if not bucket_name:
            raise ValueError(f"Invalid bucket type: {bucket_type}")

        try:
            stat = self.client.stat_object(bucket_name, object_key)
            return {
                "bucket": bucket_name,
                "object_key": object_key,
                "size": stat.size,
                "last_modified": stat.last_modified,
                "etag": stat.etag,
                "content_type": stat.content_type
            }
        except S3Error:
            return None

    def list_objects(self, bucket_type: str, prefix: str = "") -> List[Dict[str, Any]]:
        bucket_name = self.buckets.get(bucket_type)
        if not bucket_name:
            raise ValueError(f"Invalid bucket type: {bucket_type}")

        objects = []
        for obj in self.client.list_objects(bucket_name, prefix=prefix, recursive=True):
            objects.append({
                "object_key": obj.object_name,
                "size": obj.size,
                "last_modified": obj.last_modified,
                "etag": obj.etag
            })
        return objects

    def delete_file(self, bucket_type: str, object_key: str) -> None:
        bucket_name = self.buckets.get(bucket_type)
        if not bucket_name:
            raise ValueError(f"Invalid bucket type: {bucket_type}")

        self.client.remove_object(bucket_name, object_key)

    def get_presigned_url(self, bucket_type: str, object_key: str,
                         expires_seconds: int = 3600) -> str:
        bucket_name = self.buckets.get(bucket_type)
        if not bucket_name:
            raise ValueError(f"Invalid bucket type: {bucket_type}")

        return self.client.presigned_get_object(bucket_name, object_key, expires=expires_seconds)

    def verify_file_integrity(self, bucket_type: str, object_key: str, expected_hash: str) -> Tuple[bool, Optional[str]]:
        try:
            file_data = self.download_file(bucket_type, object_key)
            actual_hash = hashlib.sha256(file_data).hexdigest()
            return (actual_hash == expected_hash, actual_hash)
        except Exception as e:
            return (False, str(e))
