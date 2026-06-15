from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ImportBatch(BaseModel):
    batchId: str
    importTime: datetime
    source: str
    recordCount: int
    status: str
    operator: str
    remark: Optional[str] = None

    class Config:
        from_attributes = True


class ImportRequest(BaseModel):
    source: str = Field(..., description="数据来源: live/employment/lms")
    remark: Optional[str] = None


class ImportResponse(BaseModel):
    batchId: str
    status: str
    message: str


class ProgressNoteCreate(BaseModel):
    date: str
    studentId: Optional[int] = None
    classId: Optional[str] = None
    note: str


class ProgressNoteResponse(BaseModel):
    id: int
    date: str
    studentId: Optional[int] = None
    classId: Optional[str] = None
    note: str
    createdBy: str
    createdAt: datetime

    class Config:
        from_attributes = True
