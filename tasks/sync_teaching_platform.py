from celery_app import celery
from tasks.base import BaseSyncTask, gen_id
from models import get_db, RawTeachingPlatform, Course, CourseCatalog, Schedule, Classroom
from datetime import datetime, timedelta
import random
import logging

logger = logging.getLogger(__name__)


class SyncTeachingPlatformTask(BaseSyncTask):
    source_system = "教学平台"
    sync_type = "全量同步"


@celery.task(base=SyncTeachingPlatformTask, bind=True, name="tasks.sync_teaching_platform.sync_teaching_platform")
def sync_teaching_platform(self):
    try:
        with get_db() as db:
            batch_id = gen_id("BATCH")
            raw_records = []

            catalogs = _generate_mock_catalogs()
            courses = _generate_mock_courses()
            schedules = _generate_mock_schedules()

            self.total_records = len(catalogs) + len(courses) + len(schedules)

            for item in catalogs:
                raw = RawTeachingPlatform(
                    batch_id=batch_id,
                    source_id=f"cat_{item['catalog_id']}",
                    data_type="catalog",
                    course_code=None,
                    course_name=None,
                    academic_term=item["academic_term"],
                    raw_payload=item,
                    is_processed=False,
                    is_anomaly=False,
                )
                db.add(raw)
                raw_records.append((raw, item, "catalog"))

            for item in courses:
                raw = RawTeachingPlatform(
                    batch_id=batch_id,
                    source_id=f"crs_{item['course_code']}",
                    data_type="course",
                    course_code=item["course_code"],
                    course_name=item["course_name"],
                    academic_term=item["academic_term"],
                    teacher=item["teacher"],
                    capacity=item["capacity"],
                    review_status="已审核",
                    reviewer="教务处",
                    review_time=datetime.now() - timedelta(days=random.randint(5, 30)),
                    raw_payload=item,
                    is_processed=False,
                    is_anomaly=False,
                )
                db.add(raw)
                raw_records.append((raw, item, "course"))

            for item in schedules:
                raw = RawTeachingPlatform(
                    batch_id=batch_id,
                    source_id=f"sch_{item['schedule_id']}",
                    data_type="schedule",
                    course_code=item["course_code"],
                    course_name=None,
                    academic_term=item["academic_term"],
                    room_code=item["room_code"],
                    weekday=item["weekday"],
                    time_slot=item["time_slot"],
                    teacher=item["teacher"],
                    raw_payload=item,
                    is_processed=False,
                    is_anomaly=False,
                )
                db.add(raw)
                raw_records.append((raw, item, "schedule"))

            db.commit()

            for raw, item, data_type in raw_records:
                try:
                    if data_type == "catalog":
                        existing = db.query(CourseCatalog).filter(
                            CourseCatalog.catalog_id == item["catalog_id"]
                        ).first()
                        if not existing:
                            cat = CourseCatalog(**item)
                            db.add(cat)
                        else:
                            for k, v in item.items():
                                setattr(existing, k, v)

                    elif data_type == "course":
                        existing = db.query(Course).filter(
                            Course.course_code == item["course_code"]
                        ).first()
                        if not existing:
                            c = Course(**item)
                            db.add(c)
                        else:
                            for k, v in item.items():
                                if k != "browse_count":
                                    setattr(existing, k, v)

                    elif data_type == "schedule":
                        room = db.query(Classroom).filter(Classroom.room_code == item["room_code"]).first()
                        course = db.query(Course).filter(Course.course_code == item["course_code"]).first()

                        if not room:
                            self.record_anomaly(
                                anomaly_type="教室不存在",
                                description=f"教室编号 {item['room_code']} 不存在",
                                severity="高",
                                table_name="classrooms",
                                record_id=item["room_code"],
                                raw_data=item,
                            )
                            raw.is_anomaly = True
                            self.failed_count += 1
                            continue

                        if not course:
                            self.record_anomaly(
                                anomaly_type="课程不存在",
                                description=f"课程编号 {item['course_code']} 不存在",
                                severity="高",
                                table_name="courses",
                                record_id=item["course_code"],
                                raw_data=item,
                            )
                            raw.is_anomaly = True
                            self.failed_count += 1
                            continue

                        existing = db.query(Schedule).filter(
                            Schedule.schedule_id == item["schedule_id"]
                        ).first()

                        if not existing:
                            s = Schedule(**item)
                            db.add(s)
                        else:
                            for k, v in item.items():
                                setattr(existing, k, v)

                    raw.is_processed = True
                    raw.processed_at = datetime.now()
                    self.success_count += 1

                except Exception as e:
                    raw.is_anomaly = True
                    raw.anomaly_note = f"处理异常: {str(e)}"
                    self.failed_count += 1
                    logger.error(f"处理教学平台数据失败 raw_id={raw.id}: {e}")

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


def _generate_mock_catalogs():
    return [{
        "catalog_id": "CAT-2025-26-1",
        "academic_term": "2025-2026-1",
        "publish_date": datetime.now() - timedelta(days=60),
        "status": "已发布",
        "total_courses": 50,
        "total_credits": 200,
        "description": "2025-2026学年第一学期课程目录",
        "remark": "本学期新增人工智能方向课程",
    }]


def _generate_mock_courses():
    colleges = ["计算机学院", "数学学院", "物理学院", "外语学院", "经济学院", "管理学院"]
    course_types = ["必修", "选修", "公选"]
    natures = ["通识课", "基础课", "专业课", "实践课"]
    teachers = [f"教师{i}" for i in range(1, 21)]
    course_names = [
        "高等数学", "线性代数", "概率论与数理统计", "大学物理", "程序设计基础",
        "数据结构", "操作系统", "计算机网络", "数据库原理", "软件工程",
        "人工智能导论", "机器学习", "深度学习", "大学英语", "综合英语",
        "微观经济学", "宏观经济学", "管理学原理", "会计学基础", "市场营销学"
    ]

    courses = []
    for i, name in enumerate(course_names, 1):
        courses.append({
            "course_code": f"C{1000 + i:04d}",
            "course_name": name,
            "catalog_id": "CAT-2025-26-1",
            "academic_term": "2025-2026-1",
            "college": random.choice(colleges),
            "teacher": random.choice(teachers),
            "teacher_id": f"T{1000 + i:04d}",
            "credit": random.choice([2, 3, 4, 5]),
            "hours": random.choice([32, 48, 64, 80]),
            "capacity": random.choice([60, 90, 120, 150, 180]),
            "enrolled_count": random.randint(0, 150),
            "course_type": random.choice(course_types),
            "course_nature": random.choice(natures),
            "category": f"{random.choice(colleges)}类",
            "browse_count": random.randint(50, 500),
            "description": f"{name}是一门重要的{random.choice(natures)}。",
        })
    return courses


def _generate_mock_schedules():
    weekdays = ["周一", "周二", "周三", "周四", "周五"]
    time_slots = ["08:00-09:40", "10:00-11:40", "14:00-15:40", "16:00-17:40", "19:00-20:40"]
    buildings = ["第一教学楼", "第二教学楼", "第三教学楼", "理科楼", "计算机楼"]
    teachers = [f"教师{i}" for i in range(1, 21)]

    schedules = []
    sid = 1
    used_slots = {}

    for i in range(1, 21):
        course_code = f"C{1000 + i:04d}"
        num_slots = random.choice([2, 3, 4])
        teacher = teachers[i - 1]

        for _ in range(num_slots):
            for attempt in range(20):
                weekday = random.choice(weekdays)
                slot = random.choice(time_slots)
                room_idx = random.randint(1, 15)
                room_code = f"R{room_idx:03d}"

                key = (room_code, weekday, slot)
                if key not in used_slots or (key in used_slots and random.random() < 0.15):
                    used_slots[key] = used_slots.get(key, 0) + 1
                    is_conflict = used_slots[key] > 1

                    schedules.append({
                        "schedule_id": f"SCH{sid:06d}",
                        "course_code": course_code,
                        "room_code": room_code,
                        "academic_term": "2025-2026-1",
                        "weekday": weekday,
                        "time_slot": slot,
                        "start_week": 1,
                        "end_week": 16,
                        "week_type": random.choice(["全周", "单周", "双周"]),
                        "teacher": teacher,
                        "student_count": random.randint(40, 150),
                        "is_conflict": is_conflict,
                        "conflict_detail": f"与课程{course_code}在{weekday}{slot}冲突" if is_conflict else None,
                        "remark": "合班上课" if random.random() < 0.3 else None,
                    })
                    sid += 1
                    break

    for i in range(1, 16):
        room_code = f"R{i:03d}"
        building = random.choice(buildings)
        schedules.append({
            "schedule_id": f"_ROOM_PLACEHOLDER_{i}",
            "course_code": "__ROOM__",
            "room_code": room_code,
            "building": building,
            "room_number": f"{random.randint(1, 6)}{random.randint(101, 699)}",
            "room_type": random.choice(["普通教室", "多媒体教室", "实验室", "机房"]),
            "capacity": random.choice([60, 90, 120, 150, 200]),
            "equipment": random.choice(["投影仪,音响", "投影仪,音响,电脑", "投影仪,白板", "实验设备"]),
            "building_floor": random.randint(1, 6),
            "area": random.choice(["东校区", "西校区", "主校区"]),
        })

    return schedules
