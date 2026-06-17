from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ExportRecordBase(BaseModel):
    export_type: str = Field(..., max_length=50)
    export_name: str = Field(..., max_length=200)
    file_name: str = Field(..., max_length=255)
    file_path: str = Field(..., max_length=500)
    file_size: Optional[int] = None
    data_caliber: str
    filter_conditions: Optional[str] = None
    record_count: Optional[int] = None
    exported_by: Optional[int] = None
    remark: Optional[str] = None


class ExportRecordCreate(ExportRecordBase):
    pass


class ExportRecordResponse(ExportRecordBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
