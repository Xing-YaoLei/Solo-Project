from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean,
    ForeignKey, Float, JSON
)
from sqlalchemy.orm import relationship, validates
from sqlalchemy.sql import func
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    TEACHER = "teacher"
    STUDENT = "student"


class RiskLevel(str, enum.Enum):
    NORMAL = "normal"
    WARNING = "warning"
    DANGER = "danger"
    CRITICAL = "critical"


class QuestionType(str, enum.Enum):
    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"
    ESSAY = "essay"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(200), nullable=False)
    full_name = Column(String(100))
    role = Column(String(20), default=UserRole.STUDENT.value, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    study_progresses = relationship("StudyProgress", back_populates="student")
    practice_records = relationship("PracticeRecord", back_populates="student")
    assigned_courses = relationship(
        "Course", secondary="course_teachers", back_populates="teachers"
    )
    communications = relationship("Communication", back_populates="sender")

    @validates("role")
    def validate_role(self, key, value):
        if isinstance(value, UserRole):
            return value.value
        if value not in [r.value for r in UserRole]:
            raise ValueError(f"Invalid role: {value}")
        return value


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, index=True)
    description = Column(Text)
    total_questions = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    chapters = relationship("Chapter", back_populates="course", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="course")
    teachers = relationship(
        "User", secondary="course_teachers", back_populates="assigned_courses"
    )
    study_progresses = relationship("StudyProgress", back_populates="course")


class CourseTeacher(Base):
    __tablename__ = "course_teachers"

    course_id = Column(Integer, ForeignKey("courses.id"), primary_key=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), primary_key=True)


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    name = Column(String(200), nullable=False)
    order_index = Column(Integer, default=0)
    description = Column(Text)
    question_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course", back_populates="chapters")
    questions = relationship("Question", back_populates="chapter")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(50))
    color = Column(String(20), default="#3b82f6")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    questions = relationship(
        "Question", secondary="question_tags", back_populates="tags"
    )


class QuestionTag(Base):
    __tablename__ = "question_tags"

    question_id = Column(Integer, ForeignKey("questions.id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    chapter_id = Column(Integer, ForeignKey("chapters.id"))
    question_type = Column(String(30), default=QuestionType.SINGLE_CHOICE.value)
    content = Column(Text, nullable=False)
    options = Column(JSON)
    correct_answer = Column(Text)
    explanation = Column(Text)
    difficulty = Column(Integer, default=2)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    course = relationship("Course", back_populates="questions")
    chapter = relationship("Chapter", back_populates="questions")
    tags = relationship(
        "Tag", secondary="question_tags", back_populates="questions"
    )
    practice_records = relationship("PracticeRecord", back_populates="question")

    @validates("question_type")
    def validate_question_type(self, key, value):
        if isinstance(value, QuestionType):
            return value.value
        if value not in [q.value for q in QuestionType]:
            raise ValueError(f"Invalid question_type: {value}")
        return value


class StudyProgress(Base):
    __tablename__ = "study_progresses"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    total_questions = Column(Integer, default=0)
    completed_questions = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    accuracy_rate = Column(Float, default=0.0)
    completion_rate = Column(Float, default=0.0)
    risk_level = Column(String(20), default=RiskLevel.NORMAL.value)
    last_practice_at = Column(DateTime(timezone=True))
    expected_completion_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    student = relationship("User", back_populates="study_progresses")
    course = relationship("Course", back_populates="study_progresses")
    risk_records = relationship("RiskRecord", back_populates="study_progress")
    reminder_records = relationship("ReminderRecord", back_populates="study_progress")

    @validates("risk_level")
    def validate_risk_level(self, key, value):
        if isinstance(value, RiskLevel):
            return value.value
        if value not in [r.value for r in RiskLevel]:
            raise ValueError(f"Invalid risk_level: {value}")
        return value


class PracticeRecord(Base):
    __tablename__ = "practice_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"))
    chapter_id = Column(Integer, ForeignKey("chapters.id"))
    user_answer = Column(Text)
    is_correct = Column(Boolean)
    score = Column(Float)
    time_spent = Column(Integer)
    attempt_number = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="practice_records")
    question = relationship("Question", back_populates="practice_records")


class ReminderRule(Base):
    __tablename__ = "reminder_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    rule_type = Column(String(50), default="completion_rate")
    threshold = Column(Float, nullable=False)
    risk_level = Column(String(20), default=RiskLevel.WARNING.value)
    days_without_practice = Column(Integer)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @validates("risk_level")
    def validate_risk_level(self, key, value):
        if isinstance(value, RiskLevel):
            return value.value
        if value not in [r.value for r in RiskLevel]:
            raise ValueError(f"Invalid risk_level: {value}")
        return value


class ReminderRecord(Base):
    __tablename__ = "reminder_records"

    id = Column(Integer, primary_key=True, index=True)
    study_progress_id = Column(Integer, ForeignKey("study_progresses.id"), nullable=False)
    rule_id = Column(Integer, ForeignKey("reminder_rules.id"))
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    study_progress = relationship("StudyProgress", back_populates="reminder_records")


class RiskRecord(Base):
    __tablename__ = "risk_records"

    id = Column(Integer, primary_key=True, index=True)
    study_progress_id = Column(Integer, ForeignKey("study_progresses.id"), nullable=False)
    previous_level = Column(String(20))
    current_level = Column(String(20), nullable=False)
    reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    study_progress = relationship("StudyProgress", back_populates="risk_records")

    @validates("previous_level", "current_level")
    def validate_risk_levels(self, key, value):
        if value is None:
            return None
        if isinstance(value, RiskLevel):
            return value.value
        if value not in [r.value for r in RiskLevel]:
            raise ValueError(f"Invalid {key}: {value}")
        return value


class Communication(Base):
    __tablename__ = "communications"

    id = Column(Integer, primary_key=True, index=True)
    study_progress_id = Column(Integer, ForeignKey("study_progresses.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    message_type = Column(String(50), default="comment")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    study_progress = relationship("StudyProgress")
    sender = relationship("User", back_populates="communications")


class ReviewConclusion(Base):
    __tablename__ = "review_conclusions"

    id = Column(Integer, primary_key=True, index=True)
    study_progress_id = Column(Integer, ForeignKey("study_progresses.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    conclusion = Column(Text, nullable=False)
    action_plan = Column(Text)
    risk_level_after = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    study_progress = relationship("StudyProgress")
    reviewer = relationship("User")

    @validates("risk_level_after")
    def validate_risk_level_after(self, key, value):
        if value is None:
            return None
        if isinstance(value, RiskLevel):
            return value.value
        if value not in [r.value for r in RiskLevel]:
            raise ValueError(f"Invalid risk_level_after: {value}")
        return value


class TodoItem(Base):
    __tablename__ = "todo_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    todo_type = Column(String(50), default="review")
    related_id = Column(Integer)
    priority = Column(Integer, default=2)
    is_completed = Column(Boolean, default=False)
    due_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
