from datetime import datetime
from pathlib import Path
from PIL import Image, ExifTags

from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import SitePhoto
from config import Config


EXIF_DATETIME_TAGS = [
    tag for tag, name in ExifTags.TAGS.items()
    if name in ('DateTimeOriginal', 'DateTime', 'DateTimeDigitized')
]

PHOTO_TYPE_KEYWORDS = {
    'measure': ['量房', '测量', '尺寸', 'measure'],
    'material': ['材料', '样品', 'material', 'sample'],
    'progress': ['进度', '施工', '工地', 'progress', 'site'],
    'quality': ['质量', '问题', '缺陷', 'quality', 'defect'],
    'acceptance': ['验收', '竣工', '完工', 'acceptance', 'complete'],
}


@celery_app.task(name="tasks.process_photo")
def process_photo_task(photo_id: int):
    db = SessionLocal()
    try:
        photo = db.query(SitePhoto).filter(SitePhoto.id == photo_id).first()
        if not photo:
            raise ValueError(f"照片记录不存在: {photo_id}")

        img_path = Path(photo.file_path)
        if not img_path.exists():
            raise FileNotFoundError(f"照片文件不存在: {photo.file_path}")

        shoot_time = _extract_shoot_time(img_path)
        if shoot_time:
            photo.shoot_time = shoot_time

        thumbnail_path = _create_thumbnail(img_path)
        if thumbnail_path:
            photo.thumbnail_path = str(thumbnail_path)

        tags = _classify_photo(photo.file_name, photo.description or '')
        if not photo.photo_type and tags:
            photo.photo_type = tags[0]
        photo.parsed_tags = tags

        db.commit()
        return {"status": "success", "photo_id": photo_id, "tags": tags}

    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()


def _extract_shoot_time(img_path: Path):
    try:
        with Image.open(img_path) as img:
            exif = img._getexif()
            if exif:
                for tag_id in EXIF_DATETIME_TAGS:
                    if tag_id in exif:
                        date_str = exif[tag_id]
                        try:
                            return datetime.strptime(date_str, '%Y:%m:%d %H:%M:%S')
                        except ValueError:
                            pass
    except Exception:
        pass
    return None


def _create_thumbnail(img_path: Path):
    try:
        thumb_dir = Config.UPLOAD_DIR / 'photos' / 'thumbnails'
        thumb_dir.mkdir(parents=True, exist_ok=True)
        thumb_path = thumb_dir / f'thumb_{img_path.name}'

        with Image.open(img_path) as img:
            img.thumbnail((300, 300))
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            img.save(thumb_path, 'JPEG', quality=85)
        return thumb_path
    except Exception:
        return None


def _classify_photo(filename: str, description: str) -> list:
    text = f"{filename.lower()} {description.lower()}"
    tags = []
    for photo_type, keywords in PHOTO_TYPE_KEYWORDS.items():
        if any(kw.lower() in text for kw in keywords):
            tags.append(photo_type)
    if not tags:
        tags.append('other')
    return tags
