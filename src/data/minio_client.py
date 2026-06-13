"""
MinIO 数据接入模块：负责与对象存储交互，上传和读取数据文件

当 MinIO 服务不可用时，所有方法均会优雅降级（不抛出异常，仅记录日志并返回空值/False），
以确保上层数据入库流程不会因对象存储问题被中断。
"""
import io
import logging
from typing import Optional, List, BinaryIO

from src.config import config

logger = logging.getLogger(__name__)

try:
    from minio import Minio
    from minio.error import S3Error
    _MINIO_AVAILABLE = True
except ImportError:
    Minio = None
    S3Error = Exception
    _MINIO_AVAILABLE = False
    logger.warning("minio 包未安装，MinIO 功能将不可用")


class MinIOClient:
    """MinIO 客户端封装类 - 带连接检测和优雅降级"""

    def __init__(self):
        self._client: Optional["Minio"] = None
        self._connected = False
        self._last_connect_error: Optional[str] = None

    def is_available(self) -> bool:
        """检测 MinIO 是否可用（包已安装且能连接）"""
        if not _MINIO_AVAILABLE:
            return False
        if self._connected:
            return True
        try:
            self._connect()
            return self._connected
        except Exception:
            return False

    @property
    def client(self):
        if not self._connected:
            self._connect()
        if self._client is None:
            raise ConnectionError(
                f"MinIO 不可用: {self._last_connect_error or '未知错误'}"
            )
        return self._client

    def _connect(self) -> None:
        """建立与 MinIO 的连接；失败时记录错误但不抛出"""
        if not _MINIO_AVAILABLE:
            self._last_connect_error = "minio Python 包未安装"
            self._connected = False
            return
        try:
            self._client = Minio(
                endpoint=config.minio.endpoint,
                access_key=config.minio.access_key,
                secret_key=config.minio.secret_key,
                secure=config.minio.secure,
            )
            self._ensure_bucket()
            self._connected = True
            self._last_connect_error = None
            logger.info("MinIO 连接成功，Bucket: %s", config.minio.bucket_name)
        except Exception as e:
            self._connected = False
            self._client = None
            self._last_connect_error = str(e)
            logger.warning("MinIO 连接失败，将降级为仅本地入库: %s", e)

    def _ensure_bucket(self) -> None:
        """确保存储桶存在，不存在则创建"""
        if self._client is None:
            return
        bucket_name = config.minio.bucket_name
        try:
            if not self._client.bucket_exists(bucket_name):
                self._client.make_bucket(bucket_name)
                logger.info("创建存储桶: %s", bucket_name)
        except Exception as e:
            logger.warning("检查/创建 Bucket 失败: %s", e)
            raise

    def upload_bytes(self, object_name: str, data: bytes, content_type: str = "application/octet-stream") -> bool:
        """上传字节数据到 MinIO

        Returns:
            True 上传成功；False 上传失败（已记录日志）
        """
        if not self.is_available():
            logger.warning("MinIO 不可用，跳过上传: %s", object_name)
            return False
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
            return True
        except Exception as e:
            logger.warning("上传 MinIO 失败 %s: %s", object_name, e)
            return False

    def upload_file(self, file_path: str, object_name: str) -> bool:
        """上传本地文件到 MinIO"""
        if not self.is_available():
            logger.warning("MinIO 不可用，跳过上传文件: %s", file_path)
            return False
        try:
            self.client.fput_object(
                bucket_name=config.minio.bucket_name,
                object_name=object_name,
                file_path=file_path,
            )
            logger.info("文件上传成功: %s -> %s", file_path, object_name)
            return True
        except Exception as e:
            logger.warning("文件上传 MinIO 失败: %s", e)
            return False

    def download_bytes(self, object_name: str) -> Optional[bytes]:
        """从 MinIO 下载对象为字节数据；失败返回 None"""
        if not self.is_available():
            logger.warning("MinIO 不可用，无法下载: %s", object_name)
            return None
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
        except Exception as e:
            logger.warning("从 MinIO 下载失败 %s: %s", object_name, e)
            return None

    def download_to_file(self, object_name: str, file_path: str) -> bool:
        """从 MinIO 下载对象到本地文件"""
        if not self.is_available():
            logger.warning("MinIO 不可用，无法下载文件: %s", object_name)
            return False
        try:
            self.client.fget_object(
                bucket_name=config.minio.bucket_name,
                object_name=object_name,
                file_path=file_path,
            )
            logger.info("文件下载成功: %s -> %s", object_name, file_path)
            return True
        except Exception as e:
            logger.warning("从 MinIO 下载文件失败: %s", e)
            return False

    def list_objects(self, prefix: str = "") -> List[str]:
        """列出指定前缀下的所有对象；失败返回空列表"""
        if not self.is_available():
            logger.warning("MinIO 不可用，无法列出对象")
            return []
        try:
            objects = self.client.list_objects(
                bucket_name=config.minio.bucket_name,
                prefix=prefix,
                recursive=True,
            )
            object_names = [obj.object_name for obj in objects]
            logger.info("列出 %d 个对象 (前缀: %s)", len(object_names), prefix)
            return object_names
        except Exception as e:
            logger.warning("列出 MinIO 对象失败: %s", e)
            return []

    def object_exists(self, object_name: str) -> bool:
        """检查对象是否存在"""
        if not self.is_available():
            return False
        try:
            self.client.stat_object(
                bucket_name=config.minio.bucket_name,
                object_name=object_name,
            )
            return True
        except Exception as e:
            try:
                if hasattr(e, "code") and e.code == "NoSuchKey":
                    return False
            except Exception:
                pass
            logger.warning("检查对象存在失败: %s", e)
            return False

    def delete_object(self, object_name: str) -> bool:
        """删除对象"""
        if not self.is_available():
            logger.warning("MinIO 不可用，无法删除: %s", object_name)
            return False
        try:
            self.client.remove_object(
                bucket_name=config.minio.bucket_name,
                object_name=object_name,
            )
            logger.info("删除成功: %s", object_name)
            return True
        except Exception as e:
            logger.warning("从 MinIO 删除失败 %s: %s", object_name, e)
            return False


minio_client = MinIOClient()
