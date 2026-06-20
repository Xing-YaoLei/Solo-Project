from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship

from models.database import Base


class CameraStats(Base):
    __tablename__ = "camera_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(Integer, ForeignKey("data_batches.id"), nullable=True)
    stat_date = Column(Date, nullable=False, index=True)
    time_slot = Column(String(16), nullable=False, index=True)
    zone = Column(String(64), nullable=False, index=True)
    camera_id = Column(String(64), nullable=False)
    pedestrian_count = Column(Integer, default=0, comment="行人数量(摄像头识别)")
    estimated_visitors = Column(Integer, default=0, comment="估算游客数(去重后)")
    peak_density = Column(Integer, default=0, comment="峰值密度(人/平米)")
    recorded_at = Column(DateTime, default=datetime.now, index=True)

    batch = relationship("DataBatch")
