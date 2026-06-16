import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://localhost:5432/pharmacy_audit')
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    DASH_DEBUG = os.getenv('DASH_DEBUG', 'True').lower() == 'true'
    DASH_PORT = int(os.getenv('DASH_PORT', '8050'))
    TIMEZONE = 'Asia/Shanghai'
