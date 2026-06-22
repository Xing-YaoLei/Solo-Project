import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/compliance_audit")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    DASH_DEBUG = os.getenv("DASH_DEBUG", "True").lower() == "true"
