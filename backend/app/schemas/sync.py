from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class SyncNodeBase(BaseModel):
    name: str
    source_type: str
    status: str = "pending"
    seq_order: int


class SyncNodeCreate(SyncNodeBase):
    pass


class SyncNode(SyncNodeBase):
    id: str
    last_sync_time: Optional[datetime] = None
    record_count: int = 0
    success_count: int = 0
    fail_count: int = 0
    avg_duration: float = 0
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class SyncLogBase(BaseModel):
    node_id: str
    batch_id: str
    status: str
    record_count: int = 0
    duration: int = 0
    error_detail: Optional[str] = None
    raw_data_sample: Optional[Dict[str, Any]] = None


class SyncLogCreate(SyncLogBase):
    pass


class SyncLog(SyncLogBase):
    id: str
    started_at: datetime
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SyncLogListResponse(BaseModel):
    list: List[SyncLog]
    total: int
