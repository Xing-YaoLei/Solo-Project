from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class InspectionTemplateBase(BaseModel):
    template_code: str
    template_name: str
    equipment_type: str
    version: Optional[str] = None
    items: Optional[List[Any]] = []
    scoring_rules: Optional[Dict[str, Any]] = {}
    pass_threshold: Optional[float] = 80.0
    is_active: Optional[bool] = True

class InspectionTemplateCreate(InspectionTemplateBase):
    pass

class InspectionTemplate(InspectionTemplateBase):
    id: int
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class InspectionRecordBase(BaseModel):
    inspection_code: str
    equipment_id: int
    store_id: int
    inspection_type: str
    inspection_time: datetime
    is_pass: Optional[bool] = None
    item_results: Optional[List[Any]] = []

class InspectionRecordCreate(InspectionRecordBase):
    pass

class InspectionRecord(InspectionRecordBase):
    id: int
    template_id: Optional[int] = None
    inspector: Optional[str] = None
    score: Optional[float] = None
    max_score: Optional[float] = 100.0
    pass_threshold: Optional[float] = 80.0
    issue_items: Optional[List[Any]] = []
    clean_score: Optional[float] = None
    overall_rating: Optional[str] = None
    notes: Optional[str] = None
    photos: Optional[List[Any]] = []
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class InspectionTrendBase(BaseModel):
    store_id: int
    period_type: str
    period_start: datetime
    period_end: datetime
    total_inspections: Optional[int] = 0
    pass_count: Optional[int] = 0
    fail_count: Optional[int] = 0
    pass_rate: Optional[float] = 0.0
    avg_score: Optional[float] = 0.0
    avg_clean_score: Optional[float] = 0.0
    improvement_rate: Optional[float] = 0.0
    previous_period_rate: Optional[float] = 0.0
    top_issues: Optional[List[Any]] = []
    metrics_detail: Optional[Dict[str, Any]] = {}

class InspectionTrendCreate(InspectionTrendBase):
    pass

class InspectionTrend(InspectionTrendBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class CleanRiskTimeSeries(BaseModel):
    stat_date: datetime
    equipment_count: int
    avg_risk_score: float
    median_risk_score: float
    max_risk_score: float
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    total_offline_minutes: int
    anomaly_count: int

class CleanAnomalyPoint(BaseModel):
    record_date: datetime
    store_id: Optional[int] = None
    equipment_id: Optional[int] = None
    equipment_code: Optional[str] = None
    clean_risk_score: float
    anomaly_type: Optional[str] = None
    anomaly_reason: Optional[str] = None
    offline_minutes: Optional[int] = None
    status: Optional[str] = None
    sample_ref: Optional[str] = None
    fault_count: Optional[int] = None
    inspection_score: Optional[float] = None

class SyncDelayMarker(BaseModel):
    delay_date: Optional[datetime] = None
    data_type: str
    source_system: Optional[str] = None
    delay_minutes: int
    affected_date: Optional[datetime] = None
    description: str

class CleanRiskAnalyticsResponse(BaseModel):
    daily: List[CleanRiskTimeSeries]
    anomalies: List[CleanAnomalyPoint]
    sync_delays: List[SyncDelayMarker]

class OfflineGapSamplesResponse(BaseModel):
    gap_samples: List[Dict[str, Any]]
    before_context: List[Dict[str, Any]]
    after_context: List[Dict[str, Any]]

class InspectionComparisonResponse(BaseModel):
    periods: List[Dict[str, Any]]
