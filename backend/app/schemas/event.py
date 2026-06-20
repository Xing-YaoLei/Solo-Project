from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    name: str = Field(..., max_length=255)
    venue: str = Field(..., max_length=255)
    event_date: datetime
    status: str = Field(default="scheduled")


class EventUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    venue: str | None = Field(None, max_length=255)
    event_date: datetime | None = None
    status: str | None = None


class EventResponse(BaseModel):
    id: UUID
    name: str
    venue: str
    event_date: datetime
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
