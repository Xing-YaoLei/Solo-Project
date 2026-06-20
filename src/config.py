import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    MINIO_BUCKET = os.getenv("MINIO_BUCKET", "scenic-complaints")
    MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"

    DUCKDB_PATH = os.getenv("DUCKDB_PATH", "./data/complaints.duckdb")

    SCENIC_NAME = os.getenv("SCENIC_NAME", "青山景区")
    SCENIC_REGIONS = os.getenv("SCENIC_REGIONS", "东门区,西门区,南门区,北门区,核心景区").split(",")

    PIPELINE_STEPS = [
        {"id": "step1_orders", "name": "小程序订单数据", "description": "从小程序侧拉取游客订单数据"},
        {"id": "step2_cameras", "name": "摄像头统计数据", "description": "从摄像头系统获取客流统计"},
        {"id": "step3_merchants", "name": "商户流水数据", "description": "从商户平台同步消费流水"},
    ]

    COMPLAINT_TAGS = [
        "服务态度", "卫生环境", "设施故障", "排队时间", "收费问题",
        "安全隐患", "指引不清", "餐饮质量", "停车问题", "其他"
    ]

    RESPONSIBILITY_DEPARTMENTS = [
        "游客服务中心", "环卫部", "设施维护部", "票务部",
        "安全保卫部", "餐饮部", "停车场管理", "综合管理部"
    ]

    FOLLOWUP_RESULTS = [
        "满意", "基本满意", "不满意", "未联系上", "待回访"
    ]
