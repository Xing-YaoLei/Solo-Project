from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CleaningRecordBase(BaseModel):
    record_code: str
    equipment_id: int
    store_id: int
    cleaning_date: datetime
    cleaning_type: str
    operator: Optional[str] = None
    cleaning_items: Optional[str] = None
    cleaning_result: Optional[str] = "passed"
    remark: Optional[str] = None
    source: Optional[str] = None


class CleaningRecordCreate(CleaningRecordBase):
    pass


class CleaningRecord(CleaningRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
