import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/rehab_center")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
    DASH_DEBUG = os.getenv("DASH_DEBUG", "False") == "True"
    DASH_PORT = int(os.getenv("DASH_PORT", "8050"))
    USE_SQLITE = "sqlite" in DATABASE_URL

    ANOMALY_THRESHOLDS = {
        "payment_delay_days": 3,
        "medical_record_missing_rate": 0.1,
        "punch_card_std_ratio": 0.5,
    }

    METRICS_DEFINITIONS = {
        "treatment_completion_rate": {
            "name": "训练完成率",
            "formula": "实际完成治疗次数 / 计划治疗次数 * 100%",
            "description": "衡量患者按计划完成康复训练的比例",
            "data_sources": ["treatment_plans", "treatment_records"],
        },
        "payment_delay_rate": {
            "name": "收费表延迟率",
            "formula": "延迟收费记录数 / 总收费记录数 * 100%",
            "description": "收费表提交超过规定时限的比例",
            "data_sources": ["payment_records"],
        },
        "medical_record_completeness": {
            "name": "病历完整度",
            "formula": "完整病历数 / 应建病历数 * 100%",
            "description": "病历系统中记录完整的比例",
            "data_sources": ["medical_records"],
        },
        "punch_card_consistency": {
            "name": "打卡一致性",
            "formula": "1 - |实际打卡人数 - 系统登记人数| / 系统登记人数",
            "description": "打卡记录与系统登记的一致性程度",
            "data_sources": ["attendance_records", "patient_registry"],
        },
        "insurance_rejection_rate": {
            "name": "医保拒付率",
            "formula": "医保拒付金额 / 总申报金额 * 100%",
            "description": "医保申报中被拒付的比例",
            "data_sources": ["insurance_claims"],
        },
    }

    REHAB_TYPES = ["物理治疗", "作业治疗", "言语治疗", "康复护理", "器械训练", "中医康复"]
    ANOMALY_TYPES = ["payment_delay", "medical_record_missing", "punch_card_caliber_change", "insurance_rejection"]


settings = Settings()
