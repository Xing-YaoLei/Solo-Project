from __future__ import annotations

from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
import uuid
from pydantic import BaseModel, Field, ConfigDict

from app.db.models import DocumentType, DocumentStatus, RiskLevel


class DocumentItemBase(BaseModel):
    vehicle_id: uuid.UUID
    doc_type: DocumentType
    display_name: str = Field(max_length=128)
    status: DocumentStatus = Field(default=DocumentStatus.MISSING)
    uploaded_at: Optional[datetime] = None
    expire_at: Optional[datetime] = None
    verified: bool = Field(default=False)
    verified_by: Optional[str] = Field(default=None, max_length=64)
    verified_at: Optional[datetime] = None


class DocumentItemCreate(DocumentItemBase):
    pass


class DocumentItemUpdate(BaseModel):
    status: Optional[DocumentStatus] = None
    uploaded_at: Optional[datetime] = None
    expire_at: Optional[datetime] = None
    verified: Optional[bool] = None
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None


class DocumentItemRead(DocumentItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID


class AlertBase(BaseModel):
    vehicle_id: uuid.UUID
    store_id: uuid.UUID
    rule_id: Optional[uuid.UUID] = None
    doc_type: Optional[DocumentType] = None
    level: RiskLevel
    message: str
    triggered_at: datetime = Field(default_factory=lambda: datetime.utcnow())
    acknowledged: bool = Field(default=False)
    acknowledged_at: Optional[datetime] = None
    resolved: bool = Field(default=False)
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None


class AlertCreate(BaseModel):
    vehicle_id: uuid.UUID
    rule_id: Optional[uuid.UUID] = None
    doc_type: Optional[DocumentType] = None
    level: RiskLevel
    message: str


class AlertUpdate(BaseModel):
    acknowledged: Optional[bool] = None
    resolved: Optional[bool] = None
    resolution_notes: Optional[str] = None


class AlertRead(AlertBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    vin: Optional[str] = Field(default=None, description="车架号(冗余)")
    store_name: Optional[str] = Field(default=None, description="门店名称(冗余)")
    stock_days: int = Field(default=0, description="滞库天数")


class WarningRuleBase(BaseModel):
    name: str = Field(max_length=128)
    description: Optional[str] = None
    dsl_expression: str
    default_level: RiskLevel = Field(default=RiskLevel.MEDIUM)
    enabled: bool = Field(default=True)
    params: dict = Field(default_factory=dict)


class WarningRuleCreate(WarningRuleBase):
    pass


class WarningRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    dsl_expression: Optional[str] = None
    default_level: Optional[RiskLevel] = None
    enabled: Optional[bool] = None
    params: Optional[dict] = None


class WarningRuleRead(WarningRuleBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
