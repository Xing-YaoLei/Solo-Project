from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_no = Column(String(50), unique=True, index=True)
    name = Column(String(100))
    gender = Column(String(10))
    birth_date = Column(DateTime)
    major = Column(String(200))
    class_name = Column(String(100))
    enrollment_date = Column(DateTime)
    phone = Column(String(20))
    email = Column(String(200))
    status = Column(String(20), default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    grades = relationship("Grade", back_populates="student")
    enrollments = relationship("Enrollment", back_populates="student")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(50), unique=True, index=True)
    course_name = Column(String(200))
    description = Column(Text)
    credit = Column(Float, default=0)
    total_hours = Column(Integer, default=0)
    instructor = Column(String(100))
    department = Column(String(200))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    chapters = relationship("Chapter", back_populates="course")
    enrollments = relationship("Enrollment", back_populates="course")


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    chapter_no = Column(String(50))
    chapter_name = Column(String(200))
    description = Column(Text)
    sort_order = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    passing_score = Column(Float, default=60)

    course = relationship("Course", back_populates="chapters")
    questions = relationship("Question", back_populates="chapter")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"))
    question_type = Column(String(50))
    difficulty = Column(String(20))
    content = Column(Text)
    options = Column(JSON)
    correct_answer = Column(String(500))
    score = Column(Float, default=10)
    tags = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    chapter = relationship("Chapter", back_populates="questions")


class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    chapter_id = Column(Integer, ForeignKey("chapters.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    score = Column(Float)
    total_questions = Column(Integer)
    correct_count = Column(Integer)
    time_spent = Column(Integer)
    submit_time = Column(DateTime(timezone=True))
    is_passed = Column(Boolean, default=False)
    attempt_count = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="grades")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    enrollment_date = Column(DateTime(timezone=True), server_default=func.now())
    progress = Column(Float, default=0)
    status = Column(String(20), default="in_progress")
    completed_chapters = Column(Integer, default=0)
    total_chapters = Column(Integer, default=0)
    last_activity_at = Column(DateTime(timezone=True))

    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
