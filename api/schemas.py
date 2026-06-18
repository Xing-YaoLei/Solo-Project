from datetime import date
from typing import Literal

from pydantic import BaseModel


class KPITrend(BaseModel):
    date: str
    turnover_days: float
    completion_rate: float
    missing_rate: float


class DashboardKPI(BaseModel):
    total_vehicles: int
    transfer_completion_rate: float
    avg_turnover_days: float
    material_missing_rate: float
    kpi_trends: list[KPITrend]


class StoreMapPoint(BaseModel):
    store_id: str
    store_name: str
    lng: float
    lat: float
    vehicle_count: int
    turnover_status: Literal["normal", "warning", "critical"]


class TurnoverTrend(BaseModel):
    month: str
    current: float
    yoy: float
    mom: float
    target: float


class MaterialSample(BaseModel):
    vehicle_id: str
    vin: str
    model: str
    missing_items: list[str]


class MaterialHeatmap(BaseModel):
    material_type: str
    store_name: str
    missing_count: int
    missing_rate: float
    samples: list[MaterialSample]


class VehicleListItem(BaseModel):
    vehicle_id: str
    vin: str
    model: str
    brand: str
    store_name: str
    entry_date: str
    status: Literal["in_stock", "transfer_processing", "transferred", "sold"]
    turnover_days: int


class InspectionItem(BaseModel):
    item_name: str
    status: Literal["pass", "fail", "warning"]
    detail: str


class InspectionReport(BaseModel):
    report_id: str
    inspector: str
    inspect_date: str
    detector_version: str
    items: list[InspectionItem]


class PreparationItem(BaseModel):
    task_id: str
    task_name: str
    category: str
    status: Literal["pending", "in_progress", "completed"]
    related_inspection_item: str
    cost: float


class TestDriveRecord(BaseModel):
    record_id: str
    drive_date: str
    driver: str
    duration_minutes: int
    mileage_km: float
    is_anomaly: bool
    anomaly_detail: str | None


class VehicleDetail(BaseModel):
    vehicle_id: str
    vin: str
    model: str
    brand: str
    year: int
    mileage: float
    store_id: str
    store_name: str
    entry_date: str
    status: str
    source_db_version: str
    detector_version: str
    crm_id: str
    inspection_reports: list[InspectionReport]
    preparation_list: list[PreparationItem]
    test_drive_records: list[TestDriveRecord]


class SourceVsCrm(BaseModel):
    total: int
    resolved: int
    pending: int


class VersionEntry(BaseModel):
    version: str
    count: int
    change_date: str
    affected_stores: list[str]


class DetectorVersionDiff(BaseModel):
    total: int
    versions: list[VersionEntry]


class DiffSummary(BaseModel):
    source_vs_crm: SourceVsCrm
    detector_version_diff: DetectorVersionDiff


class DiffRecord(BaseModel):
    diff_id: str
    vehicle_id: str
    vin: str
    field_name: str
    source_value: str
    crm_value: str
    source: Literal["vehicle_source", "detector", "crm"]
    detected_at: str
    resolved: bool


class TurnoverComparison(BaseModel):
    period: str
    current_value: float
    yoy_value: float
    mom_value: float
    target_value: float
    gap_to_target: float


class TurnoverGapSample(BaseModel):
    vehicle_id: str
    vin: str
    model: str
    store_name: str
    turnover_days: int
    gap_reason: str
    test_drive_anomaly: TestDriveRecord | None


class MaterialTrendPoint(BaseModel):
    month: str
    登记证: float
    行驶证: float
    购车发票: float
    保险单: float
    完税证明: float
