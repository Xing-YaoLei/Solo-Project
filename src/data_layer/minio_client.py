import io
import json
from typing import Optional, List, Dict, Any
from minio import Minio
from minio.error import S3Error
import polars as pl
from src.utils.config import MinIOConfig


class MinioClient:
    def __init__(self, config: MinIOConfig):
        self.config = config
        self.client = Minio(
            endpoint=config.endpoint,
            access_key=config.access_key,
            secret_key=config.secret_key,
            secure=config.secure,
        )
        self._ensure_bucket()

    def _ensure_bucket(self) -> None:
        try:
            if not self.client.bucket_exists(self.config.bucket):
                self.client.make_bucket(self.config.bucket)
        except S3Error as e:
            if "BucketAlreadyOwnedByYou" not in str(e):
                raise

    def upload_dataframe(
        self,
        df: pl.DataFrame,
        object_name: str,
        metadata: Optional[Dict[str, Any]] = None,
        format: str = "csv",
    ) -> None:
        if format == "parquet":
            data_bytes = df.write_parquet()
            content_type = "application/octet-stream"
        else:
            data_bytes = df.write_csv().encode("utf-8")
            content_type = "text/csv"

        data_io = io.BytesIO(data_bytes)
        self.client.put_object(
            bucket_name=self.config.bucket,
            object_name=object_name,
            data=data_io,
            length=len(data_bytes),
            content_type=content_type,
            metadata=metadata,
        )

    def download_dataframe(self, object_name: str, format: str = "csv") -> pl.DataFrame:
        try:
            response = self.client.get_object(
                bucket_name=self.config.bucket,
                object_name=object_name,
            )
            data = response.read()
            if format == "parquet":
                return pl.read_parquet(io.BytesIO(data))
            else:
                return pl.read_csv(io.StringIO(data.decode("utf-8")))
        finally:
            response.close()
            response.release_conn()

    def upload_json(
        self, data: Dict[str, Any], object_name: str, metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        json_bytes = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        json_io = io.BytesIO(json_bytes)
        self.client.put_object(
            bucket_name=self.config.bucket,
            object_name=object_name,
            data=json_io,
            length=len(json_bytes),
            content_type="application/json",
            metadata=metadata,
        )

    def download_json(self, object_name: str) -> Dict[str, Any]:
        try:
            response = self.client.get_object(
                bucket_name=self.config.bucket,
                object_name=object_name,
            )
            return json.loads(response.read().decode("utf-8"))
        finally:
            response.close()
            response.release_conn()

    def list_objects(self, prefix: str = "", recursive: bool = True) -> List[str]:
        objects = self.client.list_objects(
            bucket_name=self.config.bucket,
            prefix=prefix,
            recursive=recursive,
        )
        return [obj.object_name for obj in objects]

    def delete_object(self, object_name: str) -> None:
        self.client.remove_object(
            bucket_name=self.config.bucket,
            object_name=object_name,
        )

    def object_exists(self, object_name: str) -> bool:
        try:
            self.client.stat_object(
                bucket_name=self.config.bucket,
                object_name=object_name,
            )
            return True
        except S3Error:
            return False
