from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from models.database import Base
import enum


class EnrollmentStatus(str, enum.Enum):
    BROWSED = "已浏览"
    SUBMITTED = "已提交"
    FIRST_REVIEW = "初审中"
    FIRST_PASS = "初审通过"
    FIRST_REJECT = "初审驳回"
    SCHEDULING = "排课中"
    SCHEDULED = "已排课"
    FINAL_REVIEW = "终审中"
    FINAL_PASS = "终审通过"
    FINAL_REJECT = "终审驳回"
    SUCCESS = "选课成功"
    CANCELLED = "已取消"


STAGE_ORDER = {
    EnrollmentStatus.BROWSED: 1,
    EnrollmentStatus.SUBMITTED: 2,
    EnrollmentStatus.FIRST_REVIEW: 3,
    EnrollmentStatus.FIRST_PASS: 3,
    EnrollmentStatus.FIRST_REJECT: 3,
    EnrollmentStatus.SCHEDULING: 4,
    EnrollmentStatus.SCHEDULED: 4,
    EnrollmentStatus.FINAL_REVIEW: 5,
    EnrollmentStatus.FINAL_PASS: 5,
    EnrollmentStatus.FINAL_REJECT: 5,
    EnrollmentStatus.SUCCESS: 6,
    EnrollmentStatus.CANCELLED: 0,
}


class EnrollmentApplication(Base):
    __tablename__ = "enrollment_applications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    application_no = Column(String(50), unique=True, nullable=False, index=True, comment="申请编号")
    student_id = Column(String(20), ForeignKey("students.student_id"), nullable=False, index=True, comment="学号")
    course_code = Column(String(50), ForeignKey("courses.course_code"), nullable=False, index=True, comment="课程编号")
    academic_term = Column(String(20), nullable=False, index=True, comment="学期")
    status = Column(Enum(EnrollmentStatus), default=EnrollmentStatus.SUBMITTED, index=True, comment="状态")
    apply_reason = Column(Text, comment="申请理由")
    first_reviewer = Column(String(50), comment="初审人")
    first_review_time = Column(DateTime, comment="初审时间")
    first_review_comment = Column(String(500), comment="初审意见")
    schedule_time = Column(DateTime, comment="排课时间")
    schedule_operator = Column(String(50), comment="排课操作人")
    final_reviewer = Column(String(50), comment="终审人")
    final_review_time = Column(DateTime, comment="终审时间")
    final_review_comment = Column(String(500), comment="终审意见")
    success_time = Column(DateTime, comment="成功时间")
    remark = Column(String(500), comment="备注")
    source_system = Column(String(50), comment="来源系统")
    raw_data_id = Column(Integer, comment="原始数据ID")
    first_review_duration = Column(Integer, default=0, comment="初审时长(小时)")
    schedule_duration = Column(Integer, default=0, comment="排课时长(小时)")
    final_review_duration = Column(Integer, default=0, comment="终审时长(小时)")
    total_duration = Column(Integer, default=0, comment="总时长(小时)")
    has_conflict = Column(Integer, default=0, comment="是否有冲突(0否1是)")
    created_at = Column(DateTime, default=datetime.now, index=True)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    browsed_at = Column(DateTime, comment="浏览时间")
    submitted_at = Column(DateTime, default=datetime.now, comment="提交时间")

    student = relationship("Student", back_populates="applications")
    course = relationship("Course", back_populates="applications")

    def to_dict(self):
        return {
            "id": self.id,
            "application_no": self.application_no,
            "student_id": self.student_id,
            "course_code": self.course_code,
            "academic_term": self.academic_term,
            "status": self.status.value if isinstance(self.status, EnrollmentStatus) else self.status,
            "first_review_duration": self.first_review_duration,
            "schedule_duration": self.schedule_duration,
            "final_review_duration": self.final_review_duration,
            "total_duration": self.total_duration,
            "has_conflict": self.has_conflict,
            "remark": self.remark,
            "submitted_at": self.submitted_at.strftime("%Y-%m-%d %H:%M:%S") if self.submitted_at else None,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
        }
