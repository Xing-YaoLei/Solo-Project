from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, BigInteger, ForeignKey
from sqlalchemy.orm import relationship

from app.database.connection import Base


class ImportBatch(Base):
    __tablename__ = "import_batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_no = Column(String(50), unique=True, index=True, nullable=False)
    source_type = Column(String(20), nullable=False)
    status = Column(String(20), default="pending", nullable=False)
    record_count = Column(Integer, default=0, nullable=False)
    success_count = Column(Integer, default=0, nullable=False)
    failed_count = Column(Integer, default=0, nullable=False)
    file_name = Column(String(500))
    file_size = Column(BigInteger)
    imported_by = Column(Integer, ForeignKey("users.id"))
    imported_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime)
    error_message = Column(Text)
    remark = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    importer = relationship("User", foreign_keys=[imported_by])
