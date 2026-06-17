from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime, Boolean, Text, ForeignKey,
    Index, UniqueConstraint, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    store_code = Column(String(32), unique=True, nullable=False, index=True)
    store_name = Column(String(128), nullable=False)
    region = Column(String(64), index=True)
    city = Column(String(64), index=True)
    is_medical_insurance = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    promotions = relationship("Promotion", back_populates="store")
    sales_records = relationship("SalesRecord", back_populates="store")
    display_inspections = relationship("DisplayInspection", back_populates="store")


class Promotion(Base):
    __tablename__ = "promotions"

    id = Column(Integer, primary_key=True, index=True)
    promo_code = Column(String(64), unique=True, nullable=False, index=True)
    promo_name = Column(String(256), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    product_name = Column(String(256), nullable=False)
    product_sku = Column(String(64), index=True)
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    target_sales = Column(Float, default=0.0)
    target_units = Column(Integer, default=0)
    discount_rate = Column(Float, default=0.0)
    promo_type = Column(String(32), default="normal")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    store = relationship("Store", back_populates="promotions")
    sales_records = relationship("SalesRecord", back_populates="promotion")
    display_inspections = relationship("DisplayInspection", back_populates="promotion")
    rectifications = relationship("Rectification", back_populates="promotion")


class DisplayInspection(Base):
    __tablename__ = "display_inspections"

    id = Column(Integer, primary_key=True, index=True)
    promotion_id = Column(Integer, ForeignKey("promotions.id"), nullable=False, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    inspection_date = Column(Date, nullable=False, index=True)
    is_qualified = Column(Boolean, nullable=False, index=True)
    position_score = Column(Integer, default=0)
    pop_score = Column(Integer, default=0)
    price_score = Column(Integer, default=0)
    stock_score = Column(Integer, default=0)
    overall_score = Column(Integer, default=0)
    inspector = Column(String(64))
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    store = relationship("Store", back_populates="display_inspections")
    promotion = relationship("Promotion", back_populates="display_inspections")
    photos = relationship("DisplayPhoto", back_populates="inspection")
    rectifications = relationship("Rectification", back_populates="inspection")


class DisplayPhoto(Base):
    __tablename__ = "display_photos"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("display_inspections.id"), nullable=False, index=True)
    file_path = Column(String(512), nullable=False)
    file_name = Column(String(256), nullable=False)
    upload_by = Column(String(64))
    photo_type = Column(String(32), default="display")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    inspection = relationship("DisplayInspection", back_populates="photos")


class SalesRecord(Base):
    __tablename__ = "sales_records"

    id = Column(Integer, primary_key=True, index=True)
    sale_date = Column(Date, nullable=False, index=True)
    promotion_id = Column(Integer, ForeignKey("promotions.id"), nullable=False, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    sales_amount = Column(Float, default=0.0)
    sales_units = Column(Integer, default=0)
    original_amount = Column(Float, default=0.0)
    member_sales_amount = Column(Float, default=0.0)
    member_sales_units = Column(Integer, default=0)
    medical_insurance_amount = Column(Float, default=0.0)
    medical_insurance_units = Column(Integer, default=0)
    cashier_delay_minutes = Column(Integer, default=0)
    member_record_missing_count = Column(Integer, default=0)
    medical_insurance_caliber_changed = Column(Boolean, default=False)
    data_version = Column(String(32), default="v1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    store = relationship("Store", back_populates="sales_records")
    promotion = relationship("Promotion", back_populates="sales_records")

    __table_args__ = (
        Index("idx_sales_promo_date", "promotion_id", "sale_date"),
    )


class Rectification(Base):
    __tablename__ = "rectifications"

    id = Column(Integer, primary_key=True, index=True)
    promotion_id = Column(Integer, ForeignKey("promotions.id"), nullable=False, index=True)
    inspection_id = Column(Integer, ForeignKey("display_inspections.id"), index=True)
    issue_description = Column(Text, nullable=False)
    require_rectification_date = Column(Date, nullable=False)
    actual_rectification_date = Column(Date)
    rectification_status = Column(String(32), default="pending")
    rectification_remark = Column(Text)
    rectification_by = Column(String(64))
    reviewer = Column(String(64))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    promotion = relationship("Promotion", back_populates="rectifications")
    inspection = relationship("DisplayInspection", back_populates="rectifications")


class ThresholdConfig(Base):
    __tablename__ = "threshold_configs"

    id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String(64), unique=True, nullable=False, index=True)
    config_name = Column(String(128), nullable=False)
    config_value = Column(Float, nullable=False)
    config_unit = Column(String(32))
    value_type = Column(String(32), default="count")
    min_value = Column(Float)
    max_value = Column(Float)
    category = Column(String(64), index=True)
    description = Column(Text)
    current_modified_by = Column(String(64))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    history = relationship("ThresholdChangeLog", back_populates="config")


class ThresholdChangeLog(Base):
    __tablename__ = "threshold_change_logs"

    id = Column(Integer, primary_key=True, index=True)
    config_id = Column(Integer, ForeignKey("threshold_configs.id"), nullable=False, index=True)
    old_value = Column(Float, nullable=False)
    new_value = Column(Float, nullable=False)
    changed_by = Column(String(64), nullable=False, index=True)
    change_reason = Column(Text)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())

    config = relationship("ThresholdConfig", back_populates="history")


class ExceptionAnnotation(Base):
    __tablename__ = "exception_annotations"

    id = Column(Integer, primary_key=True, index=True)
    promotion_id = Column(Integer, ForeignKey("promotions.id"), nullable=False, index=True)
    annotation_date = Column(Date, nullable=False, index=True)
    exception_type = Column(String(32), nullable=False, index=True)
    exception_description = Column(Text, nullable=False)
    impact_degree = Column(String(32), default="medium")
    review_note = Column(Text)
    review_by = Column(String(64))
    created_by = Column(String(64))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index("idx_anno_promo_date_type", "promotion_id", "annotation_date", "exception_type"),
    )


class RefreshLog(Base):
    __tablename__ = "refresh_logs"

    id = Column(Integer, primary_key=True, index=True)
    refresh_type = Column(String(32), nullable=False, default="manual")
    triggered_by = Column(String(64))
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    records_processed = Column(Integer, default=0)
    exceptions_found = Column(JSON, default=dict)
    status = Column(String(32), default="running")
    remark = Column(Text)
