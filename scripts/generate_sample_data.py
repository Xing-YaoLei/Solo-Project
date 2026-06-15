#!/usr/bin/env python3
"""
生成示例数据脚本
用法: python scripts/generate_sample_data.py
"""

import os
import sys
import random
from datetime import datetime, timedelta, date
from dotenv import load_dotenv

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(PROJECT_ROOT)
sys.path.insert(0, PROJECT_ROOT)

load_dotenv()

from app import db, server
from app.models import (
    Course,
    CourseChapter,
    Student,
    Grade,
    Employment,
    LiveSession,
    LMSRecord,
)


COURSES_DATA = [
    {
        "code": "VE-001",
        "name": "Python编程基础",
        "category": "信息技术",
        "major": "计算机应用",
        "duration": 40,
        "chapters": 8,
        "target_days": 30,
    },
    {
        "code": "VE-002",
        "name": "数据结构与算法",
        "category": "信息技术",
        "major": "计算机应用",
        "duration": 60,
        "chapters": 12,
        "target_days": 45,
    },
    {
        "code": "VE-003",
        "name": "Web前端开发",
        "category": "信息技术",
        "major": "软件技术",
        "duration": 50,
        "chapters": 10,
        "target_days": 40,
    },
    {
        "code": "VE-004",
        "name": "会计电算化",
        "category": "财经商贸",
        "major": "会计",
        "duration": 45,
        "chapters": 9,
        "target_days": 35,
    },
    {
        "code": "VE-005",
        "name": "市场营销实务",
        "category": "财经商贸",
        "major": "市场营销",
        "duration": 35,
        "chapters": 7,
        "target_days": 30,
    },
]

STUDENT_NAMES = [
    "张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十",
    "陈明", "刘伟", "杨洋", "黄磊", "周杰", "吴磊", "郑爽", "孙俪",
    "马云飞", "李彦宏", "王小川", "张一鸣", "黄峥", "王兴", "程维",
    "柳青", "李娜", "王芳", "刘洋", "陈静", "杨帆", "赵敏", "周涛",
    "徐峥", "王宝强", "黄渤", "沈腾", "马丽", "贾玲", "张小斐",
    "雷军", "任正非", "张朝阳", "丁磊", "张小龙", "李开复",
]

MAJORS = ["计算机应用", "软件技术", "会计", "市场营销", "电子商务"]
CLASSES = ["2024级1班", "2024级2班", "2024级3班", "2023级1班", "2023级2班"]


def generate_sample_data():
    print("=" * 60)
    print("职业教育在线课程漏斗报表 - 生成示例数据")
    print("=" * 60)

    with server.app_context():
        print("\n1. 生成课程数据...")
        courses = []
        for course_data in COURSES_DATA:
            course = Course(
                course_code=course_data["code"],
                course_name=course_data["name"],
                category=course_data["category"],
                major=course_data["major"],
                total_duration_hours=course_data["duration"],
                total_chapters=course_data["chapters"],
                target_completion_days=course_data["target_days"],
                is_active=True,
            )
            db.session.add(course)
            courses.append(course)
        db.session.flush()
        print(f"   ✓ 已生成 {len(courses)} 门课程")

        print("\n2. 生成课程章节数据...")
        chapters = []
        for course in courses:
            for i in range(1, course.total_chapters + 1):
                chapter = CourseChapter(
                    course_id=course.id,
                    chapter_number=i,
                    chapter_name=f"第{i}章 {get_chapter_name(course.course_name, i)}",
                    duration_minutes=random.randint(30, 90),
                    is_required=True,
                    pass_score=60,
                )
                chapters.append(chapter)
        db.session.add_all(chapters)
        db.session.flush()
        print(f"   ✓ 已生成 {len(chapters)} 个章节")

        print("\n3. 生成学生数据...")
        students = []
        for i, name in enumerate(STUDENT_NAMES, 1):
            student = Student(
                student_id=f"STU{2024000 + i}",
                name=name,
                gender=random.choice(["男", "女"]),
                age=random.randint(18, 25),
                major=random.choice(MAJORS),
                grade_class=random.choice(CLASSES),
                enrollment_date=date(2024, 9, 1),
                phone=f"138{random.randint(10000000, 99999999)}",
                email=f"stu{2024000 + i}@school.edu.cn",
            )
            students.append(student)
        db.session.add_all(students)
        db.session.flush()
        print(f"   ✓ 已生成 {len(students)} 名学生")

        print("\n4. 生成成绩数据...")
        grades = []
        lms_records = []
        live_sessions = []
        employments = []

        today = date.today()

        for student in students:
            relevant_courses = [c for c in courses if c.major == student.major or random.random() < 0.3]
            if not relevant_courses:
                relevant_courses = random.sample(courses, 2)

            for course in relevant_courses[:3]:
                enroll_days_ago = random.randint(5, 60)
                enroll_date = today - timedelta(days=enroll_days_ago)
                expected_complete_date = enroll_date + timedelta(days=course.target_completion_days)

                progress_pattern = random.choice(["fast", "normal", "slow", "very_slow", "completed"])

                if progress_pattern == "fast":
                    completion_rate = min(100, (enroll_days_ago / course.target_completion_days) * 120)
                    study_duration = int(course.total_duration_hours * 60 * (completion_rate / 100) * random.uniform(0.9, 1.2))
                    total_score = random.uniform(75, 95)
                elif progress_pattern == "normal":
                    completion_rate = min(100, (enroll_days_ago / course.target_completion_days) * 100)
                    study_duration = int(course.total_duration_hours * 60 * (completion_rate / 100) * random.uniform(0.8, 1.1))
                    total_score = random.uniform(65, 80)
                elif progress_pattern == "slow":
                    completion_rate = min(100, (enroll_days_ago / course.target_completion_days) * 60)
                    study_duration = int(course.total_duration_hours * 60 * (completion_rate / 100) * random.uniform(0.6, 0.9))
                    total_score = random.uniform(50, 70)
                elif progress_pattern == "very_slow":
                    completion_rate = min(30, (enroll_days_ago / course.target_completion_days) * 30)
                    study_duration = int(course.total_duration_hours * 60 * (completion_rate / 100) * random.uniform(0.4, 0.7))
                    total_score = random.uniform(30, 55)
                else:
                    completion_rate = 100
                    study_duration = int(course.total_duration_hours * 60 * random.uniform(0.9, 1.3))
                    total_score = random.uniform(70, 95)

                is_pass = total_score >= 60
                completion_rate = min(100, max(0, completion_rate))

                if completion_rate >= 100:
                    status = "completed"
                    actual_complete_date = enroll_date + timedelta(days=enroll_days_ago - random.randint(0, 5))
                elif completion_rate > 0:
                    status = "in_progress"
                    actual_complete_date = None
                else:
                    status = "not_started"
                    actual_complete_date = None

                grade_level = None
                if total_score >= 90:
                    grade_level = "优秀"
                elif total_score >= 80:
                    grade_level = "良好"
                elif total_score >= 70:
                    grade_level = "中等"
                elif total_score >= 60:
                    grade_level = "及格"
                elif total_score is not None:
                    grade_level = "不及格"

                days_remaining = (expected_complete_date - today).days if expected_complete_date else 0
                expected_progress = max(0, min(100, ((course.target_completion_days - max(0, days_remaining)) / course.target_completion_days) * 100))
                progress_gap = expected_progress - completion_rate
                progress_warning = progress_gap > 20 or (days_remaining <= 7 and completion_rate < 80)

                grade = Grade(
                    student_id=student.id,
                    course_id=course.id,
                    enroll_date=enroll_date,
                    expected_complete_date=expected_complete_date,
                    actual_complete_date=actual_complete_date,
                    total_score=round(total_score, 1),
                    grade_level=grade_level,
                    completion_rate=round(completion_rate, 1),
                    study_duration_minutes=study_duration,
                    is_pass=is_pass,
                    status=status,
                    progress_warning=progress_warning,
                )
                grades.append(grade)

        db.session.add_all(grades)
        db.session.flush()
        print(f"   ✓ 已生成 {len(grades)} 条成绩记录")

        print("\n5. 生成LMS学习记录...")
        for grade in grades:
            if grade.status == "not_started":
                continue

            course_chapters = [c for c in chapters if c.course_id == grade.course_id]
            completed_chapters = int(len(course_chapters) * (grade.completion_rate / 100))

            for i, chapter in enumerate(course_chapters):
                if i < completed_chapters:
                    progress = 100
                    completion_status = "completed"
                elif i == completed_chapters and grade.completion_rate < 100:
                    progress = random.uniform(10, 90)
                    completion_status = "in_progress"
                else:
                    progress = 0
                    completion_status = "not_started"

                if progress > 0:
                    first_access = grade.enroll_date + timedelta(days=random.randint(1, max(1, int(grade.completion_rate / 10))))
                    last_access = first_access + timedelta(days=random.randint(1, 10))

                    lms_record = LMSRecord(
                        student_id=grade.student_id,
                        course_id=grade.course_id,
                        grade_id=grade.id,
                        chapter_id=chapter.id,
                        external_student_id=f"EXT{grade.student_id}",
                        first_access_time=datetime.combine(first_access, datetime.min.time()) + timedelta(hours=random.randint(8, 20)),
                        last_access_time=datetime.combine(last_access, datetime.min.time()) + timedelta(hours=random.randint(8, 22)),
                        study_duration_minutes=int(chapter.duration_minutes * random.uniform(0.7, 1.3)) if progress > 50 else int(chapter.duration_minutes * progress / 100 * random.uniform(0.5, 1.0)),
                        completion_status=completion_status,
                        quiz_score=round(random.uniform(50, 100), 1) if progress >= 100 else None,
                        progress_percent=round(progress, 1),
                        sync_batch=f"sample_lms_{datetime.now().strftime('%Y%m%d')}",
                    )
                    lms_records.append(lms_record)

        db.session.add_all(lms_records)
        db.session.flush()
        print(f"   ✓ 已生成 {len(lms_records)} 条LMS学习记录")

        print("\n6. 生成直播观看记录...")
        for grade in grades:
            if random.random() < 0.7:
                num_sessions = random.randint(1, 8)
                for _ in range(num_sessions):
                    session_date = grade.enroll_date + timedelta(days=random.randint(1, 45))
                    if session_date > today:
                        continue

                    duration = random.randint(15, 120)
                    join_time = datetime.combine(session_date, datetime.min.time()) + timedelta(hours=random.randint(18, 21))
                    leave_time = join_time + timedelta(minutes=duration)

                    live = LiveSession(
                        student_id=grade.student_id,
                        external_student_id=f"EXT{grade.student_id}",
                        live_room_id=f"LIVE{random.randint(100, 999)}",
                        live_title=f"{grade.course_id}课程直播 - 第{random.randint(1, 10)}讲",
                        course_related=str(grade.course_id),
                        join_time=join_time,
                        leave_time=leave_time,
                        duration_minutes=duration,
                        is_online=True,
                        interaction_count=random.randint(0, 10),
                        sync_batch=f"sample_live_{datetime.now().strftime('%Y%m%d')}",
                    )
                    live_sessions.append(live)

        db.session.add_all(live_sessions)
        db.session.flush()
        print(f"   ✓ 已生成 {len(live_sessions)} 条直播观看记录")

        print("\n7. 生成就业数据...")
        for grade in grades:
            if grade.status == "completed" and grade.is_pass and random.random() < 0.6:
                employment_date = grade.actual_complete_date + timedelta(days=random.randint(7, 60))
                if employment_date > today:
                    continue

                employment = Employment(
                    student_id=grade.student_id,
                    external_student_id=f"EXT{grade.student_id}",
                    company_name=random.choice([
                        "阿里巴巴", "腾讯科技", "字节跳动", "美团", "京东",
                        "百度", "网易", "华为", "小米", "OPPO",
                        "中国工商银行", "中国建设银行", "招商银行",
                        "普华永道", "德勤", "毕马威",
                    ]),
                    position=random.choice([
                        "Python开发工程师", "前端开发工程师", "Java开发工程师",
                        "数据分析师", "产品经理", "运营专员",
                        "会计", "财务专员", "市场营销专员",
                    ]),
                    salary=random.choice([4500, 5000, 5500, 6000, 6500, 7000, 8000, 9000, 10000, 12000, 15000]),
                    employment_date=employment_date,
                    employment_status="已就业",
                    is_match_major=random.random() > 0.2,
                    sync_batch=f"sample_emp_{datetime.now().strftime('%Y%m%d')}",
                )
                employments.append(employment)

        db.session.add_all(employments)
        db.session.commit()
        print(f"   ✓ 已生成 {len(employments)} 条就业数据")

        print("\n" + "=" * 60)
        print("示例数据生成完成！")
        print("=" * 60)
        print(f"\n统计汇总:")
        print(f"  - 课程: {len(courses)} 门")
        print(f"  - 章节: {len(chapters)} 个")
        print(f"  - 学生: {len(students)} 名")
        print(f"  - 成绩: {len(grades)} 条")
        print(f"  - LMS记录: {len(lms_records)} 条")
        print(f"  - 直播记录: {len(live_sessions)} 条")
        print(f"  - 就业记录: {len(employments)} 条")


def get_chapter_name(course_name, chapter_num):
    chapter_templates = {
        "Python编程基础": [
            "环境搭建与入门",
            "变量与数据类型",
            "条件语句与循环",
            "函数与模块",
            "列表与字典",
            "面向对象编程",
            "文件操作",
            "项目实战",
        ],
        "数据结构与算法": [
            "算法复杂度分析",
            "数组与链表",
            "栈与队列",
            "树与二叉树",
            "图论基础",
            "排序算法",
            "查找算法",
            "动态规划",
            "贪心算法",
            "回溯算法",
            "字符串匹配",
            "算法实战",
        ],
        "Web前端开发": [
            "HTML基础",
            "CSS样式",
            "JavaScript入门",
            "DOM操作",
            "jQuery框架",
            "Vue.js基础",
            "响应式设计",
            "前端工程化",
            "项目实战一",
            "项目实战二",
        ],
        "会计电算化": [
            "会计基础",
            "财务软件操作",
            "凭证录入",
            "账簿管理",
            "报表编制",
            "固定资产管理",
            "工资核算",
            "税务处理",
            "年度结账",
        ],
        "市场营销实务": [
            "市场营销概论",
            "市场调研",
            "消费者行为分析",
            "产品策略",
            "价格策略",
            "渠道策略",
            "促销策略",
        ],
    }

    default_names = [
        "课程介绍",
        "基础知识",
        "核心概念",
        "进阶技巧",
        "实战案例",
        "项目练习",
        "综合应用",
        "总结复习",
    ]

    templates = chapter_templates.get(course_name, default_names)
    if chapter_num <= len(templates):
        return templates[chapter_num - 1]
    return f"第{chapter_num}章内容"


if __name__ == "__main__":
    generate_sample_data()
