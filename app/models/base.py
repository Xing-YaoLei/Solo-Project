from datetime import datetime
from app import db


class Course(db.Model):
    __tablename__ = "courses"

    id = db.Column(db.Integer, primary_key=True)
    course_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    course_name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100))
    major = db.Column(db.String(100))
    total_duration_hours = db.Column(db.Float, default=0)
    total_chapters = db.Column(db.Integer, default=0)
    target_completion_days = db.Column(db.Integer, default=30)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    chapters = db.relationship("CourseChapter", backref="course", lazy="dynamic")
    grades = db.relationship("Grade", backref="course", lazy="dynamic")

    def __repr__(self):
        return f"<Course {self.course_code}: {self.course_name}>"


class CourseChapter(db.Model):
    __tablename__ = "course_chapters"

    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False, index=True)
    chapter_number = db.Column(db.Integer, nullable=False)
    chapter_name = db.Column(db.String(200), nullable=False)
    duration_minutes = db.Column(db.Integer, default=0)
    is_required = db.Column(db.Boolean, default=True)
    pass_score = db.Column(db.Float, default=60)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    lms_records = db.relationship("LMSRecord", backref="chapter", lazy="dynamic")

    __table_args__ = (db.UniqueConstraint("course_id", "chapter_number", name="uq_course_chapter"),)

    def __repr__(self):
        return f"<Chapter {self.course_id}-{self.chapter_number}: {self.chapter_name}>"


class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    gender = db.Column(db.String(10))
    age = db.Column(db.Integer)
    major = db.Column(db.String(100))
    grade_class = db.Column(db.String(50))
    enrollment_date = db.Column(db.Date)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    grades = db.relationship("Grade", backref="student", lazy="dynamic")
    employments = db.relationship("Employment", backref="student", lazy="dynamic")
    lms_records = db.relationship("LMSRecord", backref="student", lazy="dynamic")
    live_sessions = db.relationship("LiveSession", backref="student", lazy="dynamic")
    notes = db.relationship("Note", backref="student", lazy="dynamic")

    def __repr__(self):
        return f"<Student {self.student_id}: {self.name}>"


class Grade(db.Model):
    __tablename__ = "grades"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False, index=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False, index=True)
    enroll_date = db.Column(db.Date, nullable=False)
    expected_complete_date = db.Column(db.Date)
    actual_complete_date = db.Column(db.Date)
    total_score = db.Column(db.Float)
    grade_level = db.Column(db.String(20))
    completion_rate = db.Column(db.Float, default=0)
    study_duration_minutes = db.Column(db.Integer, default=0)
    is_pass = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default="in_progress")
    progress_warning = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lms_records = db.relationship("LMSRecord", backref="grade", lazy="dynamic")
    notes = db.relationship("Note", backref="grade", lazy="dynamic")

    __table_args__ = (db.UniqueConstraint("student_id", "course_id", name="uq_student_course_grade"),)

    def __repr__(self):
        return f"<Grade Student:{self.student_id} Course:{self.course_id} Score:{self.total_score}>"


class Employment(db.Model):
    __tablename__ = "employments"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False, index=True)
    external_student_id = db.Column(db.String(50), index=True)
    company_name = db.Column(db.String(200))
    position = db.Column(db.String(100))
    salary = db.Column(db.Float)
    employment_date = db.Column(db.Date)
    employment_status = db.Column(db.String(50))
    is_match_major = db.Column(db.Boolean)
    data_source = db.Column(db.String(50), default="employment_system")
    sync_batch = db.Column(db.String(50), index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Employment Student:{self.student_id} Company:{self.company_name}>"


class LiveSession(db.Model):
    __tablename__ = "live_sessions"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False, index=True)
    external_student_id = db.Column(db.String(50), index=True)
    live_room_id = db.Column(db.String(50), index=True)
    live_title = db.Column(db.String(200))
    course_related = db.Column(db.String(200))
    join_time = db.Column(db.DateTime)
    leave_time = db.Column(db.DateTime)
    duration_minutes = db.Column(db.Integer, default=0)
    is_online = db.Column(db.Boolean, default=False)
    interaction_count = db.Column(db.Integer, default=0)
    data_source = db.Column(db.String(50), default="live_platform")
    sync_batch = db.Column(db.String(50), index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<LiveSession Student:{self.student_id} Room:{self.live_room_id}>"


class LMSRecord(db.Model):
    __tablename__ = "lms_records"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False, index=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False, index=True)
    grade_id = db.Column(db.Integer, db.ForeignKey("grades.id"), index=True)
    chapter_id = db.Column(db.Integer, db.ForeignKey("course_chapters.id"), nullable=False, index=True)
    external_student_id = db.Column(db.String(50), index=True)
    first_access_time = db.Column(db.DateTime)
    last_access_time = db.Column(db.DateTime)
    study_duration_minutes = db.Column(db.Integer, default=0)
    completion_status = db.Column(db.String(20), default="not_started")
    quiz_score = db.Column(db.Float)
    progress_percent = db.Column(db.Float, default=0)
    data_source = db.Column(db.String(50), default="lms")
    sync_batch = db.Column(db.String(50), index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<LMSRecord Student:{self.student_id} Chapter:{self.chapter_id} Progress:{self.progress_percent}%>"


class ReminderRule(db.Model):
    __tablename__ = "reminder_rules"

    id = db.Column(db.Integer, primary_key=True)
    rule_name = db.Column(db.String(100), nullable=False)
    rule_type = db.Column(db.String(50), nullable=False)
    threshold_type = db.Column(db.String(50), default="completion_rate")
    threshold_value = db.Column(db.Float, nullable=False)
    comparison = db.Column(db.String(20), default="lt")
    time_window_days = db.Column(db.Integer, default=7)
    reminder_message = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    priority = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ReminderRule {self.rule_name}: {self.threshold_type} {self.comparison} {self.threshold_value}>"


class AnomalyData(db.Model):
    __tablename__ = "anomaly_data"

    id = db.Column(db.Integer, primary_key=True)
    data_source = db.Column(db.String(50), nullable=False, index=True)
    sync_batch = db.Column(db.String(50), index=True)
    raw_data = db.Column(db.Text, nullable=False)
    anomaly_type = db.Column(db.String(100), nullable=False, index=True)
    anomaly_description = db.Column(db.Text)
    error_message = db.Column(db.Text)
    record_id_external = db.Column(db.String(100), index=True)
    is_resolved = db.Column(db.Boolean, default=False, index=True)
    resolved_note = db.Column(db.Text)
    resolved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f"<AnomalyData {self.data_source}: {self.anomaly_type}>"


class Note(db.Model):
    __tablename__ = "notes"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False, index=True)
    grade_id = db.Column(db.Integer, db.ForeignKey("grades.id"), index=True)
    note_type = db.Column(db.String(50), default="general")
    content = db.Column(db.Text, nullable=False)
    created_by = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Note Student:{self.student_id} Type:{self.note_type}>"


class SyncTask(db.Model):
    __tablename__ = "sync_tasks"

    id = db.Column(db.Integer, primary_key=True)
    task_name = db.Column(db.String(100), nullable=False, index=True)
    data_source = db.Column(db.String(50), nullable=False)
    sync_batch = db.Column(db.String(50), unique=True, nullable=False, index=True)
    status = db.Column(db.String(20), default="pending", index=True)
    total_records = db.Column(db.Integer, default=0)
    success_count = db.Column(db.Integer, default=0)
    error_count = db.Column(db.Integer, default=0)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    error_message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<SyncTask {self.task_name} Batch:{self.sync_batch} Status:{self.status}>"
