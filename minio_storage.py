import json
import io
from datetime import datetime
from minio import Minio
from minio.error import S3Error
import polars as pl
from config import settings

class MinioManager:
    def __init__(self):
        try:
            self.client = Minio(
                settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=settings.MINIO_SECURE
            )
            self._ensure_bucket()
            self.available = True
        except Exception as e:
            print(f"MinIO 连接失败，将使用本地存储: {e}")
            self.available = False
            self.local_storage_dir = settings.DATA_DIR + "/minio_local"
            import os
            os.makedirs(self.local_storage_dir, exist_ok=True)

    def _ensure_bucket(self):
        if not self.client.bucket_exists(settings.MINIO_BUCKET_NAME):
            self.client.make_bucket(settings.MINIO_BUCKET_NAME)

    def save_data_version(self, table_name: str, record_id: str, data: dict, 
                          version: int, change_reason: str = None):
        object_name = f"versions/{table_name}/{record_id}/v{version}_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
        payload = {
            "table_name": table_name,
            "record_id": record_id,
            "version": version,
            "snapshot": data,
            "change_reason": change_reason,
            "timestamp": datetime.now().isoformat()
        }
        json_bytes = json.dumps(payload, ensure_ascii=False, default=str).encode('utf-8')
        
        if self.available:
            try:
                self.client.put_object(
                    settings.MINIO_BUCKET_NAME,
                    object_name,
                    io.BytesIO(json_bytes),
                    length=len(json_bytes),
                    content_type='application/json'
                )
                return True
            except S3Error as e:
                print(f"MinIO 存储失败: {e}")
                return self._save_local(object_name, json_bytes)
        else:
            return self._save_local(object_name, json_bytes)

    def _save_local(self, object_name: str, data: bytes) -> bool:
        try:
            import os
            full_path = os.path.join(self.local_storage_dir, object_name)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'wb') as f:
                f.write(data)
            return True
        except Exception as e:
            print(f"本地存储失败: {e}")
            return False

    def get_data_versions(self, table_name: str, record_id: str) -> list:
        prefix = f"versions/{table_name}/{record_id}/"
        versions = []
        
        if self.available:
            try:
                for obj in self.client.list_objects(settings.MINIO_BUCKET_NAME, prefix=prefix):
                    response = self.client.get_object(settings.MINIO_BUCKET_NAME, obj.object_name)
                    data = json.loads(response.read().decode('utf-8'))
                    versions.append(data)
            except S3Error as e:
                print(f"MinIO 读取失败: {e}")
                versions = self._get_local_versions(prefix)
        else:
            versions = self._get_local_versions(prefix)
        
        return sorted(versions, key=lambda x: x.get('version', 0))

    def _get_local_versions(self, prefix: str) -> list:
        import os
        versions = []
        full_dir = os.path.join(self.local_storage_dir, prefix)
        if not os.path.exists(full_dir):
            return versions
        for filename in sorted(os.listdir(full_dir)):
            if filename.endswith('.json'):
                with open(os.path.join(full_dir, filename), 'r', encoding='utf-8') as f:
                    versions.append(json.load(f))
        return versions

    def export_parquet_to_minio(self, df: pl.DataFrame, name: str) -> bool:
        object_name = f"exports/{name}_{datetime.now().strftime('%Y%m%d%H%M%S')}.parquet"
        buf = io.BytesIO()
        df.write_parquet(buf)
        buf.seek(0)
        parquet_bytes = buf.getvalue()
        
        if self.available:
            try:
                self.client.put_object(
                    settings.MINIO_BUCKET_NAME,
                    object_name,
                    io.BytesIO(parquet_bytes),
                    length=len(parquet_bytes),
                    content_type='application/octet-stream'
                )
                return True
            except S3Error as e:
                print(f"MinIO 导出失败: {e}")
                return self._save_local(object_name, parquet_bytes)
        else:
            return self._save_local(object_name, parquet_bytes)

minio_mgr = MinioManager()
