from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "健身私教课程消耗跟进系统"
    API_V1_STR: str = "/api/v1"

    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "fitness_tracker"
    POSTGRES_PORT: str = "5432"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
