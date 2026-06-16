"""
口腔诊所会员复诊风险监测系统
配置模块
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    DB_PATH = os.getenv("DB_PATH", "data/clinic.db")
    MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    MINIO_BUCKET = os.getenv("MINIO_BUCKET", "clinic-attachments")
    MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"

    ROLES = {
        "management": "管理层",
        "frontline": "一线人员"
    }

    TREATMENT_TYPES = [
        "洁牙", "补牙", "根管治疗", "拔牙", "种植牙",
        "正畸", "烤瓷牙", "贴面", "牙周治疗", "儿童牙科"
    ]

    APPOINTMENT_STATUS = ["已完成", "待复诊", "爽约", "已取消", "进行中"]
