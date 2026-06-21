from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from config import Config

Base = declarative_base()


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_no = Column(String(64), unique=True, index=True, nullable=False)
    order_type = Column(String(32), default="instant", index=True)
    status = Column(String(32), index=True)
    user_id = Column(String(64), index=True)
    rider_id = Column(Integer, ForeignKey("riders.id"), index=True)
    pickup_address = Column(String(512))
    pickup_lat = Column(Float)
    pickup_lng = Column(Float)
    delivery_address = Column(String(512))
    delivery_lat = Column(Float)
    delivery_lng = Column(Float)
    distance_km = Column(Float)
    map_calibration_version = Column(String(32), default="v1")
    amount = Column(Float, default=0.0)
    subsidy_amount = Column(Float, default=0.0)
    compensation_amount = Column(Float, default=0.0)
    payment_status = Column(String(32), default="pending", index=True)
    payment_transaction_id = Column(String(128))
    rider_rejected = Column(Boolean, default=False)
    reject_count = Column(Integer, default=0)
    system_delay_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    paid_at = Column(DateTime)
    assigned_at = Column(DateTime)
    picked_at = Column(DateTime)
    delivered_at = Column(DateTime)
    completed_at = Column(DateTime)
    extra = Column(JSON, default=dict)

    rider = relationship("Rider", back_populates="orders")
    funnel_events = relationship("FunnelEvent", back_populates="order")
    anomalies = relationship("Anomaly", back_populates="order")
    review_notes = relationship("ReviewNote", back_populates="order")

    __table_args__ = (
        Index("idx_orders_created_type", "created_at", "order_type"),
        Index("idx_orders_status_payment", "status", "payment_status"),
    )


class Rider(Base):
    __tablename__ = "riders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rider_no = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(128))
    phone = Column(String(32))
    status = Column(String(32), default="active", index=True)
    level = Column(String(32), default="normal")
    total_orders = Column(Integer, default=0)
    reject_rate = Column(Float, default=0.0)
    on_time_rate = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    extra = Column(JSON, default=dict)

    orders = relationship("Order", back_populates="rider")
    tracks = relationship("RiderTrack", back_populates="rider")


class RiderTrack(Base):
    __tablename__ = "rider_tracks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rider_id = Column(Integer, ForeignKey("riders.id"), index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    speed = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    is_anomaly = Column(Boolean, default=False, index=True)
    anomaly_type = Column(String(64))
    anomaly_note_id = Column(Integer, ForeignKey("track_anomaly_notes.id"))

    rider = relationship("Rider", back_populates="tracks")
    anomaly_note = relationship("TrackAnomalyNote", back_populates="tracks", uselist=False)


class SubsidyRule(Base):
    __tablename__ = "subsidy_rules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rule_name = Column(String(256), nullable=False)
    rule_type = Column(String(64), index=True)
    conditions = Column(JSON, default=dict)
    subsidy_amount = Column(Float, default=0.0)
    subsidy_percentage = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True, index=True)
    effective_from = Column(DateTime)
    effective_to = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    saved_view_name = Column(String(256))
    extra = Column(JSON, default=dict)


class FunnelEvent(Base):
    __tablename__ = "funnel_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), index=True, nullable=False)
    event_name = Column(String(64), index=True, nullable=False)
    event_timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    event_source = Column(String(64))
    duration_seconds = Column(Integer, default=0)
    is_drop_off = Column(Boolean, default=False)
    drop_off_reason = Column(String(256))
    extra = Column(JSON, default=dict)

    order = relationship("Order", back_populates="funnel_events")


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    anomaly_type = Column(String(64), index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), index=True)
    rider_id = Column(Integer, ForeignKey("riders.id"), index=True)
    detected_at = Column(DateTime, default=datetime.utcnow, index=True)
    affected_from = Column(DateTime, index=True)
    affected_to = Column(DateTime, index=True)
    severity = Column(String(32), default="medium")
    description = Column(Text)
    is_resolved = Column(Boolean, default=False, index=True)
    resolved_at = Column(DateTime)
    resolution_note = Column(Text)
    compensation_applied = Column(Float, default=0.0)
    extra = Column(JSON, default=dict)

    order = relationship("Order", back_populates="anomalies")


class ReviewNote(Base):
    __tablename__ = "review_notes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), index=True)
    anomaly_id = Column(Integer, ForeignKey("anomalies.id"), index=True)
    author = Column(String(128))
    content = Column(Text, nullable=False)
    review_type = Column(String(64), default="general")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    judgment_tag = Column(String(64))
    extra = Column(JSON, default=dict)

    order = relationship("Order", back_populates="review_notes")


class TrackAnomalyNote(Base):
    __tablename__ = "track_anomaly_notes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    author = Column(String(128))
    content = Column(Text, nullable=False)
    judgment_tag = Column(String(64))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    extra = Column(JSON, default=dict)

    tracks = relationship("RiderTrack", back_populates="anomaly_note")


class SavedView(Base):
    __tablename__ = "saved_views"

    id = Column(Integer, primary_key=True, autoincrement=True)
    view_name = Column(String(256), nullable=False)
    view_type = Column(String(64), index=True)
    filters = Column(JSON, default=dict)
    columns = Column(JSON, default=list)
    author = Column(String(128))
    is_shared = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


engine = create_engine(Config.DATABASE_URL, pool_size=10, max_overflow=20, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
