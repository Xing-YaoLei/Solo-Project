from celery_app import celery
from tasks.base import BaseSyncTask, gen_id
from models import get_db, RawStudentApplication, EnrollmentApplication, Student, Course, EnrollmentStatus
from datetime import datetime, timedelta
import random
import logging

logger = logging.getLogger(__name__)


class SyncStudentApplicationTask(BaseSyncTask):
    source_system = "学生申请表"
    sync_type = "增量同步"


@celery.task(base=SyncStudentApplicationTask, bind=True, name="tasks.sync_student_application.sync_student_application")
def sync_student_application(self, days=7):
    try:
        with get_db() as db:
            batch_id = gen_id("BATCH")
            cutoff = datetime.now() - timedelta(days=days)

            raw_records = []
            mock_data = _generate_mock_applications()
            self.total_records = len(mock_data)

            for idx, item in enumerate(mock_data):
                raw = RawStudentApplication(
                    batch_id=batch_id,
                    source_id=f"src_{item['student_id']}_{item['course_code']}",
                    student_id=item["student_id"],
                    student_name=item["student_name"],
                    course_code=item["course_code"],
                    course_name=item["course_name"],
                    academic_term=item["academic_term"],
                    apply_time=item["apply_time"],
                    apply_status=item["apply_status"],
                    apply_reason=item.get("apply_reason"),
                    raw_payload=item,
                    is_processed=False,
                    is_anomaly=False,
                )
                db.add(raw)
                raw_records.append((raw, item))

                if (idx + 1) % 100 == 0:
                    db.flush()

            db.commit()

            for raw, item in raw_records:
                try:
                    student = db.query(Student).filter(Student.student_id == item["student_id"]).first()
                    course = db.query(Course).filter(Course.course_code == item["course_code"]).first()

                    if not student:
                        self.record_anomaly(
                            anomaly_type="学生不存在",
                            description=f"学号 {item['student_id']} 在学生表中不存在",
                            severity="高",
                            table_name="students",
                            record_id=item["student_id"],
                            raw_data=item,
                        )
                        raw.is_anomaly = True
                        raw.anomaly_note = "关联学生不存在"
                        self.failed_count += 1
                        continue

                    if not course:
                        self.record_anomaly(
                            anomaly_type="课程不存在",
                            description=f"课程编号 {item['course_code']} 在课程表中不存在",
                            severity="高",
                            table_name="courses",
                            record_id=item["course_code"],
                            raw_data=item,
                        )
                        raw.is_anomaly = True
                        raw.anomaly_note = "关联课程不存在"
                        self.failed_count += 1
                        continue

                    existing = db.query(EnrollmentApplication).filter(
                        EnrollmentApplication.student_id == item["student_id"],
                        EnrollmentApplication.course_code == item["course_code"],
                        EnrollmentApplication.academic_term == item["academic_term"]
                    ).first()

                    status_map = {
                        "已提交": EnrollmentStatus.SUBMITTED,
                        "初审中": EnrollmentStatus.FIRST_REVIEW,
                        "初审通过": EnrollmentStatus.FIRST_PASS,
                        "初审驳回": EnrollmentStatus.FIRST_REJECT,
                        "排课中": EnrollmentStatus.SCHEDULING,
                        "已排课": EnrollmentStatus.SCHEDULED,
                        "终审中": EnrollmentStatus.FINAL_REVIEW,
                        "终审通过": EnrollmentStatus.FINAL_PASS,
                        "终审驳回": EnrollmentStatus.FINAL_REJECT,
                        "选课成功": EnrollmentStatus.SUCCESS,
                    }

                    status = status_map.get(item["apply_status"], EnrollmentStatus.SUBMITTED)

                    if not existing:
                        app = EnrollmentApplication(
                            application_no=gen_id("APP"),
                            student_id=item["student_id"],
                            course_code=item["course_code"],
                            academic_term=item["academic_term"],
                            status=status,
                            apply_reason=item.get("apply_reason"),
                            source_system="学生申请表",
                            raw_data_id=raw.id,
                            submitted_at=item["apply_time"],
                            browsed_at=item["apply_time"] - timedelta(minutes=random.randint(5, 120)),
                            remark=item.get("remark"),
                        )
                        db.add(app)
                    else:
                        existing.status = status
                        existing.submitted_at = item["apply_time"]
                        existing.apply_reason = item.get("apply_reason")

                    raw.is_processed = True
                    raw.processed_at = datetime.now()
                    self.success_count += 1

                except Exception as e:
                    raw.is_anomaly = True
                    raw.anomaly_note = f"处理异常: {str(e)}"
                    self.failed_count += 1
                    logger.error(f"处理申请记录失败 raw_id={raw.id}: {e}")

            db.commit()

        self.create_sync_log(status="成功")
        return {
            "sync_id": self.sync_id,
            "total": self.total_records,
            "success": self.success_count,
            "failed": self.failed_count,
            "anomaly": self.anomaly_count,
        }

    except Exception as e:
        self.create_sync_log(status="失败", error_message=str(e))
        raise


def _generate_mock_applications():
    statuses = ["已提交", "初审中", "初审通过", "初审驳回", "排课中", "已排课", "终审中", "终审通过", "终审驳回", "选课成功"]
    weights = [10, 8, 12, 3, 8, 15, 10, 12, 2, 20]

    applications = []
    now = datetime.now()
    for i in range(1, 81):
        for j in range(1, 6):
            if random.random() < 0.6:
                submit_time = now - timedelta(
                    days=random.randint(0, 20),
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59)
                )
                status = random.choices(statuses, weights=weights, k=1)[0]
                applications.append({
                    "student_id": f"S{20230000 + i:08d}",
                    "student_name": f"学生{i}",
                    "course_code": f"C{1000 + j:04d}",
                    "course_name": f"课程{j}",
                    "academic_term": "2025-2026-1",
                    "apply_time": submit_time,
                    "apply_status": status,
                    "apply_reason": random.choice(["必修课程", "选修学分", "兴趣爱好", None]),
                })
    return applications
