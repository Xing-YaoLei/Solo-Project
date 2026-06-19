from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime


class SyncNodeBase(BaseModel):
    name: str
    source_type: Literal['door_lock', 'payment', 'ota']
    status: Literal['pending', 'running', 'success', 'failed'] = "pending"
    seq_order: int


class SyncNode(SyncNodeBase):
    id: str
    last_sync_time: Optional[datetime] = None
    success_count: int = 0
    fail_count: int = 0
    avg_duration: float = 0.0
    isLast: Optional[bool] = None

    class Config:
        from_attributes = True


class SyncLogBase(BaseModel):
    node_id: str
    batch_id: str
    status: Literal['success', 'failed']
    record_count: int = 0
    duration_ms: int = 0
    error_detail: Optional[str] = None
    raw_data_sample: Optional[str] = None


class SyncLog(SyncLogBase):
    id: str
    node_name: str = ""
    started_at: datetime
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SyncLogListResponse(BaseModel):
    data: List[SyncLog]
    total: int


class SyncFlow(BaseModel):
    sourceType: str
    sourceTypeLabel: str
    nodes: List[SyncNode]


class SyncStats(BaseModel):
    sourceType: str
    sourceTypeLabel: str
    total_records: int
    successRate: float


class SyncBatch(BaseModel):
    id: str
    source_type: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    status: Literal['pending', 'running', 'success', 'failed']
    total_count: int = 0
    success_count: int = 0
    fail_count: int = 0

    class Config:
        from_attributes = True


class SyncBatchListResponse(BaseModel):
    data: List[SyncBatch]
    total: int
