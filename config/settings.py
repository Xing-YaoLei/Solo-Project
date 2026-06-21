import os
from dotenv import load_dotenv

load_dotenv()

MINIO_CONFIG = {
    "endpoint": os.getenv("MINIO_ENDPOINT", "localhost:9000"),
    "access_key": os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
    "secret_key": os.getenv("MINIO_SECRET_KEY", "minioadmin"),
    "secure": os.getenv("MINIO_SECURE", "false").lower() == "true",
    "bucket": os.getenv("MINIO_BUCKET", "legal-docs-bucket"),
}

DATA_SOURCES = {
    "payment": {
        "name": "收款流水",
        "prefix": os.getenv("DATA_SOURCE_PAYMENT", "payment_flow"),
        "description": "财务系统收款流水数据",
    },
    "calendar": {
        "name": "日历工具",
        "prefix": os.getenv("DATA_SOURCE_CALENDAR", "calendar_events"),
        "description": "律师日程与排期数据",
    },
    "case": {
        "name": "案件系统",
        "prefix": os.getenv("DATA_SOURCE_CASE", "case_system"),
        "description": "案件管理系统文书数据",
    },
}

SYNC_DELAY_THRESHOLD_HOURS = int(os.getenv("SYNC_DELAY_THRESHOLD_HOURS", "24"))
RISK_WORD_THRESHOLD = int(os.getenv("RISK_WORD_THRESHOLD", "3"))

REGIONS = ["华东", "华北", "华南", "华中", "西南", "西北", "东北"]

DOC_TYPES = [
    "起诉状", "答辩状", "代理词", "合同审查", "法律意见书",
    "律师函", "证据清单", "庭审笔录", "判决书", "调解书"
]

RISK_WORDS = [
    "退回", "补正", "不完整", "错误", "遗漏", "逾期",
    "违规", "异议", "撤销", "无效", "瑕疵", "风险",
    "争议", "纠纷", "违约", "赔偿", "诉讼", "仲裁"
]

REVIEW_STATUS = ["待审核", "审核中", "已通过", "已退回", "已发布"]

INTERACTION_TYPES = ["提交", "审核", "退回", "修改", "发布", "归档"]
