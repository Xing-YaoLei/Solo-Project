from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_secure: bool = False
    minio_bucket_pharmacy: str = "pharmacy-data"
    minio_bucket_prescription: str = "prescription-photos"

    duckdb_path: str = "./data/pharmacy.duckdb"

    streamlit_users_file: str = "./config/users.yaml"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
