from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "商户结算趋势看板"

    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "merchant_settlement"
    POSTGRES_PORT: str = "5432"

    DUCKDB_PATH: str = "backend/data/settlement.duckdb"

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
