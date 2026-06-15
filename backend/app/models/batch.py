from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class BatchImport(Base):
    __tablename__ = "batch_import"

    batch_id = Column(String(50), primary_key=True, index=True)
    source = Column(String(20), nullable=False)
    record_count = Column(Integer, default=0)
    status = Column(String(20), nullable=False, default="pending")
    operator_id = Column(Integer, ForeignKey("users.id"))
    import_time = Column(DateTime(timezone=True), server_default=func.now())
    remark = Column(Text)
    error_log = Column(Text)

    operator = relationship("User", back_populates="batches")
    practices = relationship("StudentPractice", back_populates="batch")
    homeworks = relationship("HomeworkRecord", back_populates="batch")
    progress_records = relationship("LearningProgress", back_populates="batch")
    metrics = relationship("MetricsSummary", back_populates="batch")
