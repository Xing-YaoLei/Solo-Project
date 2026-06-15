from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)

    chapters = relationship("Chapter", back_populates="course")


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    name = Column(String(200), nullable=False)
    order_index = Column(Integer, nullable=False)

    course = relationship("Course", back_populates="chapters")
    questions = relationship("Question", back_populates="chapter")
    progress_records = relationship("LearningProgress", back_populates="chapter")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"))
    content = Column(Text, nullable=False)
    difficulty = Column(String(20))

    chapter = relationship("Chapter", back_populates="questions")
    practices = relationship("StudentPractice", back_populates="question")
    tags = relationship("QuestionTagRelation", back_populates="question")


class QuestionTag(Base):
    __tablename__ = "question_tags"

    id = Column(Integer, primary_key=True, index=True)
    tag_name = Column(String(50), unique=True, nullable=False)

    questions = relationship("QuestionTagRelation", back_populates="tag")


class QuestionTagRelation(Base):
    __tablename__ = "question_tag_relation"

    question_id = Column(Integer, ForeignKey("questions.id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("question_tags.id"), primary_key=True)

    question = relationship("Question", back_populates="tags")
    tag = relationship("QuestionTag", back_populates="questions")
