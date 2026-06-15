import io
import json
import polars as pl
from typing import Optional, Dict, Any
from datetime import datetime
from minio import Minio
from minio.error import S3Error
from config import minio_config

class MinIOClient:
    def __init__(self):
        self.client = Minio(
            endpoint=minio_config.endpoint,
            access_key=minio_config.access_key,
            secret_key=minio_config.secret_key,
            secure=minio_config.secure
        )
        self.bucket_name = minio_config.bucket_name
        self._ensure_bucket()

    def _ensure_bucket(self):
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
        except S3Error as e:
            print(f"Bucket check error: {e}")

    def put_dataframe(self, df: pl.DataFrame, object_path: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        try:
            csv_data = df.write_csv()
            csv_bytes = csv_data.encode('utf-8')
            data_stream = io.BytesIO(csv_bytes)
            data_size = len(csv_bytes)
            
            full_metadata = {
                "upload_timestamp": datetime.now().isoformat(),
                "row_count": str(len(df)),
                "columns": ",".join(df.columns)
            }
            if metadata:
                full_metadata.update(metadata)
            
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_path,
                data=data_stream,
                length=data_size,
                content_type="text/csv",
                metadata=full_metadata
            )
            return True
        except S3Error as e:
            print(f"Error uploading to MinIO: {e}")
            return False

    def get_dataframe(self, object_path: str) -> Optional[pl.DataFrame]:
        try:
            response = self.client.get_object(self.bucket_name, object_path)
            csv_data = response.read().decode('utf-8')
            df = pl.read_csv(io.StringIO(csv_data))
            return df
        except S3Error as e:
            print(f"Error downloading from MinIO: {e}")
            return None

    def list_objects(self, prefix: str = "") -> list:
        try:
            objects = self.client.list_objects(self.bucket_name, prefix=prefix, recursive=True)
            return [obj.object_name for obj in objects]
        except S3Error as e:
            print(f"Error listing objects: {e}")
            return []

    def get_object_metadata(self, object_path: str) -> Optional[Dict[str, Any]]:
        try:
            stat = self.client.stat_object(self.bucket_name, object_path)
            return stat.metadata
        except S3Error as e:
            print(f"Error getting metadata: {e}")
            return None

    def put_json(self, data: Dict[str, Any], object_path: str) -> bool:
        try:
            json_str = json.dumps(data, ensure_ascii=False)
            json_bytes = json_str.encode('utf-8')
            data_stream = io.BytesIO(json_bytes)
            
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_path,
                data=data_stream,
                length=len(json_bytes),
                content_type="application/json"
            )
            return True
        except S3Error as e:
            print(f"Error uploading JSON: {e}")
            return False

    def get_json(self, object_path: str) -> Optional[Dict[str, Any]]:
        try:
            response = self.client.get_object(self.bucket_name, object_path)
            json_data = response.read().decode('utf-8')
            return json.loads(json_data)
        except S3Error as e:
            print(f"Error downloading JSON: {e}")
            return None
