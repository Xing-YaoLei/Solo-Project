from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/community_followup"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "your-secret-key-here"
    access_token_expire_minutes: int = 30

    class Config:
        env_file = ".env"


settings = Settings()
