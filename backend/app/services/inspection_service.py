import os
import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings

UPLOAD_DIR = Path(getattr(settings, "UPLOAD_DIR", "uploads"))


async def create_inspection(
    db: AsyncSession, data: dict, files: list
) -> "Inspection":
    from app.models.inspection import Inspection

    inspection = Inspection(**data)
    db.add(inspection)
    await db.flush()

    photo_dir = UPLOAD_DIR / "inspections" / str(inspection.id)
    photo_dir.mkdir(parents=True, exist_ok=True)

    photo_paths: list[str] = []
    for file in files:
        ext = Path(file.filename).suffix if file.filename else ""
        filename = f"{uuid.uuid4().hex}{ext}"
        file_path = photo_dir / filename
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        photo_paths.append(str(file_path))

    inspection.photos = photo_paths
    await db.commit()
    await db.refresh(inspection)
    return inspection


async def add_photos(
    db: AsyncSession, inspection_id: int, files: list
) -> "Inspection":
    from app.models.inspection import Inspection

    result = await db.execute(
        select(Inspection).where(Inspection.id == inspection_id)
    )
    inspection = result.scalar_one_or_none()
    if inspection is None:
        raise ValueError("检测记录不存在")

    photo_dir = UPLOAD_DIR / "inspections" / str(inspection.id)
    photo_dir.mkdir(parents=True, exist_ok=True)

    existing: list[str] = list(inspection.photos or [])
    for file in files:
        ext = Path(file.filename).suffix if file.filename else ""
        filename = f"{uuid.uuid4().hex}{ext}"
        file_path = photo_dir / filename
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        existing.append(str(file_path))

    inspection.photos = existing
    await db.commit()
    await db.refresh(inspection)
    return inspection
