from sqlalchemy import Column, String, Integer, DateTime, Boolean, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from models.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(20), unique=True, nullable=False, index=True, comment="学号")
    name = Column(String(50), nullable=False, comment="姓名")
    gender = Column(String(10), comment="性别")
    college = Column(String(100), comment="学院")
    major = Column(String(100), comment="专业")
    grade = Column(String(20), comment="年级")
    class_name = Column(String(50), comment="班级")
    phone = Column(String(20), comment="联系电话")
    email = Column(String(100), comment="邮箱")
    enrollment_date = Column(Date, comment="入学日期")
    status = Column(String(20), default="在读", comment="学籍状态")
    smart_card_id = Column(String(50), unique=True, comment="一卡通号")
    is_verified = Column(Boolean, default=False, comment="身份核验通过")
    remark = Column(String(500), comment="备注")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    synced_at = Column(DateTime, comment="同步时间")

    applications = relationship("EnrollmentApplication", back_populates="student")

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "name": self.name,
            "gender": self.gender,
            "college": self.college,
            "major": self.major,
            "grade": self.grade,
            "class_name": self.class_name,
            "phone": self.phone,
            "email": self.email,
            "status": self.status,
            "smart_card_id": self.smart_card_id,
            "is_verified": self.is_verified,
            "remark": self.remark,
        }
