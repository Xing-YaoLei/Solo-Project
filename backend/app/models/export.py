from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from .base import BaseModel


class ExportRecord(BaseModel):
    __tablename__ = "export_records"

    export_type = Column(String(50), nullable=False)
    export_name = Column(String(200), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    data_caliber = Column(Text, nullable=False)
    filter_conditions = Column(Text)
    record_count = Column(Integer)
    exported_by = Column(Integer, ForeignKey("users.id"))
    remark = Column(Text)
