import io
import json
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

import polars as pl

from .config import MinIOConfig, DATA_DIR

logger = logging.getLogger(__name__)


class MinioStorageClient:
    def __init__(self, config: MinIOConfig):
        self.config = config
        self.local_fallback_dir = DATA_DIR / "minio_fallback"
        self.local_fallback_dir.mkdir(exist_ok=True)
        self._client = None
        self._use_local = config.use_local_fallback
        self._init_client()

    def _init_client(self):
        if self._use_local:
            logger.info("Using local filesystem as MinIO fallback")
            return
        try:
            from minio import Minio
            from minio.error import S3Error

            self._client = Minio(
                self.config.endpoint,
                access_key=self.config.access_key,
                secret_key=self.config.secret_key,
                secure=self.config.secure,
            )
            if not self._client.bucket_exists(self.config.bucket):
                self._client.make_bucket(self.config.bucket)
            logger.info(f"MinIO client initialized successfully, bucket: {self.config.bucket}")
        except Exception as e:
            logger.warning(f"MinIO connection failed, using local fallback: {e}")
            self._use_local = True

    def _get_local_path(self, object_name: str) -> Path:
        local_path = self.local_fallback_dir / self.config.bucket / object_name
        local_path.parent.mkdir(parents=True, exist_ok=True)
        return local_path

    def upload_df(self, df: pl.DataFrame, object_name: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        csv_data = df.write_csv()
        full_object_name = f"{object_name}.csv"
        self._upload_bytes(csv_data.encode("utf-8"), full_object_name, "text/csv", metadata)
        return full_object_name

    def upload_json(self, data: Dict[str, Any], object_name: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        json_str = json.dumps(data, ensure_ascii=False, indent=2)
        full_object_name = f"{object_name}.json"
        self._upload_bytes(json_str.encode("utf-8"), full_object_name, "application/json", metadata)
        return full_object_name

    def _upload_bytes(self, data: bytes, object_name: str, content_type: str, metadata: Optional[Dict[str, Any]] = None):
        if self._use_local:
            local_path = self._get_local_path(object_name)
            local_path.write_bytes(data)
            if metadata:
                meta_path = local_path.with_suffix(local_path.suffix + ".meta")
                meta_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2))
            logger.info(f"Saved to local: {local_path}")
            return

        from minio.error import S3Error

        try:
            self._client.put_object(
                self.config.bucket,
                object_name,
                io.BytesIO(data),
                length=len(data),
                content_type=content_type,
                metadata=metadata or {},
            )
            logger.info(f"Uploaded to MinIO: {object_name}")
        except S3Error as e:
            logger.error(f"MinIO upload failed: {e}")
            raise

    def read_df(self, object_name: str) -> Optional[pl.DataFrame]:
        if not object_name.endswith(".csv"):
            object_name = f"{object_name}.csv"

        if self._use_local:
            local_path = self._get_local_path(object_name)
            if not local_path.exists():
                return None
            return pl.read_csv(local_path)

        from minio.error import S3Error

        try:
            response = self._client.get_object(self.config.bucket, object_name)
            data = response.read()
            return pl.read_csv(io.BytesIO(data))
        except S3Error as e:
            if e.code == "NoSuchKey":
                return None
            logger.error(f"MinIO read failed: {e}")
            raise

    def read_json(self, object_name: str) -> Optional[Dict[str, Any]]:
        if not object_name.endswith(".json"):
            object_name = f"{object_name}.json"

        if self._use_local:
            local_path = self._get_local_path(object_name)
            if not local_path.exists():
                return None
            return json.loads(local_path.read_text())

        from minio.error import S3Error

        try:
            response = self._client.get_object(self.config.bucket, object_name)
            data = response.read()
            return json.loads(data.decode("utf-8"))
        except S3Error as e:
            if e.code == "NoSuchKey":
                return None
            logger.error(f"MinIO read failed: {e}")
            raise

    def list_objects(self, prefix: str = "") -> List[str]:
        if self._use_local:
            local_dir = self._get_local_path(prefix) if prefix else self.local_fallback_dir / self.config.bucket
            if not local_dir.exists():
                return []
            return [str(p.relative_to(self.local_fallback_dir / self.config.bucket)) for p in local_dir.rglob("*") if p.is_file()]

        from minio.error import S3Error

        try:
            objects = self._client.list_objects(self.config.bucket, prefix=prefix, recursive=True)
            return [obj.object_name for obj in objects]
        except S3Error as e:
            logger.error(f"MinIO list failed: {e}")
            return []

    def save_batch(self, batch_id: str, data_type: str, df: pl.DataFrame, metadata: Dict[str, Any]) -> str:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        object_name = f"batches/{data_type}/{batch_id}_{timestamp}"
        full_metadata = {
            "batch_id": batch_id,
            "data_type": data_type,
            "upload_time": timestamp,
            "row_count": str(len(df)),
            **metadata,
        }
        return self.upload_df(df, object_name, full_metadata)

    def get_batch(self, batch_id: str, data_type: Optional[str] = None) -> Optional[pl.DataFrame]:
        prefix = f"batches/{data_type}/" if data_type else "batches/"
        objects = self.list_objects(prefix)
        matching = [obj for obj in objects if batch_id in obj and obj.endswith(".csv")]
        if not matching:
            return None
        matching.sort(reverse=True)
        return self.read_df(matching[0])

    def list_batches(self, data_type: Optional[str] = None) -> List[Dict[str, Any]]:
        prefix = f"batches/{data_type}/" if data_type else "batches/"
        objects = self.list_objects(prefix)
        csv_objects = [obj for obj in objects if obj.endswith(".csv")]

        batches = []
        for obj in csv_objects:
            meta_obj = obj + ".meta"
            meta = self.read_json(meta_obj.replace(".json", "")) if self._use_local else None
            if meta is None:
                parts = obj.replace(".csv", "").split("/")
                if len(parts) >= 3:
                    batch_part = parts[-1]
                    batch_id = batch_part.split("_")[0]
                    meta = {"batch_id": batch_id, "data_type": parts[-2]}
            if meta:
                meta["object_name"] = obj
                batches.append(meta)

        batches.sort(key=lambda x: x.get("upload_time", ""), reverse=True)
        return batches
