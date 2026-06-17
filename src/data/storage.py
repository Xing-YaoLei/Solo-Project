import io
import polars as pl
from typing import Optional, List, Dict
from datetime import datetime

try:
    from minio import Minio
    from minio.error import S3Error
    MINIO_AVAILABLE = True
except ImportError:
    MINIO_AVAILABLE = False


class MinIOStorage:
    def __init__(
        self,
        endpoint: str = "localhost:9000",
        access_key: str = "minioadmin",
        secret_key: str = "minioadmin",
        secure: bool = False,
        bucket_name: str = "cleaning-schedule"
    ):
        self.bucket_name = bucket_name
        self.client = None
        if MINIO_AVAILABLE:
            try:
                self.client = Minio(
                    endpoint,
                    access_key=access_key,
                    secret_key=secret_key,
                    secure=secure
                )
                if not self.client.bucket_exists(bucket_name):
                    self.client.make_bucket(bucket_name)
            except Exception:
                self.client = None

    def is_available(self) -> bool:
        return self.client is not None and MINIO_AVAILABLE

    def upload_dataframe(
        self,
        df: pl.DataFrame,
        object_name: str,
        metadata: Optional[Dict] = None
    ) -> bool:
        if not self.is_available():
            return False
        try:
            csv_data = df.write_csv()
            csv_bytes = csv_data.encode("utf-8")
            self.client.put_object(
                self.bucket_name,
                object_name,
                io.BytesIO(csv_bytes),
                len(csv_bytes),
                content_type="text/csv",
                metadata=metadata or {}
            )
            return True
        except S3Error:
            return False

    def download_dataframe(self, object_name: str) -> Optional[pl.DataFrame]:
        if not self.is_available():
            return None
        try:
            response = self.client.get_object(self.bucket_name, object_name)
            csv_data = response.read().decode("utf-8")
            return pl.read_csv(io.StringIO(csv_data))
        except S3Error:
            return None

    def list_objects(self, prefix: str = "") -> List[Dict]:
        if not self.is_available():
            return []
        try:
            objects = self.client.list_objects(self.bucket_name, prefix=prefix, recursive=True)
            return [
                {
                    "name": obj.object_name,
                    "size": obj.size,
                    "last_modified": obj.last_modified,
                }
                for obj in objects
            ]
        except S3Error:
            return []

    def list_versions(self, prefix: str = "meter_readings") -> List[Dict]:
        objects = self.list_objects(prefix)
        versions = []
        for obj in objects:
            name = obj["name"]
            parts = name.replace(prefix + "/", "").replace(".csv", "").split("_v")
            if len(parts) == 2:
                versions.append({
                    "version": int(parts[1]),
                    "file_name": name,
                    "size": obj["size"],
                    "last_modified": obj["last_modified"],
                })
        return sorted(versions, key=lambda x: x["version"], reverse=True)

    def save_versioned_dataframe(
        self,
        df: pl.DataFrame,
        category: str,
        version: Optional[int] = None
    ) -> Optional[str]:
        if not self.is_available():
            return None
        if version is None:
            existing = self.list_versions(category)
            version = existing[0]["version"] + 1 if existing else 1
        object_name = f"{category}/{category}_v{version}.csv"
        metadata = {
            "version": str(version),
            "category": category,
            "upload_time": datetime.now().isoformat()
        }
        if self.upload_dataframe(df, object_name, metadata):
            return object_name
        return None
