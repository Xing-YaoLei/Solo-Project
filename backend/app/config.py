from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "Coffee Equipment Cleaning Dashboard"
    DEBUG: bool = True

    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "coffee_cleaning"

    DUCKDB_PATH: str = "./data/coffee_cleaning.duckdb"

    class Config:
        env_file = ".env"


settings = Settings()
