from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from models.database import Base


class CourseCatalog(Base):
    __tablename__ = "course_catalogs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    catalog_id = Column(String(50), unique=True, nullable=False, index=True, comment="课程目录编号")
    academic_term = Column(String(20), nullable=False, index=True, comment="学期")
    publish_date = Column(DateTime, comment="发布日期")
    status = Column(String(20), default="已发布", comment="状态")
    total_courses = Column(Integer, default=0, comment="课程总数")
    total_credits = Column(Integer, default=0, comment="总学分")
    description = Column(Text, comment="说明")
    remark = Column(String(500), comment="备注")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    courses = relationship("Course", back_populates="catalog")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_code = Column(String(50), unique=True, nullable=False, index=True, comment="课程编号")
    course_name = Column(String(200), nullable=False, comment="课程名称")
    catalog_id = Column(String(50), ForeignKey("course_catalogs.catalog_id"), index=True, comment="所属目录")
    academic_term = Column(String(20), nullable=False, index=True, comment="学期")
    college = Column(String(100), comment="开课学院")
    teacher = Column(String(50), comment="任课教师")
    teacher_id = Column(String(20), comment="教师工号")
    credit = Column(Integer, default=0, comment="学分")
    hours = Column(Integer, default=0, comment="学时")
    capacity = Column(Integer, default=0, comment="容量")
    enrolled_count = Column(Integer, default=0, comment="已选人数")
    course_type = Column(String(50), comment="课程类型")
    course_nature = Column(String(50), comment="课程性质")
    category = Column(String(50), comment="课程分类")
    prerequisites = Column(String(500), comment="先修课程")
    description = Column(Text, comment="课程简介")
    syllabus = Column(Text, comment="教学大纲")
    remark = Column(String(500), comment="备注")
    browse_count = Column(Integer, default=0, comment="浏览次数")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    catalog = relationship("CourseCatalog", back_populates="courses")
    schedules = relationship("Schedule", back_populates="course")
    applications = relationship("EnrollmentApplication", back_populates="course")

    def to_dict(self):
        return {
            "id": self.id,
            "course_code": self.course_code,
            "course_name": self.course_name,
            "catalog_id": self.catalog_id,
            "academic_term": self.academic_term,
            "college": self.college,
            "teacher": self.teacher,
            "credit": self.credit,
            "hours": self.hours,
            "capacity": self.capacity,
            "enrolled_count": self.enrolled_count,
            "course_type": self.course_type,
            "course_nature": self.course_nature,
            "remark": self.remark,
            "browse_count": self.browse_count,
        }
