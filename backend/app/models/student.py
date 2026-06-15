from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    class_id = Column(String(50))
    employee_no = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    practices = relationship("StudentPractice", back_populates="student")
    homeworks = relationship("HomeworkRecord", back_populates="student")
    progress_records = relationship("LearningProgress", back_populates="student")
    teacher_relations = relationship("TeacherStudent", back_populates="student")
    notes = relationship("ProgressNote", back_populates="student")


class TeacherStudent(Base):
    __tablename__ = "teacher_student"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    student_id = Column(Integer, ForeignKey("students.id"))

    teacher = relationship("User", back_populates="teacher_students")
    student = relationship("Student", back_populates="teacher_relations")
