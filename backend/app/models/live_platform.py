from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from ..core.database import Base


class LiveCourse(Base):
    __tablename__ = "live_courses"

    id = Column(Integer, primary_key=True, index=True)
    live_id = Column(String(100), unique=True, index=True)
    course_id = Column(Integer)
    title = Column(String(200))
    instructor = Column(String(100))
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    room_url = Column(String(500))
    status = Column(String(20), default="scheduled")
    max_viewers = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LiveViewRecord(Base):
    __tablename__ = "live_view_records"

    id = Column(Integer, primary_key=True, index=True)
    live_id = Column(String(100), index=True)
    student_id = Column(String(50), index=True)
    student_name = Column(String(100))
    join_time = Column(DateTime(timezone=True))
    leave_time = Column(DateTime(timezone=True))
    watch_duration = Column(Integer, default=0)
    is_complete = Column(Boolean, default=False)
    device = Column(String(50))
    ip_address = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LiveInteraction(Base):
    __tablename__ = "live_interactions"

    id = Column(Integer, primary_key=True, index=True)
    live_id = Column(String(100), index=True)
    student_id = Column(String(50), index=True)
    student_name = Column(String(100))
    interaction_type = Column(String(50))
    content = Column(Text)
    timestamp = Column(DateTime(timezone=True))
    is_answered = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LiveStatistics(Base):
    __tablename__ = "live_statistics"

    id = Column(Integer, primary_key=True, index=True)
    live_id = Column(String(100), unique=True, index=True)
    course_id = Column(Integer)
    total_viewers = Column(Integer, default=0)
    peak_viewers = Column(Integer, default=0)
    avg_watch_duration = Column(Float, default=0)
    total_chat_messages = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    total_likes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
