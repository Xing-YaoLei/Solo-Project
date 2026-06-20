import io
import json
from typing import Optional, List
from minio import Minio
from minio.error import S3Error
import polars as pl
from src.config import minio_config


class MinIOClient:
    def __init__(self):
        self.client = Minio(
            endpoint=minio_config.endpoint,
            access_key=minio_config.access_key,
            secret_key=minio_config.secret_key,
            secure=minio_config.secure,
        )
        self.bucket = minio_config.bucket
        self._ensure_bucket()

    def _ensure_bucket(self):
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
        except Exception:
            pass

    def upload_dataframe(self, df: pl.DataFrame, object_name: str) -> bool:
        try:
            csv_bytes = df.write_csv().encode("utf-8")
            self.client.put_object(
                bucket_name=self.bucket,
                object_name=object_name,
                data=io.BytesIO(csv_bytes),
                length=len(csv_bytes),
                content_type="text/csv",
            )
            return True
        except S3Error:
            return False

    def download_dataframe(self, object_name: str) -> Optional[pl.DataFrame]:
        try:
            response = self.client.get_object(self.bucket, object_name)
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

    def upload_json(self, data: dict, object_name: str) -> bool:
        try:
            json_bytes = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
            self.client.put_object(
                bucket_name=self.bucket,
                object_name=object_name,
                data=io.BytesIO(json_bytes),
                length=len(json_bytes),
                content_type="application/json",
            )
            return True
        except S3Error:
            return False

    def download_json(self, object_name: str) -> Optional[dict]:
        try:
            response = self.client.get_object(self.bucket, object_name)
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
        try:
            return [
                obj.object_name
                for obj in self.client.list_objects(self.bucket, prefix=prefix, recursive=True)
            ]
        except S3Error:
            return []


minio_client = MinIOClient()
