from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Date, Text, Boolean, JSON, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    ADVISOR = "advisor"
    STUDENT_AFFAIRS = "student_affairs"
    AUDITOR = "auditor"


class ReviewStatus(str, enum.Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    MATERIALS_MISSING = "materials_missing"
    APPROVED = "approved"
    REJECTED = "rejected"
    CLOSED = "closed"


class NotificationType(str, enum.Enum):
    MATERIALS_MISSING = "materials_missing"
    REVIEW_STATUS_CHANGED = "review_status_changed"
    ADVISOR_QUOTA_CHANGED = "advisor_quota_changed"
    REPORT_READY = "report_ready"
    SYSTEM_ALERT = "system_alert"


class AuditAction(str, enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    STATUS_CHANGE = "status_change"
    DOWNLOAD = "download"
    NOTIFY = "notify"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100))
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.TEACHER)
    department = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(30), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    gender = Column(String(10))
    grade = Column(String(20))
    major = Column(String(100))
    class_name = Column(String(50))
    department = Column(String(100))
    phone = Column(String(20))
    email = Column(String(100))
    advisor_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    scores = relationship("Score", back_populates="student", cascade="all, delete-orphan")
    reviews = relationship("ReviewApplication", back_populates="student", cascade="all, delete-orphan")
    advisor = relationship("User", foreign_keys=[advisor_id])


class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(30), unique=True, index=True, nullable=False)
    course_name = Column(String(200), nullable=False)
    credit = Column(Float, nullable=False)
    semester = Column(String(20))
    department = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    scores = relationship("Score", back_populates="course")


class Score(Base):
    __tablename__ = "scores"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    usual_score = Column(Float)
    midterm_score = Column(Float)
    final_score = Column(Float)
    total_score = Column(Float, nullable=False)
    grade_point = Column(Float)
    score_level = Column(String(10))
    semester = Column(String(20))
    teacher_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", back_populates="scores")
    course = relationship("Course", back_populates="scores")
    teacher = relationship("User", foreign_keys=[teacher_id])


class ReviewApplication(Base):
    __tablename__ = "review_applications"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    score_id = Column(Integer, ForeignKey("scores.id"))
    application_no = Column(String(50), unique=True, index=True)
    reason = Column(Text, nullable=False)
    current_score = Column(Float, nullable=False)
    expected_score = Column(Float)
    status = Column(SAEnum(ReviewStatus), nullable=False, default=ReviewStatus.PENDING)
    materials = Column(JSON, default=list)
    missing_materials = Column(JSON, default=list)
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    handler_id = Column(Integer, ForeignKey("users.id"))
    review_result = Column(Text)
    adjusted_score = Column(Float)
    applied_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime)
    closed_at = Column(DateTime)
    deadline = Column(Date)

    student = relationship("Student", back_populates="reviews")
    course = relationship("Course")
    score = relationship("Score")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    handler = relationship("User", foreign_keys=[handler_id])
    audit_logs = relationship("AuditLog", back_populates="review", cascade="all, delete-orphan")


class AdvisorQuota(Base):
    __tablename__ = "advisor_quotas"
    id = Column(Integer, primary_key=True, index=True)
    advisor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    semester = Column(String(20), nullable=False)
    max_quota = Column(Integer, nullable=False)
    current_assigned = Column(Integer, default=0)
    department = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    advisor = relationship("User", foreign_keys=[advisor_id])
    change_histories = relationship("AdvisorQuotaChange", back_populates="quota", cascade="all, delete-orphan")


class AdvisorQuotaChange(Base):
    __tablename__ = "advisor_quota_changes"
    id = Column(Integer, primary_key=True, index=True)
    quota_id = Column(Integer, ForeignKey("advisor_quotas.id"), nullable=False)
    old_value = Column(Integer, nullable=False)
    new_value = Column(Integer, nullable=False)
    changed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(Text)
    changed_at = Column(DateTime, default=datetime.utcnow)

    quota = relationship("AdvisorQuota", back_populates="change_histories")
    changed_by = relationship("User", foreign_keys=[changed_by_id])


class Classroom(Base):
    __tablename__ = "classrooms"
    id = Column(Integer, primary_key=True, index=True)
    building = Column(String(50), nullable=False)
    room_no = Column(String(30), nullable=False)
    capacity = Column(Integer, nullable=False)
    room_type = Column(String(30))
    equipment = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)


class ClassroomSchedule(Base):
    __tablename__ = "classroom_schedules"
    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"))
    date = Column(Date, nullable=False)
    period_start = Column(Integer, nullable=False)
    period_end = Column(Integer, nullable=False)
    usage_type = Column(String(30))
    actual_attendance = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    classroom = relationship("Classroom")
    course = relationship("Course")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(SAEnum(NotificationType), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    review_id = Column(Integer, ForeignKey("review_applications.id"))
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    reason = Column(Text)
    action_taken = Column(Text)
    closed_at = Column(DateTime)
    is_read = Column(Boolean, default=False)
    is_processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    recipient = relationship("User", foreign_keys=[recipient_id])
    review = relationship("ReviewApplication")


class ReportDownload(Base):
    __tablename__ = "report_downloads"
    id = Column(Integer, primary_key=True, index=True)
    report_name = Column(String(200), nullable=False)
    report_type = Column(String(50), nullable=False)
    filter_criteria = Column(JSON, nullable=False)
    generated_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_path = Column(String(500))
    file_format = Column(String(20), default="xlsx")
    download_count = Column(Integer, default=0)
    task_id = Column(String(100))
    status = Column(String(20), default="pending")
    generated_at = Column(DateTime, default=datetime.utcnow)

    generated_by = relationship("User", foreign_keys=[generated_by_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    action = Column(SAEnum(AuditAction), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer)
    review_id = Column(Integer, ForeignKey("review_applications.id"))
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    old_values = Column(JSON)
    new_values = Column(JSON)
    reason = Column(Text)
    action_taken = Column(Text)
    closed_at = Column(DateTime)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

    operator = relationship("User", foreign_keys=[operator_id])
    review = relationship("ReviewApplication", back_populates="audit_logs")
