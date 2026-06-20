import boto3
from botocore.client import Config as BotoConfig
from src.utils.config import Config as AppConfig


class MinIOClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_client()
        return cls._instance

    def _init_client(self):
        self.connected = False
        try:
            self.s3 = boto3.client(
                "s3",
                endpoint_url=f"{'https' if AppConfig.MINIO_SECURE else 'http'}://{AppConfig.MINIO_ENDPOINT}",
                aws_access_key_id=AppConfig.MINIO_ACCESS_KEY,
                aws_secret_access_key=AppConfig.MINIO_SECRET_KEY,
                config=BotoConfig(signature_version="s3v4"),
                region_name="us-east-1",
            )
            self.bucket = AppConfig.MINIO_BUCKET
            self.connected = True
        except Exception:
            self.s3 = None
            self.bucket = AppConfig.MINIO_BUCKET

    def list_objects(self, prefix=""):
        if not self.connected:
            return []
        try:
            response = self.s3.list_objects_v2(Bucket=self.bucket, Prefix=prefix)
            return [obj["Key"] for obj in response.get("Contents", [])]
        except Exception:
            return []

    def download_file(self, key, local_path):
        if not self.connected:
            raise ConnectionError("MinIO not connected")
        self.s3.download_file(self.bucket, key, local_path)
        return local_path

    def upload_file(self, local_path, key):
        if not self.connected:
            raise ConnectionError("MinIO not connected")
        self.s3.upload_file(local_path, self.bucket, key)
        return key

    def ensure_bucket(self):
        if not self.connected:
            return False
        try:
            self.s3.head_bucket(Bucket=self.bucket)
        except Exception:
            self.s3.create_bucket(Bucket=self.bucket)
        return True

    def bucket_exists(self):
        if not self.connected:
            return False
        try:
            self.s3.head_bucket(Bucket=self.bucket)
            return True
        except Exception:
            return False
