from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Legal Document Archive Platform"

    POSTGRES_SERVER: str = "db"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "legal_docs"
    POSTGRES_PORT: str = "5432"

    SECRET_KEY: str = "your-secret-key-change-in-production-very-long-and-random"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"

    RISK_KEYWORDS: list = [
        "违约", "欺诈", "违规", "风险", "争议", "诉讼", "仲裁",
        "赔偿", "损失", "责任", "违法", "罚款", "处罚", "违约",
        "解除合同", "终止", "无效", "撤销", "保密", "竞业",
        "抵押", "质押", "保证", "担保", "留置", "不可抗力"
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


settings = Settings()
