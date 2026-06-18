from __future__ import annotations

from typing import Optional, List
from datetime import datetime
from decimal import Decimal
import uuid
from pydantic import BaseModel, Field, ConfigDict

from app.db.models import SyncSource


class PreparationRecordBase(BaseModel):
    vehicle_id: uuid.UUID
    item_name: str = Field(max_length=128)
    category: str = Field(max_length=32)
    cost: Decimal = Field(default=Decimal("0"), max_digits=12, decimal_places=2)
    status: str = Field(default="todo", max_length=16)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    store_id: uuid.UUID


class PreparationRecordCreate(PreparationRecordBase):
    pass


class PreparationRecordRead(PreparationRecordBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime


class TestDriveRecordBase(BaseModel):
    vehicle_id: uuid.UUID
    store_id: uuid.UUID
    customer_name: str = Field(max_length=64)
    customer_phone: Optional[str] = Field(default=None, max_length=32)
    mileage_before: int = Field(ge=0)
    mileage_after: int = Field(ge=0)
    salesman: Optional[str] = Field(default=None, max_length=64)
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    feedback: Optional[str] = None
    drive_at: datetime


class TestDriveRecordCreate(TestDriveRecordBase):
    pass


class TestDriveRecordRead(TestDriveRecordBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID


class QuoteRecordBase(BaseModel):
    vehicle_id: uuid.UUID
    store_id: uuid.UUID
    amount: Decimal = Field(max_digits=12, decimal_places=2)
    source: str = Field(default="门店", max_length=32)
    customer_contact: Optional[str] = Field(default=None, max_length=64)
    is_deal: bool = Field(default=False)
    deal_price: Optional[Decimal] = Field(default=None, max_digits=12, decimal_places=2)
    quoted_at: datetime


class QuoteRecordCreate(QuoteRecordBase):
    pass


class QuoteRecordRead(QuoteRecordBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID


class SyncLogBase(BaseModel):
    source: SyncSource
    batch_no: str = Field(max_length=64)
    total_records: int = Field(default=0, ge=0)
    success_count: int = Field(default=0, ge=0)
    failed_count: int = Field(default=0, ge=0)
    failed_details: Optional[dict] = None
    started_at: datetime
    finished_at: Optional[datetime] = None
    status: str = Field(default="running", max_length=16)


class SyncLogRead(SyncLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
