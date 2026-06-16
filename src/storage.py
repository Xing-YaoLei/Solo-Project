from minio import Minio
from minio.error import S3Error
import io
from typing import Optional, List, Dict, Any
import polars as pl
import json
import zipfile
import os
import hashlib
from datetime import datetime
from pathlib import Path

from config import config


class LocalStorageBackend:
    _base_dir: Path

    def __init__(self):
        self._base_dir = Path(config.DUCKDB_DATABASE).parent / "minio_local"
        self._base_dir.mkdir(parents=True, exist_ok=True)

    def _object_path(self, object_name: str) -> Path:
        p = self._base_dir / object_name
        p.parent.mkdir(parents=True, exist_ok=True)
        return p

    def upload_bytes(self, object_name: str, data: bytes, content_type: str = "application/octet-stream",
                     metadata: Optional[Dict[str, str]] = None) -> bool:
        try:
            p = self._object_path(object_name)
            p.write_bytes(data)
            if metadata:
                meta_path = p.with_suffix(p.suffix + ".meta.json")
                meta_path.write_text(json.dumps(metadata, ensure_ascii=False))
            return True
        except Exception:
            return False

    def download_bytes(self, object_name: str) -> Optional[bytes]:
        try:
            p = self._object_path(object_name)
            if p.exists():
                return p.read_bytes()
            return None
        except Exception:
            return None

    def delete_object(self, object_name: str):
        try:
            p = self._object_path(object_name)
            if p.exists():
                p.unlink()
            meta = p.with_suffix(p.suffix + ".meta.json")
            if meta.exists():
                meta.unlink()
        except Exception:
            pass

    def list_objects_detailed(self, prefix: str = "") -> List[Dict[str, Any]]:
        result = []
        search_dir = self._base_dir / prefix if prefix else self._base_dir
        if not search_dir.exists():
            return result
        for f in sorted(search_dir.rglob("*")):
            if f.is_file() and not f.name.endswith(".meta.json"):
                rel = f.relative_to(self._base_dir)
                stat = f.stat()
                result.append({
                    "object_name": str(rel),
                    "size_bytes": stat.st_size,
                    "last_modified": datetime.fromtimestamp(stat.st_mtime),
                    "etag": hashlib.md5(f.read_bytes()).hexdigest(),
                    "content_type": "application/zip" if f.suffix == ".zip" else "application/octet-stream"
                })
        result.sort(key=lambda x: x.get("last_modified") or datetime.min, reverse=True)
        return result

    def object_exists(self, object_name: str) -> bool:
        return self._object_path(object_name).exists()

    def get_object_info(self, object_name: str) -> Optional[Dict[str, Any]]:
        p = self._object_path(object_name)
        if not p.exists():
            return None
        stat = p.stat()
        return {
            "object_name": object_name,
            "size_bytes": stat.st_size,
            "last_modified": datetime.fromtimestamp(stat.st_mtime),
            "etag": hashlib.md5(p.read_bytes()).hexdigest(),
            "content_type": "application/zip" if p.suffix == ".zip" else "application/octet-stream",
            "metadata": {}
        }

    def get_bucket_stats(self) -> Dict[str, Any]:
        objects = self.list_objects_detailed()
        total_bytes = sum(o["size_bytes"] for o in objects)
        zip_count = sum(1 for o in objects if o["object_name"].endswith(".zip"))
        return {
            "total_objects": len(objects),
            "zip_archives": zip_count,
            "total_size_bytes": total_bytes,
            "total_size_mb": round(total_bytes / 1024 / 1024, 2),
            "bucket_name": "local-storage",
            "endpoint": "local-filesystem",
            "connected": True
        }


class MinIOManager:
    _instance: Optional["MinIOManager"] = None
    _client: Optional[Minio] = None
    _connection_ok: bool = False
    _local_backend: Optional[LocalStorageBackend] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            self._initialize_client()
        if self._local_backend is None:
            self._local_backend = LocalStorageBackend()

    def _initialize_client(self):
        try:
            self._client = Minio(
                endpoint=config.MINIO_ENDPOINT,
                access_key=config.MINIO_ACCESS_KEY,
                secret_key=config.MINIO_SECRET_KEY,
                secure=config.MINIO_SECURE
            )
            self._ensure_bucket()
            self._connection_ok = True
        except Exception:
            self._connection_ok = False

    def _use_local(self) -> bool:
        return not self.is_connected()

    def is_connected(self) -> bool:
        if not self._connection_ok:
            try:
                self._client.list_buckets()
                self._connection_ok = True
            except Exception:
                self._connection_ok = False
        return self._connection_ok

    def _ensure_bucket(self):
        try:
            if not self._client.bucket_exists(config.MINIO_BUCKET):
                self._client.make_bucket(config.MINIO_BUCKET)
        except S3Error:
            pass

    def upload_dataframe(self, object_name: str, df: pl.DataFrame, format: str = "parquet"):
        if format == "parquet":
            buffer = io.BytesIO()
            df.write_parquet(buffer)
            buffer.seek(0)
            self._client.put_object(
                bucket_name=config.MINIO_BUCKET,
                object_name=object_name,
                data=buffer,
                length=len(buffer.getvalue()),
                content_type="application/octet-stream"
            )
        elif format == "csv":
            buffer = io.BytesIO(df.write_csv().encode("utf-8"))
            self._client.put_object(
                bucket_name=config.MINIO_BUCKET,
                object_name=object_name,
                data=buffer,
                length=len(buffer.getvalue()),
                content_type="text/csv"
            )
        elif format == "json":
            buffer = io.BytesIO(json.dumps(df.to_dicts(), ensure_ascii=False, default=str).encode("utf-8"))
            self._client.put_object(
                bucket_name=config.MINIO_BUCKET,
                object_name=object_name,
                data=buffer,
                length=len(buffer.getvalue()),
                content_type="application/json"
            )

    def download_dataframe(self, object_name: str, format: str = "parquet") -> Optional[pl.DataFrame]:
        try:
            response = self._client.get_object(
                bucket_name=config.MINIO_BUCKET,
                object_name=object_name
            )
            data = io.BytesIO(response.read())
            if format == "parquet":
                return pl.read_parquet(data)
            elif format == "csv":
                return pl.read_csv(data)
            elif format == "json":
                return pl.read_json(data)
        except S3Error:
            return None
        finally:
            try:
                response.close()
                response.release_conn()
            except:
                pass

    def list_objects(self, prefix: str = "") -> List[str]:
        if self._use_local():
            return [o["object_name"] for o in self._local_backend.list_objects_detailed(prefix)]
        try:
            objects = self._client.list_objects(config.MINIO_BUCKET, prefix=prefix, recursive=True)
            return [obj.object_name for obj in objects]
        except S3Error:
            return []

    def list_objects_detailed(self, prefix: str = "") -> List[Dict[str, Any]]:
        if self._use_local():
            return self._local_backend.list_objects_detailed(prefix)
        try:
            objects = self._client.list_objects(config.MINIO_BUCKET, prefix=prefix, recursive=True)
            result = []
            for obj in objects:
                result.append({
                    "object_name": obj.object_name,
                    "size_bytes": obj.size or 0,
                    "last_modified": obj.last_modified,
                    "etag": obj.etag.replace('"', '') if obj.etag else "",
                    "content_type": getattr(obj, "content_type", "")
                })
            result.sort(key=lambda x: x.get("last_modified") or datetime.min, reverse=True)
            return result
        except S3Error:
            return []

    def delete_object(self, object_name: str):
        if self._use_local():
            self._local_backend.delete_object(object_name)
            return
        try:
            self._client.remove_object(config.MINIO_BUCKET, object_name)
        except S3Error:
            pass

    def delete_objects(self, object_names: List[str]):
        for name in object_names:
            self.delete_object(name)

    def upload_bytes(self, object_name: str, data: bytes, content_type: str = "application/octet-stream",
                     metadata: Optional[Dict[str, str]] = None) -> bool:
        if self._use_local():
            return self._local_backend.upload_bytes(object_name, data, content_type, metadata)
        try:
            buffer = io.BytesIO(data)
            self._client.put_object(
                bucket_name=config.MINIO_BUCKET,
                object_name=object_name,
                data=buffer,
                length=len(data),
                content_type=content_type,
                metadata=metadata
            )
            return True
        except Exception:
            return False

    def download_bytes(self, object_name: str) -> Optional[bytes]:
        if self._use_local():
            return self._local_backend.download_bytes(object_name)
        try:
            response = self._client.get_object(
                bucket_name=config.MINIO_BUCKET,
                object_name=object_name
            )
            return response.read()
        except S3Error:
            return None
        finally:
            try:
                response.close()
                response.release_conn()
            except:
                pass

    def object_exists(self, object_name: str) -> bool:
        if self._use_local():
            return self._local_backend.object_exists(object_name)
        try:
            self._client.stat_object(config.MINIO_BUCKET, object_name)
            return True
        except S3Error:
            return False

    def get_object_info(self, object_name: str) -> Optional[Dict[str, Any]]:
        if self._use_local():
            return self._local_backend.get_object_info(object_name)
        try:
            stat = self._client.stat_object(config.MINIO_BUCKET, object_name)
            return {
                "object_name": object_name,
                "size_bytes": stat.size or 0,
                "last_modified": stat.last_modified,
                "etag": stat.etag.replace('"', '') if stat.etag else "",
                "content_type": stat.content_type,
                "metadata": {k.replace("x-amz-meta-", ""): v for k, v in (stat.metadata or {}).items()
                             if k.startswith("x-amz-meta-")}
            }
        except S3Error:
            return None

    def upload_zip_from_files(self, object_name: str, files: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
                for name, data in files.items():
                    if isinstance(data, str):
                        data = data.encode("utf-8")
                    zf.writestr(name, data)
            zip_bytes = zip_buffer.getvalue()
            size_bytes = len(zip_bytes)
            success = self.upload_bytes(object_name, zip_bytes, content_type="application/zip")
            if success:
                return {
                    "object_name": object_name,
                    "size_bytes": size_bytes,
                    "file_count": len(files)
                }
            return None
        except Exception:
            return None

    def download_zip(self, object_name: str) -> Optional[bytes]:
        return self.download_bytes(object_name)

    def get_bucket_stats(self) -> Dict[str, Any]:
        if self._use_local():
            stats = self._local_backend.get_bucket_stats()
            stats["endpoint"] = "local-filesystem (MinIO 未连接，自动降级)"
            return stats
        try:
            objects = self.list_objects_detailed()
            total_bytes = sum(o["size_bytes"] for o in objects)
            zip_objects = [o for o in objects if o["object_name"].endswith(".zip")]
            return {
                "total_objects": len(objects),
                "zip_archives": len(zip_objects),
                "total_size_bytes": total_bytes,
                "total_size_mb": round(total_bytes / 1024 / 1024, 2),
                "bucket_name": config.MINIO_BUCKET,
                "endpoint": config.MINIO_ENDPOINT,
                "connected": True
            }
        except Exception:
            return {
                "total_objects": 0,
                "zip_archives": 0,
                "total_size_bytes": 0,
                "total_size_mb": 0,
                "bucket_name": config.MINIO_BUCKET,
                "endpoint": config.MINIO_ENDPOINT,
                "connected": False
            }

    def generate_archive_path(self, export_type: str, date_from: str, date_to: str) -> str:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        type_map = {
            "风险趋势": "risk_trend",
            "患者明细": "patient_details",
            "医保拒付": "insurance_denials",
            "异常汇总": "anomaly_summary",
            "治疗日历": "treatment_calendar",
            "器械状态": "device_status",
            "护理日志": "nursing_logs",
            "复盘备注": "review_notes"
        }
        prefix = type_map.get(export_type, "export")
        safe_from = str(date_from).replace("-", "")
        safe_to = str(date_to).replace("-", "")
        return f"exports/{prefix}/{safe_from}_{safe_to}/{prefix}_{ts}.zip"

    def get_storage_mode(self) -> str:
        if self.is_connected():
            return "minio"
        return "local"


def get_minio() -> MinIOManager:
    return MinIOManager()
