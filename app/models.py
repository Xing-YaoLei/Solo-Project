from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, Boolean,
    ForeignKey, Text, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    real_name = Column(String(64))
    role = Column(String(32), nullable=False)
    email = Column(String(128))
    phone = Column(String(32))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)


class UserScope(Base):
    __tablename__ = 'user_scopes'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    scope_type = Column(String(32), nullable=False)
    scope_value = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index('idx_user_scope', 'user_id', 'scope_type'),
    )

    user = relationship('User', backref='scopes')


class ImportBatch(Base):
    __tablename__ = 'import_batches'

    id = Column(Integer, primary_key=True)
    batch_no = Column(String(64), unique=True, nullable=False, index=True)
    batch_type = Column(String(32), nullable=False)
    source_file = Column(String(512))
    total_records = Column(Integer, default=0)
    success_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    status = Column(String(32), nullable=False)
    error_message = Column(Text)
    imported_by = Column(Integer, ForeignKey('users.id'))
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)


class Property(Base):
    __tablename__ = 'properties'

    id = Column(Integer, primary_key=True)
    property_id = Column(String(64), unique=True, nullable=False, index=True)
    project_name = Column(String(128), index=True)
    building = Column(String(64))
    unit_no = Column(String(64))
    floor = Column(Integer)
    room_type = Column(String(32))
    area = Column(Float)
    district = Column(String(64), index=True)
    address = Column(String(512))
    photo_count = Column(Integer, default=0)
    listing_status = Column(String(32), default='draft', index=True)
    publish_time = Column(DateTime)
    manager_id = Column(Integer, ForeignKey('users.id'))
    batch_no = Column(String(64), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('idx_property_project', 'project_name', 'listing_status'),
        Index('idx_property_manager', 'manager_id', 'listing_status'),
    )

    manager = relationship('User', backref='managed_properties')


class PropertyPhoto(Base):
    __tablename__ = 'property_photos'

    id = Column(Integer, primary_key=True)
    property_id = Column(String(64), ForeignKey('properties.property_id'), nullable=False, index=True)
    photo_type = Column(String(32))
    photo_url = Column(String(512))
    upload_time = Column(DateTime)
    batch_no = Column(String(64), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Tenant(Base):
    __tablename__ = 'tenants'

    id = Column(Integer, primary_key=True)
    tenant_id = Column(String(64), unique=True, nullable=False, index=True)
    name = Column(String(64))
    id_card = Column(String(64))
    phone = Column(String(32))
    gender = Column(String(16))
    age = Column(Integer)
    occupation = Column(String(64))
    company = Column(String(128))
    emergency_contact = Column(String(64))
    profile_stage = Column(String(32), index=True)
    credit_score = Column(Integer)
    batch_no = Column(String(64), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Contract(Base):
    __tablename__ = 'contracts'

    id = Column(Integer, primary_key=True)
    contract_no = Column(String(64), unique=True, nullable=False, index=True)
    contract_version = Column(String(32), index=True)
    property_id = Column(String(64), ForeignKey('properties.property_id'), nullable=False, index=True)
    tenant_id = Column(String(64), ForeignKey('tenants.tenant_id'), index=True)
    contract_type = Column(String(32))
    monthly_rent = Column(Float)
    deposit_amount = Column(Float)
    start_date = Column(Date, index=True)
    end_date = Column(Date, index=True)
    payment_method = Column(String(32))
    contract_status = Column(String(32), default='pending', index=True)
    signed_at = Column(DateTime)
    e_sign_url = Column(String(512))
    overdue_status = Column(String(32), default='normal', index=True)
    overdue_days = Column(Integer, default=0)
    overdue_amount = Column(Float, default=0)
    batch_no = Column(String(64), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    property_ = relationship('Property', backref='contracts')
    tenant = relationship('Tenant', backref='contracts')


class OverdueNote(Base):
    __tablename__ = 'overdue_notes'

    id = Column(Integer, primary_key=True)
    contract_no = Column(String(64), ForeignKey('contracts.contract_no'), nullable=False, index=True)
    note_content = Column(Text, nullable=False)
    note_type = Column(String(32), default='remark')
    created_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)


class MeterReading(Base):
    __tablename__ = 'meter_readings'

    id = Column(Integer, primary_key=True)
    reading_id = Column(String(64), unique=True, nullable=False, index=True)
    contract_no = Column(String(64), ForeignKey('contracts.contract_no'), nullable=False, index=True)
    property_id = Column(String(64), ForeignKey('properties.property_id'), index=True)
    period = Column(String(16), index=True)
    meter_type = Column(String(32))
    last_reading = Column(Float)
    current_reading = Column(Float)
    usage = Column(Float)
    unit_price = Column(Float)
    amount = Column(Float)
    reading_date = Column(Date, index=True)
    batch_no = Column(String(64), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class RepairRecord(Base):
    __tablename__ = 'repair_records'

    id = Column(Integer, primary_key=True)
    repair_id = Column(String(64), unique=True, nullable=False, index=True)
    property_id = Column(String(64), ForeignKey('properties.property_id'), nullable=False, index=True)
    contract_no = Column(String(64), ForeignKey('contracts.contract_no'), index=True)
    repair_type = Column(String(64), index=True)
    description = Column(Text)
    report_time = Column(DateTime, index=True)
    assign_time = Column(DateTime)
    complete_time = Column(DateTime)
    repair_status = Column(String(32), default='pending', index=True)
    cost = Column(Float)
    repairer = Column(String(64))
    satisfaction = Column(Integer)
    batch_no = Column(String(64), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
