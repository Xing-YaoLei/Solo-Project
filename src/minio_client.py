"""
MinIO对象存储集成模块
用于管理影像附件等文件存储
"""
from minio import Minio
from minio.error import S3Error
from io import BytesIO
from src.config import Config


class MinioClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_client()
        return cls._instance

    def _init_client(self):
        """初始化MinIO客户端"""
        try:
            self.client = Minio(
                Config.MINIO_ENDPOINT,
                access_key=Config.MINIO_ACCESS_KEY,
                secret_key=Config.MINIO_SECRET_KEY,
                secure=Config.MINIO_SECURE
            )
            self._ensure_bucket()
            self.available = True
        except Exception as e:
            print(f"MinIO连接失败: {e}")
            self.client = None
            self.available = False

    def _ensure_bucket(self):
        """确保存储桶存在"""
        try:
            if not self.client.bucket_exists(Config.MINIO_BUCKET):
                self.client.make_bucket(Config.MINIO_BUCKET)
        except S3Error as e:
            print(f"创建存储桶失败: {e}")

    def upload_file(self, object_name: str, file_data: bytes, content_type: str = "application/octet-stream") -> bool:
        """上传文件到MinIO"""
        if not self.available:
            return False
        try:
            self.client.put_object(
                Config.MINIO_BUCKET,
                object_name,
                BytesIO(file_data),
                len(file_data),
                content_type=content_type
            )
            return True
        except Exception as e:
            print(f"上传文件失败: {e}")
            return False

    def download_file(self, object_name: str) -> bytes:
        """从MinIO下载文件"""
        if not self.available:
            return None
        try:
            response = self.client.get_object(Config.MINIO_BUCKET, object_name)
            data = response.read()
            response.close()
            return data
        except Exception as e:
            print(f"下载文件失败: {e}")
            return None

    def list_files(self, prefix: str = "") -> list:
        """列出存储桶中的文件"""
        if not self.available:
            return []
        try:
            objects = self.client.list_objects(Config.MINIO_BUCKET, prefix=prefix, recursive=True)
            return [obj.object_name for obj in objects]
        except Exception as e:
            print(f"列出文件失败: {e}")
            return []

    def delete_file(self, object_name: str) -> bool:
        """删除文件"""
        if not self.available:
            return False
        try:
            self.client.remove_object(Config.MINIO_BUCKET, object_name)
            return True
        except Exception as e:
            print(f"删除文件失败: {e}")
            return False

    def get_file_url(self, object_name: str, expires: int = 3600) -> str:
        """获取文件的预签名URL"""
        if not self.available:
            return None
        try:
            return self.client.presigned_get_object(
                Config.MINIO_BUCKET,
                object_name,
                expires=expires
            )
        except Exception as e:
            print(f"获取文件URL失败: {e}")
            return None


def get_minio_client() -> MinioClient:
    """获取MinIO客户端单例"""
    return MinioClient()
