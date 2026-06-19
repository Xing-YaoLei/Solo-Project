import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    MINIO_SECURE = os.getenv("MINIO_SECURE", "False").lower() == "true"
    MINIO_BUCKET_NAME = os.getenv("MINIO_BUCKET_NAME", "homestay-data")
    
    CONVERSION_RATE_THRESHOLD = float(os.getenv("CONVERSION_RATE_THRESHOLD", "0.65"))
    
    DUCKDB_PATH = os.path.join(os.path.dirname(__file__), "data", "homestay_funnel.db")
    DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
    
    FUNNEL_STAGES = [
        "浏览商品",
        "加入购物车",
        "提交订单",
        "完成支付",
        "预约入住",
        "完成核销"
    ]

settings = Settings()
