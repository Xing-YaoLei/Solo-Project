import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class Settings:
    BASE_DIR: Path = Path(__file__).resolve().parent.parent

    DATABASE_URL: str | None = os.getenv("DATABASE_URL")

    DUCKDB_PATH: Path = Path(os.getenv("DUCKDB_PATH", "./data/analytics.duckdb"))
    if not DUCKDB_PATH.is_absolute():
        DUCKDB_PATH = BASE_DIR / DUCKDB_PATH

    MOCK_DATA_PATH: Path | None = os.getenv("MOCK_DATA_PATH")
    if MOCK_DATA_PATH:
        MOCK_DATA_PATH = Path(MOCK_DATA_PATH)
        if not MOCK_DATA_PATH.is_absolute():
            MOCK_DATA_PATH = BASE_DIR / MOCK_DATA_PATH

    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    @property
    def DATA_DIR(self) -> Path:
        return self.DUCKDB_PATH.parent


settings = Settings()
