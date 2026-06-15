from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, Numeric, String, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class StudentPractice(Base):
    __tablename__ = "student_practice"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    batch_id = Column(String(50), ForeignKey("batch_import.batch_id"))
    is_correct = Column(Boolean)
    duration_seconds = Column(Integer)
    practice_time = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="practices")
    question = relationship("Question", back_populates="practices")
    batch = relationship("BatchImport", back_populates="practices")


class HomeworkRecord(Base):
    __tablename__ = "homework_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    homework_id = Column(Integer, nullable=False)
    batch_id = Column(String(50), ForeignKey("batch_import.batch_id"))
    status = Column(String(20), nullable=False)
    assigned_at = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True))
    submitted_at = Column(DateTime(timezone=True))
    graded_at = Column(DateTime(timezone=True))
    score = Column(Numeric(5, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="homeworks")
    batch = relationship("BatchImport", back_populates="homeworks")


class LearningProgress(Base):
    __tablename__ = "learning_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    chapter_id = Column(Integer, ForeignKey("chapters.id"))
    batch_id = Column(String(50), ForeignKey("batch_import.batch_id"))
    progress = Column(Numeric(5, 2), nullable=False)
    record_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="progress_records")
    chapter = relationship("Chapter", back_populates="progress_records")
    batch = relationship("BatchImport", back_populates="progress_records")
