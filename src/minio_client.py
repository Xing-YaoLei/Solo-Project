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
        """列出存储桶中的文件路径"""
        if not self.available:
            return []
        try:
            objects = self.client.list_objects(Config.MINIO_BUCKET, prefix=prefix, recursive=True)
            return [obj.object_name for obj in objects]
        except Exception as e:
            print(f"列出文件失败: {e}")
            return []

    def list_files_with_details(self, prefix: str = "") -> list:
        """列出存储桶中的文件及详细信息

        Returns:
            list of dict: [{
                'object_name': str,
                'size': int (bytes),
                'last_modified': datetime,
                'content_type': str
            }]
        """
        if not self.available:
            return []
        try:
            objects = self.client.list_objects(
                Config.MINIO_BUCKET,
                prefix=prefix,
                recursive=True
            )
            result = []
            for obj in objects:
                result.append({
                    'object_name': obj.object_name,
                    'size': obj.size if hasattr(obj, 'size') and obj.size else 0,
                    'last_modified': obj.last_modified if hasattr(obj, 'last_modified') else None,
                    'content_type': obj.content_type if hasattr(obj, 'content_type') else None
                })
            return result
        except Exception as e:
            print(f"列出文件详情失败: {e}")
            return []

    def get_bucket_stats(self, prefix: str = "") -> dict:
        """获取存储桶统计信息

        Returns:
            dict: {
                'total_files': int,
                'total_size': int (bytes),
                'prefix': str
            }
        """
        if not self.available:
            return {'total_files': 0, 'total_size': 0, 'prefix': prefix}
        try:
            objects = self.client.list_objects(
                Config.MINIO_BUCKET,
                prefix=prefix,
                recursive=True
            )
            total_files = 0
            total_size = 0
            for obj in objects:
                total_files += 1
                total_size += obj.size if hasattr(obj, 'size') and obj.size else 0
            return {
                'total_files': total_files,
                'total_size': total_size,
                'prefix': prefix
            }
        except Exception as e:
            print(f"获取存储桶统计失败: {e}")
            return {'total_files': 0, 'total_size': 0, 'prefix': prefix}

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
