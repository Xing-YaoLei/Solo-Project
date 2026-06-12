from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.models import ThresholdConfig
from app.schemas import ThresholdConfigCreate, ThresholdConfigUpdate


class ThresholdService:
    DEFAULT_THRESHOLDS = [
        {"config_key": "cleaning_cycle_days", "config_name": "清洁周期阈值", "config_value": 7.0,
         "config_unit": "天", "description": "设备正常清洁周期，超过此天数未清洁视为异常", "category": "cleaning"},
        {"config_key": "offline_warning_days", "config_name": "离线预警天数", "config_value": 3.0,
         "config_unit": "天", "description": "设备连续未清洁超过此天数触发预警", "category": "warning"},
        {"config_key": "inspection_pass_rate", "config_name": "巡检合格率阈值", "config_value": 90.0,
         "config_unit": "%", "description": "巡检合格率低于此值视为异常", "category": "inspection"},
        {"config_key": "maintenance_cycle_days", "config_name": "维护周期阈值", "config_value": 30.0,
         "config_unit": "天", "description": "设备深度维护周期", "category": "maintenance"},
        {"config_key": "equipment_offline_hours", "config_name": "设备离线时长阈值", "config_value": 24.0,
         "config_unit": "小时", "description": "设备离线超过此时长触发告警", "category": "warning"},
    ]

    @classmethod
    def init_defaults(cls, db: Session):
        for item in cls.DEFAULT_THRESHOLDS:
            existing = db.query(ThresholdConfig).filter(
                ThresholdConfig.config_key == item["config_key"]
            ).first()
            if not existing:
                config = ThresholdConfig(**item)
                db.add(config)
        db.commit()

    @staticmethod
    def get_all(db: Session, category: Optional[str] = None) -> List[ThresholdConfig]:
        query = db.query(ThresholdConfig)
        if category:
            query = query.filter(ThresholdConfig.category == category)
        return query.order_by(ThresholdConfig.config_key).all()

    @staticmethod
    def get_by_key(db: Session, config_key: str) -> Optional[ThresholdConfig]:
        return db.query(ThresholdConfig).filter(
            ThresholdConfig.config_key == config_key
        ).first()

    @staticmethod
    def update(db: Session, config_key: str, config_update: ThresholdConfigUpdate) -> Optional[ThresholdConfig]:
        config = db.query(ThresholdConfig).filter(
            ThresholdConfig.config_key == config_key
        ).first()
        if config:
            update_data = config_update.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(config, key, value)
            config.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(config)
        return config

    @staticmethod
    def get_threshold_value(db: Session, config_key: str, default: float = 0) -> float:
        config = db.query(ThresholdConfig).filter(
            ThresholdConfig.config_key == config_key
        ).first()
        return config.config_value if config else default
