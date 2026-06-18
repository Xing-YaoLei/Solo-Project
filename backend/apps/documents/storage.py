from django.conf import settings
from minio import Minio
from minio.error import S3Error
import io
import uuid
from datetime import timedelta


class MinIOStorage:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_client()
        return cls._instance

    def _init_client(self):
        config = settings.MINIO_CONFIG
        self.client = Minio(
            config['endpoint'],
            access_key=config['access_key'],
            secret_key=config['secret_key'],
            secure=config['secure']
        )
        self.bucket = config['bucket']
        self._ensure_bucket()

    def _ensure_bucket(self):
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
        except S3Error:
            pass

    def _generate_path(self, vehicle_id, category, filename):
        ext = filename.split('.')[-1].lower() if '.' in filename else 'bin'
        unique_name = f'{uuid.uuid4().hex}.{ext}'
        return f'vehicles/{vehicle_id}/{category}/{unique_name}'

    def upload(self, file_obj, vehicle_id, category, filename, content_type='application/octet-stream'):
        object_path = self._generate_path(vehicle_id, category, filename)
        if isinstance(file_obj, (bytes, bytearray)):
            data = io.BytesIO(file_obj)
            length = len(file_obj)
        else:
            file_obj.seek(0)
            data = file_obj
            length = file_obj.size if hasattr(file_obj, 'size') else len(file_obj.read())
            file_obj.seek(0)

        self.client.put_object(
            self.bucket,
            object_path,
            data,
            length,
            content_type=content_type
        )
        return object_path

    def get_url(self, object_path, expires_days=7):
        return self.client.presigned_get_object(
            self.bucket,
            object_path,
            expires=timedelta(days=expires_days)
        )

    def delete(self, object_path):
        try:
            self.client.remove_object(self.bucket, object_path)
            return True
        except S3Error:
            return False

    def stat(self, object_path):
        try:
            return self.client.stat_object(self.bucket, object_path)
        except S3Error:
            return None


storage = MinIOStorage()
