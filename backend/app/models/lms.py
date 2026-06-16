from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from ..core.database import Base


class LearningPath(Base):
    __tablename__ = "learning_paths"

    id = Column(Integer, primary_key=True, index=True)
    path_id = Column(String(100), unique=True, index=True)
    student_id = Column(String(50), index=True)
    student_name = Column(String(100))
    course_id = Column(Integer, index=True)
    course_name = Column(String(200))
    current_chapter = Column(String(200))
    current_step = Column(Integer, default=0)
    total_steps = Column(Integer, default=0)
    progress = Column(Float, default=0)
    estimated_completion_date = Column(DateTime)
    actual_completion_date = Column(DateTime)
    status = Column(String(20), default="in_progress")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class LearningActivityLog(Base):
    __tablename__ = "learning_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(String(100), unique=True, index=True)
    student_id = Column(String(50), index=True)
    student_name = Column(String(100))
    course_id = Column(Integer)
    course_name = Column(String(200))
    chapter_id = Column(Integer)
    chapter_name = Column(String(200))
    activity_type = Column(String(50))
    activity_content = Column(Text)
    resource_type = Column(String(50))
    resource_id = Column(String(100))
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    duration = Column(Integer, default=0)
    is_complete = Column(Boolean, default=False)
    score = Column(Float)
    ip_address = Column(String(50))
    device_info = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LearningMilestone(Base):
    __tablename__ = "learning_milestones"

    id = Column(Integer, primary_key=True, index=True)
    milestone_id = Column(String(100), unique=True, index=True)
    student_id = Column(String(50), index=True)
    course_id = Column(Integer)
    milestone_name = Column(String(200))
    milestone_type = Column(String(50))
    description = Column(Text)
    achieved_at = Column(DateTime(timezone=True))
    reward_points = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LearningAssessment(Base):
    __tablename__ = "learning_assessments"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(String(100), unique=True, index=True)
    student_id = Column(String(50), index=True)
    course_id = Column(Integer)
    chapter_id = Column(Integer)
    assessment_type = Column(String(50))
    total_score = Column(Float)
    earned_score = Column(Float)
    passed = Column(Boolean, default=False)
    attempt_count = Column(Integer, default=1)
    time_spent = Column(Integer)
    questions_answered = Column(JSON)
    feedback = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LearningRecommendation(Base):
    __tablename__ = "learning_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), index=True)
    course_id = Column(Integer)
    recommendation_type = Column(String(50))
    content = Column(Text)
    reason = Column(Text)
    priority = Column(String(20), default="normal")
    is_viewed = Column(Boolean, default=False)
    is_accepted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
