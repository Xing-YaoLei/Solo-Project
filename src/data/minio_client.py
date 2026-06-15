from minio import Minio
from minio.error import S3Error
from typing import Optional, Dict, List
import io
import json
from config import settings, setup_logger

logger = setup_logger()


class MinioClient:
    _instance = None
    _client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            self._connect()

    def _connect(self):
        try:
            self._client = Minio(
                endpoint=settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=settings.MINIO_SECURE
            )
            self._ensure_bucket()
            logger.info(f"成功连接到MinIO: {settings.MINIO_ENDPOINT}")
        except Exception as e:
            logger.warning(f"连接MinIO失败: {e}，将使用本地存储")
            self._client = None

    def _ensure_bucket(self):
        if self._client and not self._client.bucket_exists(settings.MINIO_BUCKET):
            self._client.make_bucket(settings.MINIO_BUCKET)
            logger.info(f"创建存储桶: {settings.MINIO_BUCKET}")

    def is_connected(self) -> bool:
        return self._client is not None

    def upload_file(
        self,
        file_data: bytes,
        file_name: str,
        metadata: Optional[Dict] = None,
        folder: str = "exports"
    ) -> Optional[str]:
        object_name = f"{folder}/{file_name}"

        if self.is_connected():
            try:
                self._client.put_object(
                    bucket_name=settings.MINIO_BUCKET,
                    object_name=object_name,
                    data=io.BytesIO(file_data),
                    length=len(file_data),
                    metadata=metadata
                )
                logger.info(f"文件已上传到MinIO: {object_name}")
                return f"minio://{settings.MINIO_BUCKET}/{object_name}"
            except S3Error as e:
                logger.error(f"上传到MinIO失败: {e}")
                return self._save_local(file_data, file_name, metadata)
        else:
            return self._save_local(file_data, file_name, metadata)

    def _save_local(
        self,
        file_data: bytes,
        file_name: str,
        metadata: Optional[Dict] = None
    ) -> str:
        import os
        local_dir = "./exports"
        os.makedirs(local_dir, exist_ok=True)

        file_path = f"{local_dir}/{file_name}"
        with open(file_path, "wb") as f:
            f.write(file_data)

        if metadata:
            meta_path = f"{file_path}.meta.json"
            with open(meta_path, "w", encoding="utf-8") as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)

        logger.info(f"文件已保存到本地: {file_path}")
        return file_path

    def download_file(self, object_name: str) -> Optional[bytes]:
        if self.is_connected():
            try:
                response = self._client.get_object(
                    bucket_name=settings.MINIO_BUCKET,
                    object_name=object_name
                )
                data = response.read()
                response.close()
                return data
            except S3Error as e:
                logger.error(f"从MinIO下载失败: {e}")
                return None
        else:
            try:
                with open(object_name, "rb") as f:
                    return f.read()
            except FileNotFoundError:
                logger.error(f"本地文件不存在: {object_name}")
                return None

    def list_files(self, prefix: str = "") -> List[Dict]:
        if self.is_connected():
            try:
                objects = self._client.list_objects(
                    bucket_name=settings.MINIO_BUCKET,
                    prefix=prefix,
                    recursive=True
                )
                return [
                    {
                        "name": obj.object_name,
                        "size": obj.size,
                        "last_modified": obj.last_modified,
                    }
                    for obj in objects
                ]
            except S3Error as e:
                logger.error(f"列出MinIO文件失败: {e}")
                return []
        else:
            import os
            local_dir = "./exports"
            if not os.path.exists(local_dir):
                return []
            files = []
            for root, _, filenames in os.walk(local_dir):
                for filename in filenames:
                    if not filename.endswith(".meta.json"):
                        filepath = os.path.join(root, filename)
                        stat = os.stat(filepath)
                        files.append({
                            "name": filepath,
                            "size": stat.st_size,
                            "last_modified": stat.st_mtime,
                        })
            return files

    def delete_file(self, object_name: str) -> bool:
        if self.is_connected():
            try:
                self._client.remove_object(
                    bucket_name=settings.MINIO_BUCKET,
                    object_name=object_name
                )
                logger.info(f"已删除MinIO文件: {object_name}")
                return True
            except S3Error as e:
                logger.error(f"删除MinIO文件失败: {e}")
                return False
        else:
            import os
            try:
                os.remove(object_name)
                meta_path = f"{object_name}.meta.json"
                if os.path.exists(meta_path):
                    os.remove(meta_path)
                logger.info(f"已删除本地文件: {object_name}")
                return True
            except OSError as e:
                logger.error(f"删除本地文件失败: {e}")
                return False


minio_client = MinioClient()
