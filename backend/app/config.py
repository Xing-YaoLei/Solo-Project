import os

DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/verification_db")
SYNC_DATABASE_URL: str = os.getenv("SYNC_DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/verification_db")
REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
