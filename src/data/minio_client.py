"""
MinIO 数据接入模块：负责与对象存储交互，上传和读取数据文件
"""
import io
import logging
from typing import Optional, List, BinaryIO
from minio import Minio
from minio.error import S3Error
from src.config import config

logger = logging.getLogger(__name__)


class MinIOClient:
    """MinIO 客户端封装类"""

    def __init__(self):
        self._client: Optional[Minio] = None
        self._connected = False

    @property
    def client(self) -> Minio:
        if not self._connected:
            self._connect()
        return self._client

    def _connect(self) -> None:
        """建立与 MinIO 的连接"""
        try:
            self._client = Minio(
                endpoint=config.minio.endpoint,
                access_key=config.minio.access_key,
                secret_key=config.minio.secret_key,
                secure=config.minio.secure,
            )
            self._ensure_bucket()
            self._connected = True
            logger.info("MinIO 连接成功，Bucket: %s", config.minio.bucket_name)
        except S3Error as e:
            logger.error("MinIO 连接失败: %s", e)
            raise

    def _ensure_bucket(self) -> None:
        """确保存储桶存在，不存在则创建"""
        bucket_name = config.minio.bucket_name
        if not self._client.bucket_exists(bucket_name):
            self._client.make_bucket(bucket_name)
            logger.info("创建存储桶: %s", bucket_name)

    def upload_bytes(self, object_name: str, data: bytes, content_type: str = "application/octet-stream") -> None:
        """上传字节数据到 MinIO"""
        try:
            stream = io.BytesIO(data)
            self.client.put_object(
                bucket_name=config.minio.bucket_name,
                object_name=object_name,
                data=stream,
                length=len(data),
                content_type=content_type,
            )
            logger.info("上传成功: %s", object_name)
        except S3Error as e:
            logger.error("上传失败 %s: %s", object_name, e)
            raise

    def upload_file(self, file_path: str, object_name: str) -> None:
        """上传本地文件到 MinIO"""
        try:
            self.client.fput_object(
                bucket_name=config.minio.bucket_name,
                object_name=object_name,
                file_path=file_path,
            )
            logger.info("文件上传成功: %s -> %s", file_path, object_name)
        except S3Error as e:
            logger.error("文件上传失败: %s", e)
            raise

    def download_bytes(self, object_name: str) -> bytes:
        """从 MinIO 下载对象为字节数据"""
        try:
            response = self.client.get_object(
                bucket_name=config.minio.bucket_name,
                object_name=object_name,
            )
            data = response.read()
            response.close()
            response.release_conn()
            logger.info("下载成功: %s (%d bytes)", object_name, len(data))
            return data
        except S3Error as e:
            logger.error("下载失败 %s: %s", object_name, e)
            raise

    def download_to_file(self, object_name: str, file_path: str) -> None:
        """从 MinIO 下载对象到本地文件"""
        try:
            self.client.fget_object(
                bucket_name=config.minio.bucket_name,
                object_name=object_name,
                file_path=file_path,
            )
            logger.info("文件下载成功: %s -> %s", object_name, file_path)
        except S3Error as e:
            logger.error("文件下载失败: %s", e)
            raise

    def list_objects(self, prefix: str = "") -> List[str]:
        """列出指定前缀下的所有对象"""
        try:
            objects = self.client.list_objects(
                bucket_name=config.minio.bucket_name,
                prefix=prefix,
                recursive=True,
            )
            object_names = [obj.object_name for obj in objects]
            logger.info("列出 %d 个对象 (前缀: %s)", len(object_names), prefix)
            return object_names
        except S3Error as e:
            logger.error("列出对象失败: %s", e)
            raise

    def object_exists(self, object_name: str) -> bool:
        """检查对象是否存在"""
        try:
            self.client.stat_object(
                bucket_name=config.minio.bucket_name,
                object_name=object_name,
            )
            return True
        except S3Error as e:
            if e.code == "NoSuchKey":
                return False
            logger.error("检查对象存在失败: %s", e)
            raise

    def delete_object(self, object_name: str) -> None:
        """删除对象"""
        try:
            self.client.remove_object(
                bucket_name=config.minio.bucket_name,
                object_name=object_name,
            )
            logger.info("删除成功: %s", object_name)
        except S3Error as e:
            logger.error("删除失败 %s: %s", object_name, e)
            raise


minio_client = MinIOClient()
