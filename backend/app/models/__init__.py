from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey,
    Float, Boolean, Enum, JSON, Date
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserRole(str, PyEnum):
    ADMIN = "admin"
    TRAINER = "trainer"
    MEMBER = "member"
    MANAGER = "manager"


class CourseStatus(str, PyEnum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PAUSED = "paused"


class ProgressStatus(str, PyEnum):
    ON_TRACK = "on_track"
    BEHIND = "behind"
    AHEAD = "ahead"


class NotificationStatus(str, PyEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    RESOLVED = "resolved"
    CLOSED = "closed"


class AssignmentType(str, PyEnum):
    EXERCISE = "exercise"
    CARDIO = "cardio"
    NUTRITION = "nutrition"
    ASSESSMENT = "assessment"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.MEMBER, nullable=False)
    avatar_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    courses_as_trainer = relationship("Course", back_populates="trainer", foreign_keys="Course.trainer_id")
    courses_as_member = relationship("CourseMember", back_populates="member")
    progress_records = relationship("ProgressRecord", back_populates="operator", foreign_keys="ProgressRecord.operator_id")
    sent_notifications = relationship("Notification", back_populates="from_user", foreign_keys="Notification.from_user_id")
    received_notifications = relationship("Notification", back_populates="to_user", foreign_keys="Notification.to_user_id")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    cover_url = Column(String(500))
    trainer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_sessions = Column(Integer, default=0, nullable=False)
    total_duration_hours = Column(Float, default=0.0)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(Enum(CourseStatus), default=CourseStatus.NOT_STARTED)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    trainer = relationship("User", back_populates="courses_as_trainer", foreign_keys=[trainer_id])
    chapters = relationship("Chapter", back_populates="course", cascade="all, delete-orphan")
    members = relationship("CourseMember", back_populates="course", cascade="all, delete-orphan")
    progress_records = relationship("ProgressRecord", back_populates="course", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="course", cascade="all, delete-orphan")


class CourseMember(Base):
    __tablename__ = "course_members"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    expected_progress_rate = Column(Float, default=0.0)
    actual_progress_rate = Column(Float, default=0.0)

    course = relationship("Course", back_populates="members")
    member = relationship("User", back_populates="courses_as_member")


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    chapter_order = Column(Integer, default=0)
    duration_minutes = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course", back_populates="chapters")
    assignments = relationship("Assignment", back_populates="chapter", cascade="all, delete-orphan")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    color = Column(String(20), default="#3B82F6")
    created_at = Column(DateTime, default=datetime.utcnow)

    assignments = relationship("AssignmentTag", back_populates="tag")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    assignment_type = Column(Enum(AssignmentType), default=AssignmentType.EXERCISE)
    sets = Column(Integer)
    reps = Column(String(50))
    weight = Column(Float)
    duration_minutes = Column(Integer)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    member_note = Column(Text)
    trainer_feedback = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    chapter = relationship("Chapter", back_populates="assignments")
    tags = relationship("AssignmentTag", back_populates="assignment", cascade="all, delete-orphan")


class AssignmentTag(Base):
    __tablename__ = "assignment_tags"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    tag_id = Column(Integer, ForeignKey("tags.id"), nullable=False)

    assignment = relationship("Assignment", back_populates="tags")
    tag = relationship("Tag", back_populates="assignments")


class ProgressRecord(Base):
    __tablename__ = "progress_records"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    chapter_id = Column(Integer, ForeignKey("chapters.id"))
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    old_progress = Column(Float, default=0.0)
    new_progress = Column(Float, default=0.0)
    progress_status = Column(Enum(ProgressStatus), default=ProgressStatus.ON_TRACK)
    consumed_sessions = Column(Integer, default=0)
    remaining_sessions = Column(Integer, default=0)
    change_reason = Column(Text)
    extra_data = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course", back_populates="progress_records")
    member = relationship("User", foreign_keys=[member_id])
    chapter = relationship("Chapter")
    operator = relationship("User", foreign_keys=[operator_id], back_populates="progress_records")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(Enum(NotificationStatus), default=NotificationStatus.PENDING)
    delay_reason = Column(Text)
    action_taken = Column(Text)
    resolved_at = Column(DateTime)
    closed_at = Column(DateTime)
    closed_by_id = Column(Integer, ForeignKey("users.id"))
    expected_progress = Column(Float, default=0.0)
    actual_progress = Column(Float, default=0.0)
    gap_hours = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    course = relationship("Course", back_populates="notifications")
    from_user = relationship("User", foreign_keys=[from_user_id], back_populates="sent_notifications")
    to_user = relationship("User", foreign_keys=[to_user_id], back_populates="received_notifications")
    member = relationship("User", foreign_keys=[member_id])
    closed_by = relationship("User", foreign_keys=[closed_by_id])


class ExportLog(Base):
    __tablename__ = "export_logs"

    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    export_type = Column(String(50), nullable=False)
    filter_conditions = Column(JSON, default=dict)
    file_url = Column(String(500))
    file_name = Column(String(200))
    generated_at = Column(DateTime, default=datetime.utcnow)

    operator = relationship("User")
