import os
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / '.env')


class Config:
    POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
    POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
    POSTGRES_DB = os.getenv('POSTGRES_DB', 'home_decor_report')
    POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
    POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'postgres')

    REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))
    REDIS_DB = int(os.getenv('REDIS_DB', '0'))

    CELERY_BROKER_URL = os.getenv(
        'CELERY_BROKER_URL',
        f'redis://{REDIS_HOST}:{REDIS_PORT}/0'
    )
    CELERY_RESULT_BACKEND = os.getenv(
        'CELERY_RESULT_BACKEND',
        f'redis://{REDIS_HOST}:{REDIS_PORT}/1'
    )

    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DASH_PORT = int(os.getenv('DASH_PORT', '8050'))
    DASH_DEBUG = os.getenv('DASH_DEBUG', 'false').lower() == 'true'

    TIMEZONE = os.getenv('TIMEZONE', 'Asia/Shanghai')

    UPLOAD_DIR = Path(os.getenv('UPLOAD_DIR', BASE_DIR / 'uploads'))
    EXPORT_DIR = Path(os.getenv('EXPORT_DIR', BASE_DIR / 'exports'))

    SQLALCHEMY_DATABASE_URL = (
        f'postgresql+psycopg2://{POSTGRES_USER}:{POSTGRES_PASSWORD}'
        f'@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}'
    )

    @classmethod
    def ensure_dirs(cls):
        cls.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        cls.EXPORT_DIR.mkdir(parents=True, exist_ok=True)
        (cls.UPLOAD_DIR / 'design').mkdir(parents=True, exist_ok=True)
        (cls.UPLOAD_DIR / 'photos').mkdir(parents=True, exist_ok=True)
        (cls.UPLOAD_DIR / 'purchase').mkdir(parents=True, exist_ok=True)
