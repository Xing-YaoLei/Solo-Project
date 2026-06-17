import io
import json
import polars as pl
from typing import Optional, List, Dict, Any
from minio import Minio
from minio.error import S3Error
from datetime import datetime
import logging

from config import config

logger = logging.getLogger(__name__)


class MinIOClient:
    def __init__(self):
        self.client = Minio(
            endpoint=config.minio.endpoint,
            access_key=config.minio.access_key,
            secret_key=config.minio.secret_key,
            secure=config.minio.secure
        )
        self.bucket = config.minio.bucket
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
                logger.info(f"Created bucket: {self.bucket}")
        except Exception as e:
            logger.warning(f"MinIO connection failed: {e}. Using local fallback.")

    def upload_file(self, object_name: str, file_path: str) -> bool:
        try:
            self.client.fput_object(self.bucket, object_name, file_path)
            logger.info(f"Uploaded {file_path} to {object_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to upload {file_path}: {e}")
            return False

    def upload_dataframe(self, df: pl.DataFrame, object_name: str) -> bool:
        try:
            csv_data = df.write_csv()
            csv_bytes = csv_data.encode('utf-8')
            self.client.put_object(
                self.bucket,
                object_name,
                io.BytesIO(csv_bytes),
                length=len(csv_bytes),
                content_type='text/csv'
            )
            logger.info(f"Uploaded DataFrame to {object_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to upload DataFrame: {e}")
            return False

    def download_file(self, object_name: str, file_path: str) -> bool:
        try:
            self.client.fget_object(self.bucket, object_name, file_path)
            logger.info(f"Downloaded {object_name} to {file_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to download {object_name}: {e}")
            return False

    def download_dataframe(self, object_name: str) -> Optional[pl.DataFrame]:
        try:
            response = self.client.get_object(self.bucket, object_name)
            csv_data = response.read().decode('utf-8')
            df = pl.read_csv(io.StringIO(csv_data))
            logger.info(f"Downloaded DataFrame from {object_name}")
            return df
        except Exception as e:
            logger.error(f"Failed to download DataFrame: {e}")
            return None

    def list_objects(self, prefix: str = "") -> List[str]:
        try:
            objects = self.client.list_objects(self.bucket, prefix=prefix, recursive=True)
            return [obj.object_name for obj in objects]
        except Exception as e:
            logger.error(f"Failed to list objects: {e}")
            return []

    def delete_object(self, object_name: str) -> bool:
        try:
            self.client.remove_object(self.bucket, object_name)
            logger.info(f"Deleted {object_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete {object_name}: {e}")
            return False

    def save_json(self, data: Dict[str, Any], object_name: str) -> bool:
        try:
            json_str = json.dumps(data, ensure_ascii=False, default=str)
            json_bytes = json_str.encode('utf-8')
            self.client.put_object(
                self.bucket,
                object_name,
                io.BytesIO(json_bytes),
                length=len(json_bytes),
                content_type='application/json'
            )
            logger.info(f"Saved JSON to {object_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to save JSON: {e}")
            return False

    def load_json(self, object_name: str) -> Optional[Dict[str, Any]]:
        try:
            response = self.client.get_object(self.bucket, object_name)
            json_data = json.loads(response.read().decode('utf-8'))
            logger.info(f"Loaded JSON from {object_name}")
            return json_data
        except Exception as e:
            logger.error(f"Failed to load JSON: {e}")
            return None

    def upload_bytes(self, data: bytes, object_name: str, 
                     content_type: str = 'application/octet-stream') -> Optional[str]:
        try:
            self.client.put_object(
                self.bucket,
                object_name,
                io.BytesIO(data),
                length=len(data),
                content_type=content_type
            )
            url = f"{self.client._base_url}/{self.bucket}/{object_name}"
            logger.info(f"Uploaded {len(data)} bytes to {object_name}")
            return url
        except Exception as e:
            logger.error(f"Failed to upload bytes: {e}")
            return None
    
    def upload_report(self, report_data: bytes, report_type: str, 
                     start_date: str, end_date: str) -> Optional[Dict[str, Any]]:
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            object_name = f"reports/{report_type}/{start_date}_{end_date}/{report_type}_{timestamp}.xlsx"
            
            url = self.upload_bytes(
                report_data,
                object_name,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            
            if url:
                metadata = {
                    "object_name": object_name,
                    "report_type": report_type,
                    "start_date": start_date,
                    "end_date": end_date,
                    "created_at": datetime.now().isoformat(),
                    "size_bytes": len(report_data),
                    "url": url
                }
                
                meta_object = f"reports/{report_type}/{start_date}_{end_date}/metadata_{timestamp}.json"
                self.save_json(metadata, meta_object)
                
                return metadata
            return None
        except Exception as e:
            logger.error(f"Failed to upload report: {e}")
            return None
    
    def list_reports(self, report_type: str = "") -> List[Dict[str, Any]]:
        try:
            prefix = f"reports/{report_type}" if report_type else "reports/"
            objects = self.list_objects(prefix)
            reports = []
            
            for obj in objects:
                if obj.endswith('.json') and 'metadata' in obj:
                    meta = self.load_json(obj)
                    if meta:
                        reports.append(meta)
            
            reports.sort(key=lambda x: x.get('created_at', ''), reverse=True)
            return reports
        except Exception as e:
            logger.error(f"Failed to list reports: {e}")
            return []

    def is_available(self) -> bool:
        try:
            self.client.bucket_exists(self.bucket)
            return True
        except Exception:
            return False
