import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
from config import Config

random.seed(42)
np.random.seed(42)


def generate_all_mock_data():
    return {
        "funnel": _generate_funnel_data(),
        "courses": _generate_courses_df(),
        "classrooms": _generate_classrooms_df(),
        "students": _generate_students_df(),
        "applications": _generate_applications_df(),
        "schedules": _generate_schedules_df(),
        "conflicts": _generate_conflicts_df(),
        "anomalies": _generate_anomalies_df(),
        "sync_logs": _generate_sync_logs_df(),
        "raw_samples": _generate_raw_samples_df(),
        "duration_stats": _generate_duration_stats_df(),
        "colleges": _generate_colleges_df(),
    }


def _generate_funnel_data():
    stages = Config.FUNNEL_STAGES
    base_counts = [20, 18000, 15600, 14800, 14200, 13500, 12800]
    base_conversion = [100.0, 90.0, 86.7, 94.9, 95.9, 95.1, 94.8]

    return pd.DataFrame({
        "stage": stages,
        "stage_order": list(range(1, len(stages) + 1)),
        "count": base_counts,
        "conversion_rate": base_conversion,
        "drop_off": [0.0] + [100 - r for r in base_conversion[1:]],
        "avg_duration_hours": [0, 18.5, 12.3, 8.7, 22.1, 15.4, 6.2],
        "target_count": [20, 20000, 18000, 17000, 16500, 16000, 15500],
        "completion_rate": [c / t * 100 for c, t in zip(base_counts, [20, 20000, 18000, 17000, 16500, 16000, 15500])],
    })


def _generate_courses_df():
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

    data = []
    for i, name in enumerate(course_names, 1):
        capacity = random.choice([60, 90, 120, 150, 180])
        enrolled = random.randint(int(capacity * 0.5), capacity + 20)
        data.append({
            "course_code": f"C{1000 + i:04d}",
            "course_name": name,
            "catalog_id": "CAT-2025-26-1",
            "academic_term": "2025-2026-1",
            "college": random.choice(colleges),
            "teacher": random.choice(teachers),
            "teacher_id": f"T{1000 + i:04d}",
            "credit": random.choice([2, 3, 4, 5]),
            "hours": random.choice([32, 48, 64, 80]),
            "capacity": capacity,
            "enrolled_count": enrolled,
            "enroll_rate": round(enrolled / capacity * 100, 1),
            "course_type": random.choice(course_types),
            "course_nature": random.choice(natures),
            "browse_count": random.randint(50, 500),
            "remark": random.choice(["", "新增课程", "热门课程", "合班授课", "需先修课程"]),
            "has_conflict": 1 if random.random() < 0.2 else 0,
        })
    return pd.DataFrame(data)


def _generate_classrooms_df():
    buildings = ["第一教学楼", "第二教学楼", "第三教学楼", "理科楼", "计算机楼"]
    room_types = ["普通教室", "多媒体教室", "实验室", "机房"]
    areas = ["东校区", "西校区", "主校区"]

    data = []
    for i in range(1, 16):
        capacity = random.choice([60, 90, 120, 150, 200])
        data.append({
            "room_code": f"R{i:03d}",
            "building": random.choice(buildings),
            "room_number": f"{random.randint(1, 6)}{random.randint(101, 699)}",
            "room_type": random.choice(room_types),
            "capacity": capacity,
            "equipment": random.choice(["投影仪,音响", "投影仪,音响,电脑", "投影仪,白板", "实验设备"]),
            "building_floor": random.randint(1, 6),
            "area": random.choice(areas),
            "is_active": True,
            "weekly_utilization": round(random.uniform(40, 95), 1),
            "scheduled_hours": random.randint(20, 45),
            "remark": random.choice(["", "考试专用", "维修中", "需预约", "多媒体已升级"]),
            "has_conflict": 1 if random.random() < 0.25 else 0,
        })
    return pd.DataFrame(data)


def _generate_students_df():
    colleges = ["计算机学院", "数学学院", "物理学院", "外语学院", "经济学院", "管理学院"]
    grades = ["2021级", "2022级", "2023级", "2024级"]
    majors = {
        "计算机学院": ["计算机科学与技术", "软件工程", "人工智能", "信息安全"],
        "数学学院": ["数学与应用数学", "信息与计算科学", "统计学"],
        "物理学院": ["物理学", "应用物理学", "光电信息科学"],
        "外语学院": ["英语", "日语", "翻译"],
        "经济学院": ["经济学", "金融学", "国际经济与贸易"],
        "管理学院": ["工商管理", "会计学", "市场营销"],
    }

    data = []
    for i in range(1, 81):
        college = random.choice(colleges)
        major = random.choice(majors[college])
        data.append({
            "student_id": f"S{20230000 + i:08d}",
            "name": f"学生{i}",
            "gender": random.choice(["男", "女"]),
            "college": college,
            "major": major,
            "grade": random.choice(grades),
            "class_name": f"{major}{random.randint(1, 4)}班",
            "phone": f"138{random.randint(10000000, 99999999)}",
            "email": f"student{i}@university.edu.cn",
            "status": "在读",
            "smart_card_id": f"CARD{10000000 + i:08d}",
            "is_verified": random.random() < 0.88,
            "applied_courses": random.randint(3, 6),
            "success_courses": random.randint(0, 5),
            "remark": random.choice(["", "学籍异动", "交换生", "特殊需求"]),
        })
    return pd.DataFrame(data)


def _generate_applications_df():
    statuses = [
        "已浏览", "已提交", "初审中", "初审通过", "初审驳回",
        "排课中", "已排课", "终审中", "终审通过", "终审驳回", "选课成功", "已取消"
    ]
    status_weights = [5, 8, 8, 12, 3, 8, 15, 10, 12, 2, 17, 2]

    data = []
    now = datetime.now()
    aid = 1
    for i in range(1, 81):
        for j in range(1, 6):
            if random.random() < 0.6:
                status = random.choices(statuses, weights=status_weights, k=1)[0]
                submitted = now - timedelta(
                    days=random.randint(1, 20),
                    hours=random.randint(0, 23)
                )
                first_dur = random.randint(1, 36)
                sched_dur = random.randint(2, 48)
                final_dur = random.randint(1, 30)

                status_stage_map = {
                    "已浏览": 0, "已提交": 0, "初审中": 0, "初审通过": first_dur,
                    "初审驳回": first_dur, "排课中": first_dur,
                    "已排课": first_dur, "终审中": first_dur,
                    "终审通过": first_dur, "终审驳回": first_dur,
                    "选课成功": first_dur, "已取消": first_dur,
                }

                first_r = status_stage_map[status]
                sched_r = sched_dur if status in ["已排课", "终审中", "终审通过", "终审驳回", "选课成功"] else 0
                final_r = final_dur if status in ["终审通过", "终审驳回", "选课成功"] else 0

                has_conflict = 1 if random.random() < 0.15 else 0
                data.append({
                    "application_no": f"APP{aid:08d}",
                    "student_id": f"S{20230000 + i:08d}",
                    "student_name": f"学生{i}",
                    "course_code": f"C{1000 + j:04d}",
                    "course_name": _get_course_name(j),
                    "college": random.choice(["计算机学院", "数学学院", "外语学院"]),
                    "academic_term": "2025-2026-1",
                    "status": status,
                    "submitted_at": submitted.strftime("%Y-%m-%d %H:%M:%S"),
                    "first_review_duration": first_r,
                    "schedule_duration": sched_r,
                    "final_review_duration": final_r,
                    "total_duration": first_r + sched_r + final_r,
                    "has_conflict": has_conflict,
                    "remark": random.choice(["", "学生申请加急", "教务备注", "需复核"]),
                })
                aid += 1

    return pd.DataFrame(data)


def _generate_schedules_df():
    weekdays = Config.WEEKDAYS[:5]
    time_slots = Config.TIME_SLOTS

    data = []
    conflict_pairs = set()
    used = {}
    sid = 1

    for i in range(1, 21):
        course_code = f"C{1000 + i:04d}"
        course_name = _get_course_name(i)
        num_slots = random.choice([2, 3, 4])
        teacher = f"教师{((i - 1) % 20) + 1}"

        for _ in range(num_slots):
            for _ in range(20):
                wd = random.choice(weekdays)
                ts = random.choice(time_slots)
                room_idx = random.randint(1, 15)
                room_code = f"R{room_idx:03d}"

                key = (room_code, wd, ts)
                if key not in used or (key in used and random.random() < 0.18):
                    used[key] = used.get(key, 0) + 1
                    is_conflict = used[key] > 1

                    data.append({
                        "schedule_id": f"SCH{sid:06d}",
                        "course_code": course_code,
                        "course_name": course_name,
                        "room_code": room_code,
                        "building": _get_building(room_idx),
                        "room_number": f"{(room_idx % 6) + 1}{100 + room_idx * 3}",
                        "academic_term": "2025-2026-1",
                        "weekday": wd,
                        "time_slot": ts,
                        "start_week": 1,
                        "end_week": 16,
                        "week_type": random.choice(["全周", "单周", "双周"]),
                        "teacher": teacher,
                        "student_count": random.randint(40, 150),
                        "room_capacity": random.choice([60, 90, 120, 150, 200]),
                        "is_conflict": is_conflict,
                        "conflict_with": f"C{1001 + random.randint(0, 19):04d}" if is_conflict else "",
                        "remark": random.choice(["", "合班上课", "考试周调整", "实验室课程"]),
                    })
                    sid += 1
                    break

    return pd.DataFrame(data)


def _generate_conflicts_df():
    weekdays = Config.WEEKDAYS[:5]
    time_slots = Config.TIME_SLOTS
    conflict_types = ["教室冲突", "教师时间冲突", "学生选课冲突"]
    severities = ["高", "中", "低"]

    data = []
    for i in range(1, 13):
        i1 = random.randint(1, 20)
        i2 = random.randint(1, 20)
        while i2 == i1:
            i2 = random.randint(1, 20)

        data.append({
            "conflict_id": f"CF{datetime.now().strftime('%Y%m%d')}{i:04d}",
            "room_code": f"R{random.randint(1, 15):03d}",
            "building": _get_building(random.randint(1, 15)),
            "academic_term": "2025-2026-1",
            "weekday": random.choice(weekdays),
            "time_slot": random.choice(time_slots),
            "course_code_1": f"C{1000 + i1:04d}",
            "course_code_2": f"C{1000 + i2:04d}",
            "course_name_1": _get_course_name(i1),
            "course_name_2": _get_course_name(i2),
            "conflict_type": random.choices(conflict_types, weights=[70, 20, 10], k=1)[0],
            "severity": random.choices(severities, weights=[60, 30, 10], k=1)[0],
            "status": random.choices(["未处理", "处理中", "已解决"], weights=[50, 30, 20], k=1)[0],
            "handler": random.choice(["", "教务员A", "教务员B", "主任"]),
            "detected_at": (datetime.now() - timedelta(days=random.randint(1, 10))).strftime("%Y-%m-%d %H:%M:%S"),
            "remark": random.choice(["", "已联系教师A调课", "需要协调大教室", "建议更换时段"]),
        })
    return pd.DataFrame(data)


def _generate_anomalies_df():
    sources = ["学生申请表", "教学平台", "一卡通系统", "异常检测引擎"]
    types = ["学生不存在", "课程不存在", "卡号不一致", "验证过期", "超容量排课",
             "初审超时", "终审超时", "总时长超标", "身份未核验", "选课超员", "数据缺失"]
    severities = ["高", "中", "低"]
    statuses = ["待处理", "处理中", "已关闭"]

    data = []
    for i in range(1, 36):
        atype = random.choice(types)
        data.append({
            "anomaly_id": f"ANOM{datetime.now().strftime('%Y%m%d')}{i:04d}",
            "source_system": random.choice(sources),
            "anomaly_type": atype,
            "severity": random.choices(severities, weights=[25, 50, 25], k=1)[0],
            "table_name": random.choice(["students", "courses", "enrollment_applications", "schedules", "raw_smart_cards"]),
            "description": f"检测到{atype}异常，相关记录ID为{random.randint(1000, 9999)}，请及时处理。",
            "status": random.choices(statuses, weights=[55, 25, 20], k=1)[0],
            "assignee": random.choice(["", "张老师", "李老师", "王老师", "赵老师"]),
            "detected_at": (datetime.now() - timedelta(
                days=random.randint(0, 15),
                hours=random.randint(0, 23)
            )).strftime("%Y-%m-%d %H:%M:%S"),
            "remark": random.choice(["", "需本周处理完毕", "跨部门协调中", "历史遗留问题"]),
        })
    return pd.DataFrame(data)


def _generate_sync_logs_df():
    sources = ["学生申请表", "教学平台", "一卡通系统", "异常检测引擎"]
    statuses = ["成功", "失败", "部分成功"]

    data = []
    for i in range(1, 21):
        src = random.choice(sources)
        total = random.randint(50, 500)
        failed = random.randint(0, int(total * 0.08))
        anomaly = random.randint(0, int(total * 0.12))
        dur = random.randint(30, 600)

        data.append({
            "sync_id": f"SYNC{datetime.now().strftime('%Y%m%d%H%M')}{i:04d}",
            "source_system": src,
            "sync_type": "增量同步" if src != "教学平台" else "全量同步",
            "start_time": (datetime.now() - timedelta(minutes=random.randint(i * 30, i * 60))).strftime("%Y-%m-%d %H:%M:%S"),
            "end_time": "",
            "duration_seconds": dur,
            "total_records": total,
            "success_count": total - failed,
            "failed_count": failed,
            "anomaly_count": anomaly,
            "status": "失败" if failed > total * 0.5 else random.choices(statuses, weights=[85, 5, 10], k=1)[0],
        })
        data[-1]["end_time"] = (datetime.strptime(data[-1]["start_time"], "%Y-%m-%d %H:%M:%S") + timedelta(seconds=dur)).strftime("%Y-%m-%d %H:%M:%S")
    return pd.DataFrame(data)


def _generate_raw_samples_df():
    sources = ["学生申请表", "教学平台", "一卡通系统"]
    data = []
    for i in range(1, 101):
        src = random.choice(sources)
        course_code = ""
        if src == "学生申请表":
            course_code = f"C{1000 + random.randint(1, 20):04d}"
            payload = {
                "student_id": f"S{20230000 + random.randint(1, 80):08d}",
                "course_code": course_code,
                "apply_time": (datetime.now() - timedelta(days=random.randint(1, 20))).isoformat(),
                "status": random.choice(["SUBMITTED", "REVIEWING", "APPROVED"]),
            }
        elif src == "教学平台":
            course_code = f"C{1000 + random.randint(1, 20):04d}"
            payload = {
                "course_code": course_code,
                "room_code": f"R{random.randint(1, 15):03d}",
                "weekday": random.choice(Config.WEEKDAYS),
                "time_slot": random.choice(Config.TIME_SLOTS),
                "review_status": "APPROVED",
            }
        else:
            payload = {
                "card_id": f"CARD{10000000 + random.randint(1, 80):08d}",
                "student_id": f"S{20230000 + random.randint(1, 80):08d}",
                "verified": random.random() < 0.9,
                "verify_location": random.choice(["图书馆", "教学楼", "宿舍"]),
            }

        data.append({
            "raw_id": i,
            "source_system": src,
            "batch_id": f"BATCH{random.randint(100, 999)}",
            "source_id": f"SRC{i:08d}",
            "course_code": course_code,
            "payload": str(payload),
            "is_processed": random.random() < 0.85,
            "is_anomaly": 1 if random.random() < 0.12 else 0,
            "anomaly_note": random.choice(["", "格式异常", "关联失败", "数据重复"]),
            "synced_at": (datetime.now() - timedelta(minutes=random.randint(1, 1440))).strftime("%Y-%m-%d %H:%M:%S"),
        })
    return pd.DataFrame(data)


def _generate_duration_stats_df():
    buckets = ["0-4h", "4-8h", "8-12h", "12-24h", "24-48h", "48-72h", ">72h"]
    data = []
    for phase in ["初审", "排课", "终审", "总计"]:
        dist = np.random.dirichlet(np.ones(7) * 2) * 100
        dist = np.round(dist, 1)
        dist = dist / dist.sum() * 100
        for bi, b in enumerate(buckets):
            data.append({
                "phase": phase,
                "duration_bucket": b,
                "percentage": round(dist[bi], 1),
                "count": int(random.randint(50, 800) * dist[bi] / 100),
                "avg_hours": [2, 6, 10, 18, 36, 60, 96][bi],
                "target_hours": [8, 24, 24, 72][["初审", "排课", "终审", "总计"].index(phase)],
            })
    return pd.DataFrame(data)


def _generate_colleges_df():
    colleges = ["计算机学院", "数学学院", "物理学院", "外语学院", "经济学院", "管理学院"]
    data = []
    for c in colleges:
        appl = random.randint(1500, 3500)
        succ = int(appl * random.uniform(0.78, 0.92))
        data.append({
            "college": c,
            "applications": appl,
            "success": succ,
            "success_rate": round(succ / appl * 100, 1),
            "avg_total_hours": round(random.uniform(28, 68), 1),
            "anomaly_count": random.randint(5, 60),
            "conflict_count": random.randint(2, 25),
        })
    return pd.DataFrame(data)


def _get_course_name(idx):
    names = [
        "高等数学", "线性代数", "概率论与数理统计", "大学物理", "程序设计基础",
        "数据结构", "操作系统", "计算机网络", "数据库原理", "软件工程",
        "人工智能导论", "机器学习", "深度学习", "大学英语", "综合英语",
        "微观经济学", "宏观经济学", "管理学原理", "会计学基础", "市场营销学"
    ]
    return names[(idx - 1) % len(names)]


def _get_building(idx):
    return ["第一教学楼", "第二教学楼", "第三教学楼", "理科楼", "计算机楼"][idx % 5]
