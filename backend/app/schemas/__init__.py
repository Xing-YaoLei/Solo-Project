from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field
import enum


class PointStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"


class DeviceStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"
    UNKNOWN = "unknown"


class CleaningStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    SUPPLEMENT_INFO = "supplement_info"
    REVIEWING = "reviewing"
    COMPLETED = "completed"
    CLOSED = "closed"


class SourceChannel(str, enum.Enum):
    ROUTINE_INSPECTION = "routine_inspection"
    DEVICE_ALERT = "device_alert"
    MANUAL_REPORT = "manual_report"
    STORE_REQUEST = "store_request"


class CloseReason(str, enum.Enum):
    QUALIFIED = "qualified"
    DEVICE_REPLACED = "device_replaced"
    POINT_CLOSED = "point_closed"
    OTHER = "other"


class StorePointBase(BaseModel):
    name: str
    address: Optional[str] = None
    store_code: str
    region: Optional[str] = None
    status: PointStatus = PointStatus.ACTIVE
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None


class StorePointCreate(StorePointBase):
    pass


class StorePointUpdate(StorePointBase):
    pass


class StorePoint(StorePointBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DeviceBase(BaseModel):
    device_code: str
    device_name: str
    device_type: Optional[str] = None
    store_point_id: Optional[int] = None
    status: DeviceStatus = DeviceStatus.UNKNOWN
    specifications: Optional[dict] = None
    remarks: Optional[str] = None


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(DeviceBase):
    pass


class Device(DeviceBase):
    id: int
    last_heartbeat: Optional[datetime] = None
    installation_date: Optional[datetime] = None
    last_maintenance_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    store_point: Optional[StorePoint] = None

    class Config:
        from_attributes = True


class PersonBase(BaseModel):
    name: str
    employee_id: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None


class PersonCreate(PersonBase):
    pass


class Person(PersonBase):
    id: int
    is_active: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StatusLogBase(BaseModel):
    from_status: Optional[CleaningStatus] = None
    to_status: CleaningStatus
    operator_id: Optional[int] = None
    remarks: Optional[str] = None


class StatusLog(StatusLogBase):
    id: int
    cleaning_record_id: int
    created_at: datetime
    operator: Optional[Person] = None

    class Config:
        from_attributes = True


class CleaningItem(BaseModel):
    name: str
    completed: bool = False
    remarks: Optional[str] = None


class CleaningRecordBase(BaseModel):
    store_point_id: int
    device_id: int
    source_channel: SourceChannel = SourceChannel.ROUTINE_INSPECTION

    cleaning_date: Optional[datetime] = None
    cleaning_person_id: Optional[int] = None
    cleaning_items: List[CleaningItem] = Field(default_factory=list)
    cleaning_photos: List[str] = Field(default_factory=list)
    cleaning_remarks: Optional[str] = None

    reviewer_id: Optional[int] = None
    review_result: Optional[str] = None
    review_remarks: Optional[str] = None
    review_photos: List[str] = Field(default_factory=list)

    inspection_result: Optional[str] = None
    qualified_rate: Optional[float] = None

    is_device_offline: bool = False
    offline_handled: bool = False
    offline_remarks: Optional[str] = None

    supplement_notes: Optional[str] = None


class CleaningRecordCreate(CleaningRecordBase):
    pass


class CleaningRecordUpdate(CleaningRecordBase):
    status: Optional[CleaningStatus] = None
    close_reason: Optional[CloseReason] = None
    close_remarks: Optional[str] = None


class CleaningRecordSubmitForReview(BaseModel):
    pass


class CleaningRecordReview(BaseModel):
    review_result: str
    review_remarks: Optional[str] = None
    review_photos: List[str] = Field(default_factory=list)
    need_supplement: bool = False


class CleaningRecordClose(BaseModel):
    close_reason: CloseReason
    close_remarks: Optional[str] = None


class CleaningRecord(CleaningRecordBase):
    id: int
    record_no: str
    status: CleaningStatus
    close_reason: Optional[CloseReason] = None
    close_remarks: Optional[str] = None
    closed_at: Optional[datetime] = None
    closed_by_id: Optional[int] = None
    review_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    store_point: StorePoint
    device: Device
    cleaning_person: Optional[Person] = None
    reviewer: Optional[Person] = None
    closed_by: Optional[Person] = None
    status_logs: List[StatusLog] = Field(default_factory=list)

    class Config:
        from_attributes = True


class CleaningRecordList(BaseModel):
    total: int
    items: List[CleaningRecord]


class StatisticsSummary(BaseModel):
    total_records: int = 0
    completed_count: int = 0
    reviewing_count: int = 0
    supplement_count: int = 0
    closed_count: int = 0
    avg_qualified_rate: float = 0.0


class StatisticsByChannel(BaseModel):
    channel: str
    count: int
    qualified_rate: float


class StatisticsByPerson(BaseModel):
    person_id: int
    person_name: str
    total: int
    completed: int
    qualified_rate: float


class StatisticsByCloseReason(BaseModel):
    reason: str
    count: int
