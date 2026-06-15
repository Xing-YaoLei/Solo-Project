from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean, JSON
from datetime import datetime
from models.database import Base


class RawStudentApplication(Base):
    __tablename__ = "raw_student_applications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String(50), index=True, comment="批次号")
    source_id = Column(String(100), comment="源系统ID")
    student_id = Column(String(20), index=True, comment="学号")
    student_name = Column(String(50), comment="姓名")
    course_code = Column(String(50), index=True, comment="课程编号")
    course_name = Column(String(200), comment="课程名称")
    academic_term = Column(String(20), index=True, comment="学期")
    apply_time = Column(DateTime, comment="申请时间")
    apply_status = Column(String(50), comment="申请状态")
    apply_reason = Column(Text, comment="申请理由")
    raw_payload = Column(JSON, comment="原始载荷")
    is_processed = Column(Boolean, default=False, index=True, comment="是否已处理")
    is_anomaly = Column(Boolean, default=False, index=True, comment="是否异常")
    anomaly_note = Column(String(500), comment="异常说明")
    synced_at = Column(DateTime, default=datetime.now, comment="同步时间")
    processed_at = Column(DateTime, comment="处理时间")
    remark = Column(String(500), comment="备注")
    created_at = Column(DateTime, default=datetime.now)


class RawTeachingPlatform(Base):
    __tablename__ = "raw_teaching_platform"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String(50), index=True, comment="批次号")
    source_id = Column(String(100), comment="源系统ID")
    data_type = Column(String(50), index=True, comment="数据类型(course/schedule/catalog)")
    course_code = Column(String(50), index=True, comment="课程编号")
    course_name = Column(String(200), comment="课程名称")
    academic_term = Column(String(20), index=True, comment="学期")
    room_code = Column(String(50), index=True, comment="教室编号")
    weekday = Column(String(10), comment="星期几")
    time_slot = Column(String(30), comment="时间段")
    teacher = Column(String(50), comment="教师")
    capacity = Column(Integer, comment="容量")
    review_status = Column(String(50), comment="审核状态")
    reviewer = Column(String(50), comment="审核人")
    review_time = Column(DateTime, comment="审核时间")
    review_comment = Column(String(500), comment="审核意见")
    raw_payload = Column(JSON, comment="原始载荷")
    is_processed = Column(Boolean, default=False, index=True, comment="是否已处理")
    is_anomaly = Column(Boolean, default=False, index=True, comment="是否异常")
    anomaly_note = Column(String(500), comment="异常说明")
    synced_at = Column(DateTime, default=datetime.now, comment="同步时间")
    processed_at = Column(DateTime, comment="处理时间")
    remark = Column(String(500), comment="备注")
    created_at = Column(DateTime, default=datetime.now)


class RawSmartCard(Base):
    __tablename__ = "raw_smart_cards"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String(50), index=True, comment="批次号")
    source_id = Column(String(100), comment="源系统ID")
    card_id = Column(String(50), index=True, comment="一卡通号")
    student_id = Column(String(20), index=True, comment="学号")
    student_name = Column(String(50), comment="姓名")
    card_status = Column(String(20), comment="卡片状态")
    identity_verified = Column(Boolean, comment="身份核验")
    last_verify_time = Column(DateTime, comment="最近核验时间")
    verify_location = Column(String(100), comment="核验地点")
    raw_payload = Column(JSON, comment="原始载荷")
    is_processed = Column(Boolean, default=False, index=True, comment="是否已处理")
    is_anomaly = Column(Boolean, default=False, index=True, comment="是否异常")
    anomaly_note = Column(String(500), comment="异常说明")
    synced_at = Column(DateTime, default=datetime.now, comment="同步时间")
    processed_at = Column(DateTime, comment="处理时间")
    remark = Column(String(500), comment="备注")
    created_at = Column(DateTime, default=datetime.now)
