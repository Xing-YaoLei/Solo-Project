from celery_app import celery
from tasks.base import BaseSyncTask, gen_id
from models import (
    get_db, Schedule, ClassroomConflict, EnrollmentApplication, EnrollmentStatus,
    Course, Classroom, Student
)
from config import Config
from datetime import datetime, timedelta
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class AnomalyDetectionTask(BaseSyncTask):
    source_system = "异常检测引擎"
    sync_type = "规则检测"


@celery.task(base=AnomalyDetectionTask, bind=True, name="tasks.anomaly_detection.run_anomaly_detection")
def run_anomaly_detection(self, academic_term=None):
    if academic_term is None:
        academic_term = Config.ACADEMIC_TERMS[0]

    try:
        self.total_records = 0

        detect_classroom_conflicts(self, academic_term)
        detect_capacity_violations(self, academic_term)
        detect_duration_anomalies(self, academic_term)
        detect_student_identity_issues(self)
        detect_course_enrollment_overflow(self, academic_term)

        self.create_sync_log(status="成功")
        return {
            "sync_id": self.sync_id,
            "total_checked": self.total_records,
            "anomalies_found": self.anomaly_count,
        }

    except Exception as e:
        self.create_sync_log(status="失败", error_message=str(e))
        raise


def detect_classroom_conflicts(task, academic_term):
    with get_db() as db:
        schedules = db.query(Schedule).filter(
            Schedule.academic_term == academic_term,
            Schedule.course_code != "__ROOM__"
        ).all()

        slot_group = defaultdict(list)
        for s in schedules:
            key = (s.room_code, s.weekday, s.time_slot, s.academic_term)
            slot_group[key].append(s)

        conflict_count = 0
        for (room_code, weekday, time_slot, term), items in slot_group.items():
            if len(items) >= 2:
                for i in range(len(items)):
                    for j in range(i + 1, len(items)):
                        s1, s2 = items[i], items[j]

                        if s1.course_code == s2.course_code:
                            continue

                        existing = db.query(ClassroomConflict).filter(
                            ClassroomConflict.room_code == room_code,
                            ClassroomConflict.weekday == weekday,
                            ClassroomConflict.time_slot == time_slot,
                            ClassroomConflict.academic_term == term,
                            ((ClassroomConflict.schedule_id_1 == s1.schedule_id) &
                             (ClassroomConflict.schedule_id_2 == s2.schedule_id)) |
                            ((ClassroomConflict.schedule_id_1 == s2.schedule_id) &
                             (ClassroomConflict.schedule_id_2 == s1.schedule_id))
                        ).first()

                        c1 = db.query(Course).filter(Course.course_code == s1.course_code).first()
                        c2 = db.query(Course).filter(Course.course_code == s2.course_code).first()

                        if not existing:
                            conflict = ClassroomConflict(
                                conflict_id=gen_id("CF"),
                                room_code=room_code,
                                academic_term=term,
                                weekday=weekday,
                                time_slot=time_slot,
                                schedule_id_1=s1.schedule_id,
                                schedule_id_2=s2.schedule_id,
                                course_code_1=s1.course_code,
                                course_code_2=s2.course_code,
                                course_name_1=c1.course_name if c1 else s1.course_code,
                                course_name_2=c2.course_name if c2 else s2.course_code,
                                conflict_type="教室冲突",
                                severity="高",
                                status="未处理",
                                remark=f"容量需求: {s1.student_count + s2.student_count}人",
                            )
                            db.add(conflict)
                            conflict_count += 1

                        s1.is_conflict = True
                        s1.conflict_detail = f"与{s2.course_code}在{weekday}{time_slot}冲突"
                        s2.is_conflict = True
                        s2.conflict_detail = f"与{s1.course_code}在{weekday}{time_slot}冲突"

                        apps = db.query(EnrollmentApplication).filter(
                            EnrollmentApplication.course_code.in_([s1.course_code, s2.course_code]),
                            EnrollmentApplication.academic_term == term
                        ).all()
                        for app in apps:
                            app.has_conflict = 1

        db.commit()
        task.anomaly_count += conflict_count
        task.total_records += len(schedules)
        logger.info(f"检测到 {conflict_count} 个教室冲突")


def detect_capacity_violations(task, academic_term):
    with get_db() as db:
        schedules = db.query(Schedule).filter(
            Schedule.academic_term == academic_term,
            Schedule.course_code != "__ROOM__"
        ).all()

        violations = 0
        for s in schedules:
            room = db.query(Classroom).filter(Classroom.room_code == s.room_code).first()
            if room and s.student_count > room.capacity:
                task.record_anomaly(
                    anomaly_type="超容量排课",
                    description=f"教室 {s.room_code} 容量{room.capacity}人，实际排课{s.student_count}人 (超{s.student_count - room.capacity}人)",
                    severity="中",
                    table_name="schedules",
                    record_id=s.schedule_id,
                    field_name="student_count",
                    expected_value=room.capacity,
                    actual_value=s.student_count,
                    raw_data=s.to_dict(),
                    remark=f"课程: {s.course_code}",
                )
                violations += 1

        task.total_records += len(schedules)
        logger.info(f"检测到 {violations} 个超容量排课")


def detect_duration_anomalies(task, academic_term):
    with get_db() as db:
        apps = db.query(EnrollmentApplication).filter(
            EnrollmentApplication.academic_term == academic_term
        ).all()

        anomalies = 0
        threshold_first = 24
        threshold_final = 24
        threshold_total = 72

        for app in apps:
            _compute_durations(app)

            if app.first_review_duration > threshold_first:
                task.record_anomaly(
                    anomaly_type="初审超时",
                    description=f"申请 {app.application_no} 初审耗时 {app.first_review_duration} 小时 (阈值{threshold_first}小时)",
                    severity="中",
                    table_name="enrollment_applications",
                    record_id=app.application_no,
                    field_name="first_review_duration",
                    expected_value=f"<={threshold_first}",
                    actual_value=app.first_review_duration,
                    raw_data=app.to_dict(),
                )
                anomalies += 1

            if app.final_review_duration > threshold_final:
                task.record_anomaly(
                    anomaly_type="终审超时",
                    description=f"申请 {app.application_no} 终审耗时 {app.final_review_duration} 小时 (阈值{threshold_final}小时)",
                    severity="中",
                    table_name="enrollment_applications",
                    record_id=app.application_no,
                    field_name="final_review_duration",
                    expected_value=f"<={threshold_final}",
                    actual_value=app.final_review_duration,
                    raw_data=app.to_dict(),
                )
                anomalies += 1

            if app.total_duration > threshold_total:
                task.record_anomaly(
                    anomaly_type="总时长超标",
                    description=f"申请 {app.application_no} 总耗时 {app.total_duration} 小时 (阈值{threshold_total}小时)",
                    severity="高",
                    table_name="enrollment_applications",
                    record_id=app.application_no,
                    field_name="total_duration",
                    expected_value=f"<={threshold_total}",
                    actual_value=app.total_duration,
                    raw_data=app.to_dict(),
                )
                anomalies += 1

        db.commit()
        task.anomaly_count += anomalies
        task.total_records += len(apps)
        logger.info(f"检测到 {anomalies} 个审核时长异常")


def detect_student_identity_issues(task):
    with get_db() as db:
        unverified = db.query(Student).filter(
            Student.is_verified == False,
            Student.status == "在读"
        ).all()

        issues = 0
        for s in unverified[:10]:
            task.record_anomaly(
                anomaly_type="身份未核验",
                description=f"学生 {s.student_id}({s.name}) 一卡通身份未核验",
                severity="低",
                table_name="students",
                record_id=s.student_id,
                field_name="is_verified",
                expected_value="True",
                actual_value="False",
                raw_data=s.to_dict(),
                remark="选课流程受限",
            )
            issues += 1

        task.anomaly_count += issues
        task.total_records += db.query(Student).count()
        logger.info(f"检测到 {len(unverified)} 个身份未核验学生")


def detect_course_enrollment_overflow(task, academic_term):
    with get_db() as db:
        courses = db.query(Course).filter(Course.academic_term == academic_term).all()

        overflow = 0
        for c in courses:
            if c.enrolled_count > c.capacity and c.capacity > 0:
                task.record_anomaly(
                    anomaly_type="选课超员",
                    description=f"课程 {c.course_code}({c.course_name}) 容量{c.capacity}人，已选{c.enrolled_count}人",
                    severity="中",
                    table_name="courses",
                    record_id=c.course_code,
                    field_name="enrolled_count",
                    expected_value=c.capacity,
                    actual_value=c.enrolled_count,
                    raw_data=c.to_dict(),
                )
                overflow += 1

        task.anomaly_count += overflow
        task.total_records += len(courses)
        logger.info(f"检测到 {overflow} 个选课超员课程")


def _compute_durations(app):
    try:
        if app.submitted_at and app.first_review_time:
            delta = app.first_review_time - app.submitted_at
            app.first_review_duration = max(0, int(delta.total_seconds() / 3600))

        if app.first_review_time and app.schedule_time:
            delta = app.schedule_time - app.first_review_time
            app.schedule_duration = max(0, int(delta.total_seconds() / 3600))

        if app.schedule_time and app.final_review_time:
            delta = app.final_review_time - app.schedule_time
            app.final_review_duration = max(0, int(delta.total_seconds() / 3600))

        if app.submitted_at:
            end_time = app.success_time or app.final_review_time or app.schedule_time or datetime.now()
            delta = end_time - app.submitted_at
            app.total_duration = max(0, int(delta.total_seconds() / 3600))
    except Exception as e:
        logger.warning(f"计算时长失败 app={app.application_no}: {e}")
