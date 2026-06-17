from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ImportBatchBase(BaseModel):
    batch_no: str
    source_type: str
    status: str = "pending"
    record_count: int = 0
    file_name: Optional[str] = None
    imported_by: Optional[int] = None
    remark: Optional[str] = None


class ImportBatchCreate(ImportBatchBase):
    pass


class ImportBatch(ImportBatchBase):
    id: int
    imported_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
