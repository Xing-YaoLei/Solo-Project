from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class StoreBase(BaseModel):
    store_code: str
    store_name: str
    region: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = True

class StoreCreate(StoreBase):
    pass

class Store(StoreBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class EquipmentBase(BaseModel):
    equipment_code: str
    equipment_name: str
    equipment_type: str
    store_id: int
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    status: Optional[str] = "online"
    clean_risk_score: Optional[float] = 0.0
    specs: Optional[Dict[str, Any]] = {}

class EquipmentCreate(EquipmentBase):
    pass

class Equipment(EquipmentBase):
    id: int
    last_heartbeat: Optional[datetime] = None
    offline_duration_minutes: Optional[int] = 0
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class EquipmentStatusLogBase(BaseModel):
    equipment_id: int
    status: str
    event_time: datetime
    reason: Optional[str] = None
    is_offline_gap: Optional[bool] = False
    gap_start_time: Optional[datetime] = None
    gap_end_time: Optional[datetime] = None
    sample_data_ref: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = {}

class EquipmentStatusLogCreate(EquipmentStatusLogBase):
    pass

class EquipmentStatusLog(EquipmentStatusLogBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class SyncDelayLogBase(BaseModel):
    data_type: str
    source_system: Optional[str] = None
    expected_sync_time: datetime
    actual_sync_time: Optional[datetime] = None
    delay_minutes: Optional[int] = 0
    affected_date: datetime
    store_id: Optional[int] = None
    description: Optional[str] = None
    is_resolved: Optional[bool] = False

class SyncDelayLogCreate(SyncDelayLogBase):
    pass

class SyncDelayLog(SyncDelayLogBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True
