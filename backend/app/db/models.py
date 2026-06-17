import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Date, DateTime, Boolean, Text, ForeignKey, Index
)
from sqlalchemy.dialects.postgresql import UUID
from app.db.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class ChargingRecord(Base):
    __tablename__ = "charging_records"
    id = Column(String, primary_key=True, default=generate_uuid)
    resident_id = Column(String, nullable=False, index=True)
    resident_name = Column(String)
    charge_date = Column(Date, nullable=False)
    item_type = Column(String)
    item_name = Column(String)
    amount = Column(Float, nullable=False)
    payment_method = Column(String)
    payment_status = Column(String, default="paid")
    source_system = Column(String, default="charging_system")
    raw_data = Column(Text)
    is_cleaned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)

    __table_args__ = (
        Index("idx_charging_resident_date_item", "resident_id", "charge_date", "item_type", unique=True),
    )


class AccessLog(Base):
    __tablename__ = "access_logs"
    id = Column(String, primary_key=True, default=generate_uuid)
    resident_id = Column(String, nullable=False, index=True)
    resident_name = Column(String)
    access_time = Column(DateTime, nullable=False, index=True)
    direction = Column(String, nullable=False)
    device_id = Column(String)
    device_location = Column(String)
    card_no = Column(String)
    source_system = Column(String, default="access_control")
    raw_data = Column(Text)
    is_cleaned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)

    __table_args__ = (
        Index("idx_access_resident_time_direction", "resident_id", "access_time", "direction", unique=True),
    )


class HealthMetric(Base):
    __tablename__ = "health_metrics"
    id = Column(String, primary_key=True, default=generate_uuid)
    resident_id = Column(String, nullable=False, index=True)
    resident_name = Column(String)
    measure_time = Column(DateTime, nullable=False, index=True)
    metric_type = Column(String, nullable=False)
    metric_value = Column(Float, nullable=False)
    metric_unit = Column(String)
    device_id = Column(String)
    device_type = Column(String)
    source_system = Column(String, default="health_device")
    raw_data = Column(Text)
    is_cleaned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)

    __table_args__ = (
        Index("idx_health_resident_time_metric", "resident_id", "measure_time", "metric_type", unique=True),
    )


class Bed(Base):
    __tablename__ = "beds"
    id = Column(String, primary_key=True, default=generate_uuid)
    bed_no = Column(String, unique=True, nullable=False)
    area = Column(String, nullable=False)
    floor = Column(String, nullable=False)
    status = Column(String, default="available")


class Resident(Base):
    __tablename__ = "residents"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    care_level = Column(String, nullable=False)
    admission_date = Column(Date, nullable=False)
    primary_disease = Column(String)
    bed_id = Column(String, ForeignKey("beds.id"))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class CareRecord(Base):
    __tablename__ = "care_records"
    id = Column(String, primary_key=True, default=generate_uuid)
    resident_id = Column(String, nullable=False, index=True)
    care_time = Column(DateTime, nullable=False)
    care_type = Column(String, nullable=False)
    is_completed = Column(Boolean, default=True)
    caregiver = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)


class Activity(Base):
    __tablename__ = "activities"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    location = Column(String)


class ActivitySignin(Base):
    __tablename__ = "activity_signins"
    id = Column(String, primary_key=True, default=generate_uuid)
    activity_id = Column(String, nullable=False)
    resident_id = Column(String, nullable=False)
    signin_time = Column(DateTime, nullable=False)
    signin_type = Column(String, default="manual")


class RiskEvent(Base):
    __tablename__ = "risk_events"
    id = Column(String, primary_key=True, default=generate_uuid)
    type = Column(String, nullable=False)
    level = Column(String, nullable=False)
    resident_id = Column(String, nullable=False, index=True)
    occur_time = Column(DateTime, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.now)


class RiskRemark(Base):
    __tablename__ = "risk_remarks"
    id = Column(String, primary_key=True, default=generate_uuid)
    risk_event_id = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=False)
    user_name = Column(String, nullable=False)
    remark_type = Column(String, default="initial")
    created_at = Column(DateTime, default=datetime.now)


class ReviewMaterial(Base):
    __tablename__ = "review_materials"
    id = Column(String, primary_key=True, default=generate_uuid)
    risk_event_id = Column(String, nullable=False)
    care_comparison = Column(Text)
    improvement_measures = Column(Text)
    created_at = Column(DateTime, default=datetime.now)


class ThresholdConfig(Base):
    __tablename__ = "threshold_configs"
    id = Column(String, primary_key=True, default=generate_uuid)
    metric_key = Column(String, unique=True, nullable=False)
    metric_name = Column(String, nullable=False)
    warning_threshold = Column(Float, nullable=False)
    critical_threshold = Column(Float, nullable=False)
    unit = Column(String, default="%")
    updated_by = Column(String)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class ThresholdChangeLog(Base):
    __tablename__ = "threshold_change_logs"
    id = Column(String, primary_key=True, default=generate_uuid)
    threshold_id = Column(String, nullable=False, index=True)
    old_warning = Column(Float, nullable=False)
    new_warning = Column(Float, nullable=False)
    old_critical = Column(Float, nullable=False)
    new_critical = Column(Float, nullable=False)
    changed_by = Column(String, nullable=False)
    changed_at = Column(DateTime, default=datetime.now)


class DataImportLog(Base):
    __tablename__ = "data_import_logs"
    id = Column(String, primary_key=True, default=generate_uuid)
    source_type = Column(String, nullable=False)
    source_system = Column(String)
    record_count = Column(Integer, default=0)
    cleaned_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    status = Column(String, default="pending")
    started_at = Column(DateTime, default=datetime.now)
    finished_at = Column(DateTime)
    error_message = Column(Text)
