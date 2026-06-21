from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from ..models.exception import ExceptionStatus, ExceptionType
from .base import BaseSchema


class ExceptionBase(BaseModel):
    quote_id: str
    title: str = Field(..., max_length=200)
    exception_type: ExceptionType
    description: str
    source_ref: Optional[str] = Field(None, max_length=200)
    expected_amount: Optional[float] = None
    actual_amount: Optional[float] = None
    difference_amount: Optional[float] = None


class ExceptionCreate(ExceptionBase):
    pass


class ExceptionUpdate(BaseModel):
    title: Optional[str] = None
    exception_type: Optional[ExceptionType] = None
    description: Optional[str] = None
    status: Optional[ExceptionStatus] = None
    handled_by: Optional[str] = None
    resolution: Optional[str] = None


class ExceptionStatusUpdate(BaseModel):
    status: ExceptionStatus
    comment: str = Field(..., max_length=500)
    source_record: Optional[str] = Field(None, max_length=500)


class ExceptionHistoryResponse(BaseSchema):
    exception_id: str
    action: str
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    comment: Optional[str] = None
    operator_id: Optional[str] = None
    operator_name: Optional[str] = None
    source_record: Optional[str] = None


class ExceptionResponse(BaseSchema, ExceptionBase):
    status: ExceptionStatus
    handled_by: Optional[str] = None
    handler_name: Optional[str] = None
    resolution: Optional[str] = None
    resolved_at: Optional[datetime] = None
    quote_title: Optional[str] = None
    client_name: Optional[str] = None
