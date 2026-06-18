from typing import Optional, List, Dict, Any, BinaryIO
from datetime import datetime
from pathlib import Path
import io
import json

try:
    from minio import Minio
    from minio.error import S3Error
except ImportError:
    Minio = None
    S3Error = Exception

from config import MinIOConfig


class MinIOStorage:
    def __init__(self, config: Optional[MinIOConfig] = None):
        self.config = config or MinIOConfig()
        self._client: Optional[Minio] = None
        self._available = False
        self._init_client()

    def _init_client(self):
        if Minio is None:
            self._available = False
            return
        try:
            self._client = Minio(
                endpoint=self.config.ENDPOINT,
                access_key=self.config.ACCESS_KEY,
                secret_key=self.config.SECRET_KEY,
                secure=self.config.SECURE,
            )
            self._ensure_bucket()
            self._available = True
        except Exception:
            self._available = False

    def _ensure_bucket(self):
        if not self._client:
            return
        try:
            if not self._client.bucket_exists(self.config.BUCKET):
                self._client.make_bucket(self.config.BUCKET)
        except Exception:
            pass

    @property
    def available(self) -> bool:
        return self._available

    def upload_file(
        self,
        object_name: str,
        file_path: str,
        content_type: str = "application/octet-stream",
    ) -> bool:
        if not self._available or not self._client:
            return False
        try:
            self._client.fput_object(
                bucket_name=self.config.BUCKET,
                object_name=object_name,
                file_path=file_path,
                content_type=content_type,
            )
            return True
        except Exception:
            return False

    def upload_bytes(
        self,
        object_name: str,
        data: bytes,
        content_type: str = "application/octet-stream",
    ) -> bool:
        if not self._available or not self._client:
            return False
        try:
            self._client.put_object(
                bucket_name=self.config.BUCKET,
                object_name=object_name,
                data=io.BytesIO(data),
                length=len(data),
                content_type=content_type,
            )
            return True
        except Exception:
            return False

    def download_file(self, object_name: str, file_path: str) -> bool:
        if not self._available or not self._client:
            return False
        try:
            self._client.fget_object(
                bucket_name=self.config.BUCKET,
                object_name=object_name,
                file_path=file_path,
            )
            return True
        except Exception:
            return False

    def download_bytes(self, object_name: str) -> Optional[bytes]:
        if not self._available or not self._client:
            return None
        try:
            response = self._client.get_object(
                bucket_name=self.config.BUCKET,
                object_name=object_name,
            )
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except Exception:
            return None

    def list_objects(self, prefix: str = "") -> List[Dict[str, Any]]:
        if not self._available or not self._client:
            return []
        try:
            objects = self._client.list_objects(
                bucket_name=self.config.BUCKET,
                prefix=prefix,
                recursive=True,
            )
            result = []
            for obj in objects:
                result.append({
                    "object_name": obj.object_name,
                    "size": obj.size,
                    "last_modified": obj.last_modified,
                    "etag": obj.etag,
                })
            return result
        except Exception:
            return []

    def delete_object(self, object_name: str) -> bool:
        if not self._available or not self._client:
            return False
        try:
            self._client.remove_object(
                bucket_name=self.config.BUCKET,
                object_name=object_name,
            )
            return True
        except Exception:
            return False

    def object_exists(self, object_name: str) -> bool:
        if not self._available or not self._client:
            return False
        try:
            self._client.stat_object(
                bucket_name=self.config.BUCKET,
                object_name=object_name,
            )
            return True
        except Exception:
            return False

    def save_json(self, object_name: str, data: Any) -> bool:
        json_bytes = json.dumps(data, ensure_ascii=False, default=str).encode("utf-8")
        return self.upload_bytes(object_name, json_bytes, "application/json")

    def load_json(self, object_name: str) -> Optional[Any]:
        data = self.download_bytes(object_name)
        if data:
            try:
                return json.loads(data.decode("utf-8"))
            except Exception:
                return None
        return None
