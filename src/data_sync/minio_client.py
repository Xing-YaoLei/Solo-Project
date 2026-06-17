import io
import json
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path

from minio import Minio
from minio.error import S3Error

from ..config import MinIOConfig

logger = logging.getLogger(__name__)


class MinIOClient:
    def __init__(self, config: Optional[MinIOConfig] = None):
        self.config = config or MinIOConfig
        self._client = None

    @property
    def client(self) -> Minio:
        if self._client is None:
            self._client = Minio(
                endpoint=self.config.ENDPOINT,
                access_key=self.config.ACCESS_KEY,
                secret_key=self.config.SECRET_KEY,
                secure=self.config.SECURE,
            )
        return self._client

    def ensure_buckets(self) -> None:
        for bucket in [self.config.BUCKET_DATA, self.config.BUCKET_AUDIT]:
            if not self.client.bucket_exists(bucket):
                self.client.make_bucket(bucket)
                logger.info(f"Created bucket: {bucket}")

    def list_objects(self, bucket: str, prefix: str = "") -> List[Dict[str, Any]]:
        try:
            objects = self.client.list_objects(bucket, prefix=prefix, recursive=True)
            return [
                {
                    "name": obj.object_name,
                    "size": obj.size,
                    "last_modified": obj.last_modified,
                    "etag": obj.etag,
                }
                for obj in objects
            ]
        except S3Error as e:
            logger.error(f"Failed to list objects in {bucket}/{prefix}: {e}")
            return []

    def get_object(self, bucket: str, object_name: str) -> Optional[bytes]:
        try:
            response = self.client.get_object(bucket, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except S3Error as e:
            logger.error(f"Failed to get object {bucket}/{object_name}: {e}")
            return None

    def put_object(
        self,
        bucket: str,
        object_name: str,
        data: bytes,
        content_type: str = "application/octet-stream",
    ) -> bool:
        try:
            self.client.put_object(
                bucket_name=bucket,
                object_name=object_name,
                data=io.BytesIO(data),
                length=len(data),
                content_type=content_type,
            )
            return True
        except S3Error as e:
            logger.error(f"Failed to put object {bucket}/{object_name}: {e}")
            return False

    def put_json(self, bucket: str, object_name: str, data: Dict[str, Any]) -> bool:
        return self.put_object(
            bucket, object_name, json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8"), "application/json"
        )

    def get_json(self, bucket: str, object_name: str) -> Optional[Dict[str, Any]]:
        raw = self.get_object(bucket, object_name)
        if raw is None:
            return None
        try:
            return json.loads(raw.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            logger.error(f"Failed to parse JSON from {bucket}/{object_name}: {e}")
            return None

    def fput_object(self, bucket: str, object_name: str, file_path: str) -> bool:
        try:
            self.client.fput_object(bucket, object_name, file_path)
            return True
        except S3Error as e:
            logger.error(f"Failed to fput object {bucket}/{object_name} from {file_path}: {e}")
            return False

    def fget_object(self, bucket: str, object_name: str, file_path: str) -> bool:
        try:
            self.client.fget_object(bucket, object_name, file_path)
            return True
        except S3Error as e:
            logger.error(f"Failed to fget object {bucket}/{object_name} to {file_path}: {e}")
            return False

    def write_audit_log(self, node_id: str, node_name: str, status: str, details: Dict[str, Any]) -> str:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        object_name = f"{timestamp}_{node_id}_{status}.json"
        log_data = {
            "node_id": node_id,
            "node_name": node_name,
            "status": status,
            "timestamp": datetime.now().isoformat(),
            "details": details,
        }
        success = self.put_json(self.config.BUCKET_AUDIT, object_name, log_data)
        if success:
            logger.info(f"Audit log written: {object_name}")
        return object_name

    def read_audit_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        objects = sorted(
            self.list_objects(self.config.BUCKET_AUDIT),
            key=lambda x: x.get("last_modified", datetime.min),
            reverse=True,
        )[:limit]
        logs = []
        for obj in objects:
            data = self.get_json(self.config.BUCKET_AUDIT, obj["name"])
            if data:
                logs.append(data)
        return logs
