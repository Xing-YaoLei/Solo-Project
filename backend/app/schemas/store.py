from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class StoreBase(BaseModel):
    store_code: str
    store_name: str
    city: Optional[str] = None
    district: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = "active"


class StoreCreate(StoreBase):
    pass


class StoreUpdate(BaseModel):
    store_name: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None


class Store(StoreBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
