import os
import uuid
from pathlib import Path
from typing import Tuple

import aiofiles
from fastapi import UploadFile

from ..config import settings


def ensure_upload_dir() -> Path:
    upload_path = Path(settings.UPLOAD_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)
    return upload_path


def generate_safe_filename(original_filename: str) -> Tuple[str, str]:
    ext = Path(original_filename).suffix
    safe_name = f"{uuid.uuid4().hex}{ext}"
    return safe_name, ext


async def save_upload_file(file: UploadFile, sub_dir: str = "") -> Tuple[str, str, int]:
    upload_path = ensure_upload_dir()
    if sub_dir:
        target_dir = upload_path / sub_dir
        target_dir.mkdir(parents=True, exist_ok=True)
    else:
        target_dir = upload_path

    safe_name, ext = generate_safe_filename(file.filename or "unnamed")
    file_path = target_dir / safe_name

    content = await file.read()
    file_size = len(content)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    relative_path = str(file_path.relative_to(Path.cwd()))
    return relative_path, safe_name, file_size
