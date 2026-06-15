import os
import uuid
from django.conf import settings
from minio import Minio
from minio.error import S3Error


def get_minio_client():
    return Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_USE_HTTPS,
    )


def ensure_bucket():
    client = get_minio_client()
    bucket_name = settings.MINIO_BUCKET_NAME
    if not client.bucket_exists(bucket_name):
        client.make_bucket(bucket_name)
    return bucket_name


def upload_file(file_obj, object_name=None, content_type="application/pdf"):
    client = get_minio_client()
    bucket_name = ensure_bucket()

    if object_name is None:
        ext = os.path.splitext(file_obj.name)[1].lower()
        object_name = f"materials/{uuid.uuid4().hex}{ext}"

    file_size = file_obj.size
    client.put_object(
        bucket_name,
        object_name,
        file_obj,
        file_size,
        content_type=content_type,
    )

    protocol = "https" if settings.MINIO_USE_HTTPS else "http"
    file_url = f"{protocol}://{settings.MINIO_ENDPOINT}/{bucket_name}/{object_name}"

    return object_name, file_url


def get_file_url(object_name):
    if not object_name:
        return ""
    protocol = "https" if settings.MINIO_USE_HTTPS else "http"
    return f"{protocol}://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET_NAME}/{object_name}"


def delete_file(object_name):
    if not object_name:
        return
    try:
        client = get_minio_client()
        client.remove_object(settings.MINIO_BUCKET_NAME, object_name)
    except S3Error:
        pass
