import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ReviewCreate(BaseModel):
    complaint_id: uuid.UUID
    review_tags: str
    summary: str
    improvement_measures: Optional[str] = None
    reviewer_name: str
    reviewed_at: Optional[str] = None


class ReviewUpdate(BaseModel):
    review_tags: Optional[str] = None
    summary: Optional[str] = None
    improvement_measures: Optional[str] = None
    reviewer_name: Optional[str] = None


class ReviewResponse(BaseModel):
    id: uuid.UUID
    complaint_id: uuid.UUID
    review_tags: str
    summary: str
    improvement_measures: Optional[str] = None
    reviewer_name: str
    reviewed_at: datetime

    model_config = {"from_attributes": True}
