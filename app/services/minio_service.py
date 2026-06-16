from __future__ import annotations

import io
import json
from datetime import datetime
from pathlib import Path

import polars as pl
from minio import Minio

from app.config import settings


class MinIOService:
    def __init__(self) -> None:
        self.client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )
        self._ensure_buckets()

    def _ensure_buckets(self) -> None:
        for bucket in [
            settings.minio_bucket_pharmacy,
            settings.minio_bucket_prescription,
        ]:
            if not self.client.bucket_exists(bucket):
                self.client.make_bucket(bucket)

    def upload_dataframe(
        self,
        df: pl.DataFrame,
        object_name: str,
        batch_id: str | None = None,
    ) -> dict:
        if batch_id is None:
            batch_id = datetime.now().strftime("BATCH_%Y%m%d_%H%M%S")

        metadata = {
            "batch_id": batch_id,
            "uploaded_at": datetime.now().isoformat(),
            "rows": str(df.height),
            "columns": str(df.width),
            "column_names": json.dumps(df.columns),
        }

        csv_bytes = df.write_csv().encode("utf-8")
        self.client.put_object(
            settings.minio_bucket_pharmacy,
            f"{batch_id}/{object_name}",
            io.BytesIO(csv_bytes),
            length=len(csv_bytes),
            content_type="text/csv",
            metadata=metadata,
        )

        meta_bytes = json.dumps(metadata, ensure_ascii=False).encode("utf-8")
        self.client.put_object(
            settings.minio_bucket_pharmacy,
            f"{batch_id}/{object_name}.meta.json",
            io.BytesIO(meta_bytes),
            length=len(meta_bytes),
            content_type="application/json",
        )

        return metadata

    def upload_prescription_photo(
        self,
        photo_path: Path,
        prescription_id: str,
        batch_id: str | None = None,
    ) -> str:
        if batch_id is None:
            batch_id = datetime.now().strftime("BATCH_%Y%m%d_%H%M%S")

        object_key = f"{batch_id}/{prescription_id}/{photo_path.name}"
        self.client.fput_object(
            settings.minio_bucket_prescription,
            object_key,
            str(photo_path),
            content_type="image/jpeg",
        )
        return object_key

    def download_dataframe(self, batch_id: str, object_name: str) -> pl.DataFrame:
        response = self.client.get_object(
            settings.minio_bucket_pharmacy,
            f"{batch_id}/{object_name}",
        )
        csv_data = response.read().decode("utf-8")
        response.close()
        response.release_conn()
        return pl.read_csv(io.StringIO(csv_data))

    def get_batch_metadata(self, batch_id: str, object_name: str) -> dict:
        response = self.client.get_object(
            settings.minio_bucket_pharmacy,
            f"{batch_id}/{object_name}.meta.json",
        )
        data = json.loads(response.read().decode("utf-8"))
        response.close()
        response.release_conn()
        return data

    def list_objects_in_batch(self, batch_id: str) -> list[str]:
        objects = self.client.list_objects(
            settings.minio_bucket_pharmacy,
            prefix=f"{batch_id}/",
            recursive=True,
        )
        return [obj.object_name for obj in objects]

    def list_batches(self) -> list[dict]:
        objects = self.client.list_objects(
            settings.minio_bucket_pharmacy, recursive=True
        )
        batches: dict[str, dict] = {}
        for obj in objects:
            parts = obj.object_name.split("/")
            if len(parts) >= 2:
                bid = parts[0]
                if bid not in batches:
                    batches[bid] = {
                        "batch_id": bid,
                        "last_modified": obj.last_modified,
                        "objects": [],
                    }
                batches[bid]["objects"].append(obj.object_name)
        return sorted(
            batches.values(), key=lambda x: x["batch_id"], reverse=True
        )

    def get_prescription_photo_url(self, object_key: str) -> bytes:
        response = self.client.get_object(
            settings.minio_bucket_prescription, object_key
        )
        data = response.read()
        response.close()
        response.release_conn()
        return data
