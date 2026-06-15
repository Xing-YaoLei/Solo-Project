from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from models.database import Base


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    schedule_id = Column(String(50), unique=True, nullable=False, index=True, comment="排课编号")
    course_code = Column(String(50), ForeignKey("courses.course_code"), nullable=False, index=True, comment="课程编号")
    room_code = Column(String(50), ForeignKey("classrooms.room_code"), nullable=False, index=True, comment="教室编号")
    academic_term = Column(String(20), nullable=False, index=True, comment="学期")
    weekday = Column(String(10), nullable=False, comment="星期几")
    time_slot = Column(String(30), nullable=False, comment="时间段")
    start_week = Column(Integer, default=1, comment="起始周")
    end_week = Column(Integer, default=16, comment="结束周")
    week_type = Column(String(20), default="全周", comment="周类型")
    teacher = Column(String(50), comment="教师")
    student_count = Column(Integer, default=0, comment="学生人数")
    is_conflict = Column(Boolean, default=False, index=True, comment="是否有冲突")
    conflict_detail = Column(Text, comment="冲突详情")
    remark = Column(String(500), comment="备注")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    course = relationship("Course", back_populates="schedules")
    classroom = relationship("Classroom", back_populates="schedules")

    def to_dict(self):
        return {
            "id": self.id,
            "schedule_id": self.schedule_id,
            "course_code": self.course_code,
            "room_code": self.room_code,
            "academic_term": self.academic_term,
            "weekday": self.weekday,
            "time_slot": self.time_slot,
            "start_week": self.start_week,
            "end_week": self.end_week,
            "week_type": self.week_type,
            "teacher": self.teacher,
            "student_count": self.student_count,
            "is_conflict": self.is_conflict,
            "conflict_detail": self.conflict_detail,
            "remark": self.remark,
        }


class ClassroomConflict(Base):
    __tablename__ = "classroom_conflicts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conflict_id = Column(String(50), unique=True, nullable=False, index=True, comment="冲突编号")
    room_code = Column(String(50), ForeignKey("classrooms.room_code"), nullable=False, index=True, comment="教室编号")
    academic_term = Column(String(20), nullable=False, index=True, comment="学期")
    weekday = Column(String(10), nullable=False, comment="星期几")
    time_slot = Column(String(30), nullable=False, comment="时间段")
    schedule_id_1 = Column(String(50), nullable=False, comment="排课编号1")
    schedule_id_2 = Column(String(50), nullable=False, comment="排课编号2")
    course_code_1 = Column(String(50), comment="课程1")
    course_code_2 = Column(String(50), comment="课程2")
    course_name_1 = Column(String(200), comment="课程名1")
    course_name_2 = Column(String(200), comment="课程名2")
    conflict_type = Column(String(50), default="教室冲突", comment="冲突类型")
    severity = Column(String(20), default="高", comment="严重程度")
    status = Column(String(20), default="未处理", index=True, comment="处理状态")
    handler = Column(String(50), comment="处理人")
    handled_at = Column(DateTime, comment="处理时间")
    handle_note = Column(String(500), comment="处理说明")
    remark = Column(String(500), comment="备注")
    detected_at = Column(DateTime, default=datetime.now, comment="检测时间")
    created_at = Column(DateTime, default=datetime.now)

    classroom = relationship("Classroom", back_populates="conflicts")

    def to_dict(self):
        return {
            "id": self.id,
            "conflict_id": self.conflict_id,
            "room_code": self.room_code,
            "weekday": self.weekday,
            "time_slot": self.time_slot,
            "course_name_1": self.course_name_1,
            "course_name_2": self.course_name_2,
            "severity": self.severity,
            "status": self.status,
            "detected_at": self.detected_at.strftime("%Y-%m-%d %H:%M:%S") if self.detected_at else None,
            "remark": self.remark,
        }
