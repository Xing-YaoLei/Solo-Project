from sqlalchemy import Column, Integer, String, DateTime, Date, Float, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from ..core.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_no = Column(String(50), unique=True, index=True, comment="统一学号")
    name = Column(String(100), index=True, comment="姓名")
    gender = Column(String(10), comment="性别")
    age = Column(Integer, comment="年龄")
    grade = Column(String(20), comment="年级")
    school = Column(String(200), comment="学校")
    phone = Column(String(20), comment="联系电话")
    address = Column(String(500), comment="地址")
    location = Column(Geometry(geometry_type='POINT', srid=4326), comment="地理坐标")
    region_id = Column(Integer, ForeignKey("regions.id"), comment="区域ID")
    data_source = Column(String(50), comment="数据来源：报名/教务/作业")
    is_merged = Column(Boolean, default=False, comment="是否已合并去重")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    enrollments = relationship("Enrollment", back_populates="student")
    academic_records = relationship("AcademicRecord", back_populates="student")
    homeworks = relationship("Homework", back_populates="student")
    distributions = relationship("MaterialDistribution", back_populates="student")
    note_tasks = relationship("NoteTask", back_populates="student")


class Region(Base):
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), comment="区域名称")
    code = Column(String(20), unique=True, comment="区域编码")
    level = Column(String(20), comment="层级：province/city/district")
    parent_id = Column(Integer, ForeignKey("regions.id"), comment="父级区域")
    geom = Column(Geometry(geometry_type='MULTIPOLYGON', srid=4326), comment="区域边界")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    enrollment_no = Column(String(50), unique=True, comment="报名编号")
    student_id = Column(Integer, ForeignKey("students.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    enrollment_date = Column(Date, comment="报名日期")
    source_channel = Column(String(50), comment="报名渠道")
    status = Column(String(20), default="active", comment="报名状态")
    raw_data = Column(JSON, comment="原始数据快照")
    is_cleaned = Column(Boolean, default=False, comment="是否已清洗")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


class AcademicRecord(Base):
    __tablename__ = "academic_records"

    id = Column(Integer, primary_key=True, index=True)
    record_no = Column(String(50), unique=True, comment="教务记录编号")
    student_id = Column(Integer, ForeignKey("students.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    chapter_id = Column(Integer, ForeignKey("course_chapters.id"))
    attend_count = Column(Integer, default=0, comment="出勤次数")
    total_classes = Column(Integer, default=0, comment="总课次")
    attendance_rate = Column(Float, comment="出勤率")
    score = Column(Float, comment="成绩")
    grade_level = Column(String(20), comment="成绩等级")
    record_date = Column(Date, comment="记录日期")
    raw_data = Column(JSON, comment="原始数据快照")
    is_cleaned = Column(Boolean, default=False, comment="是否已清洗")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="academic_records")
    course = relationship("Course")
    chapter = relationship("CourseChapter")


class Homework(Base):
    __tablename__ = "homeworks"

    id = Column(Integer, primary_key=True, index=True)
    homework_no = Column(String(50), unique=True, comment="作业编号")
    student_id = Column(Integer, ForeignKey("students.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    chapter_id = Column(Integer, ForeignKey("course_chapters.id"))
    submit_time = Column(DateTime, comment="提交时间")
    score = Column(Float, comment="作业分数")
    is_submitted = Column(Boolean, default=False, comment="是否提交")
    is_late = Column(Boolean, default=False, comment="是否迟交")
    feedback = Column(Text, comment="老师评语")
    raw_data = Column(JSON, comment="原始数据快照")
    is_cleaned = Column(Boolean, default=False, comment="是否已清洗")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="homeworks")
    course = relationship("Course")
    chapter = relationship("CourseChapter")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(50), unique=True, comment="课程编码")
    name = Column(String(200), comment="课程名称")
    subject = Column(String(50), comment="学科")
    grade_range = Column(String(50), comment="适用年级")
    total_hours = Column(Integer, comment="总课时")
    total_chapters = Column(Integer, comment="总章节数")
    description = Column(Text, comment="课程描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    enrollments = relationship("Enrollment", back_populates="course")
    chapters = relationship("CourseChapter", back_populates="course")
    textbooks = relationship("Textbook", back_populates="course")


class CourseChapter(Base):
    __tablename__ = "course_chapters"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    chapter_no = Column(Integer, comment="章节序号")
    title = Column(String(200), comment="章节标题")
    hours = Column(Integer, comment="课时数")
    has_textbook = Column(Boolean, default=False, comment="是否有配套教材")
    textbook_id = Column(Integer, ForeignKey("textbooks.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course", back_populates="chapters")
    textbook = relationship("Textbook")


class Textbook(Base):
    __tablename__ = "textbooks"

    id = Column(Integer, primary_key=True, index=True)
    isbn = Column(String(20), unique=True, comment="ISBN")
    title = Column(String(200), comment="教材名称")
    subject = Column(String(50), comment="学科")
    grade = Column(String(20), comment="适用年级")
    course_id = Column(Integer, ForeignKey("courses.id"))
    total_copies = Column(Integer, default=0, comment="总数量")
    distributed_copies = Column(Integer, default=0, comment="已发放数量")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course", back_populates="textbooks")
    distributions = relationship("MaterialDistribution", back_populates="textbook")


class MaterialDistribution(Base):
    __tablename__ = "material_distributions"

    id = Column(Integer, primary_key=True, index=True)
    distribution_no = Column(String(50), unique=True, comment="发放编号")
    student_id = Column(Integer, ForeignKey("students.id"))
    textbook_id = Column(Integer, ForeignKey("textbooks.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    chapter_id = Column(Integer, ForeignKey("course_chapters.id"))
    status = Column(String(20), default="pending", comment="发放状态：pending/distributed/received/returned")
    distribute_date = Column(Date, comment="发放日期")
    receive_date = Column(Date, comment="签收日期")
    channel = Column(String(50), comment="发放渠道：线下/邮寄/自提")
    tracking_no = Column(String(100), comment="物流单号")
    is_delayed = Column(Boolean, default=False, comment="是否延迟发放")
    delay_reason = Column(Text, comment="延迟原因")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    student = relationship("Student", back_populates="distributions")
    textbook = relationship("Textbook", back_populates="distributions")


class AlertThreshold(Base):
    __tablename__ = "alert_thresholds"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), comment="阈值名称")
    type = Column(String(50), comment="阈值类型：completion_rate/delay_days/homework_rate")
    threshold_value = Column(Float, comment="阈值")
    operator = Column(String(10), default="lt", comment="比较符：lt/gt/eq")
    level = Column(String(20), default="warning", comment="预警级别：info/warning/danger")
    scope = Column(String(50), default="all", comment="适用范围")
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=True)
    is_active = Column(Boolean, default=True, comment="是否启用")
    created_by = Column(String(100), comment="创建人")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class NoteTask(Base):
    __tablename__ = "note_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_no = Column(String(50), unique=True, comment="任务编号")
    student_id = Column(Integer, ForeignKey("students.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    type = Column(String(50), comment="任务类型：completion_alert/quality_issue/delay_warning")
    title = Column(String(200), comment="任务标题")
    content = Column(Text, comment="任务内容")
    conclusion = Column(Text, comment="处理结论")
    status = Column(String(20), default="pending", comment="状态：pending/processing/resolved")
    priority = Column(String(20), default="medium", comment="优先级")
    assigned_to = Column(String(100), comment="负责人")
    trigger_threshold_id = Column(Integer, ForeignKey("alert_thresholds.id"))
    chart_ref = Column(String(100), comment="关联图表标识")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))

    student = relationship("Student", back_populates="note_tasks")


class ReviewMaterial(Base):
    __tablename__ = "review_materials"

    id = Column(Integer, primary_key=True, index=True)
    material_no = Column(String(50), unique=True, comment="复盘材料编号")
    title = Column(String(200), comment="复盘标题")
    type = Column(String(50), comment="复盘类型：weekly/monthly/course/region")
    period_start = Column(Date, comment="统计周期开始")
    period_end = Column(Date, comment="统计周期结束")
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=True)
    completion_rate = Column(Float, comment="完成率")
    alert_count = Column(Integer, default=0, comment="预警数量")
    summary = Column(Text, comment="复盘摘要")
    key_issues = Column(JSON, comment="关键问题列表")
    improvements = Column(JSON, comment="改进措施")
    charts_data = Column(JSON, comment="图表数据快照")
    status = Column(String(20), default="draft", comment="状态：draft/published/archived")
    created_by = Column(String(100), comment="创建人")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ReminderRule(Base):
    __tablename__ = "reminder_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), comment="规则名称")
    type = Column(String(50), comment="规则类型：distribute/receive/homework")
    trigger_days = Column(Integer, comment="触发天数")
    template = Column(Text, comment="提醒模板")
    channel = Column(String(50), comment="提醒渠道：sms/email/app")
    is_active = Column(Boolean, default=True, comment="是否启用")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DataSourceSync(Base):
    __tablename__ = "data_source_syncs"

    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(50), comment="数据源名称：enrollment/academic/homework")
    sync_type = Column(String(20), comment="同步类型：full/incremental")
    record_count = Column(Integer, default=0, comment="同步记录数")
    clean_count = Column(Integer, default=0, comment="清洗后数量")
    dedup_count = Column(Integer, default=0, comment="去重数量")
    status = Column(String(20), default="running", comment="状态")
    error_message = Column(Text, comment="错误信息")
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True))
