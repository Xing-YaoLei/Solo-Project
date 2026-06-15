from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON
from sqlalchemy.sql import func
from ..core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True)
    email = Column(String(200), unique=True, index=True)
    hashed_password = Column(String(255))
    role = Column(String(50), default="student")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ShareToken(Base):
    __tablename__ = "share_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(100), unique=True, index=True)
    chart_type = Column(String(100))
    permissions = Column(JSON)
    created_by = Column(Integer)
    expires_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)


class RefreshRecord(Base):
    __tablename__ = "refresh_records"

    id = Column(Integer, primary_key=True, index=True)
    data_source = Column(String(100))
    refreshed_at = Column(DateTime(timezone=True), server_default=func.now())
    record_count = Column(Integer, default=0)
    status = Column(String(50), default="success")
