from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import (
    User, UserRole, Student, Course, Score, ReviewApplication, ReviewStatus,
    AdvisorQuota, Classroom, ClassroomSchedule,
)
from app.security import get_password_hash


async def seed_database():
    async with AsyncSessionLocal() as db:
        user_count = (await db.execute(select(User))).scalars().all()
        if user_count:
            return

        users = [
            User(username="admin", password_hash=get_password_hash("admin123"), full_name="系统管理员",
                 email="admin@edu.cn", role=UserRole.ADMIN, department="教务处"),
            User(username="teacher1", password_hash=get_password_hash("teacher123"), full_name="张教授",
                 email="zhang@edu.cn", role=UserRole.TEACHER, department="计算机学院"),
            User(username="teacher2", password_hash=get_password_hash("teacher123"), full_name="李副教授",
                 email="li@edu.cn", role=UserRole.TEACHER, department="数学学院"),
            User(username="advisor1", password_hash=get_password_hash("advisor123"), full_name="王导师",
                 email="wang@edu.cn", role=UserRole.ADVISOR, department="计算机学院"),
            User(username="advisor2", password_hash=get_password_hash("advisor123"), full_name="赵导师",
                 email="zhao@edu.cn", role=UserRole.ADVISOR, department="数学学院"),
            User(username="affairs1", password_hash=get_password_hash("affairs123"), full_name="刘学工",
                 email="liu@edu.cn", role=UserRole.STUDENT_AFFAIRS, department="学生处"),
            User(username="auditor1", password_hash=get_password_hash("auditor123"), full_name="陈审计",
                 email="chen@edu.cn", role=UserRole.AUDITOR, department="审计处"),
        ]
        db.add_all(users)
        await db.flush()

        u_ids = {}
        for u in users:
            u_ids[u.username] = u.id

        students = []
        majors = ["计算机科学与技术", "软件工程", "人工智能", "数学与应用数学", "统计学"]
        grades = ["2022级", "2023级", "2024级"]
        classes_computer = ["计科1班", "计科2班", "软工1班", "软工2班", "AI1班"]
        classes_math = ["数应1班", "数应2班", "统计1班"]
        names_pool = ["周晓明", "吴雪婷", "郑浩然", "孙佳怡", "马天宇", "朱雨欣", "胡子豪", "林雅婷",
                      "黄俊杰", "何思琪", "高志远", "罗梦瑶", "梁子轩", "宋美琪", "谢云鹏", "唐雨桐"]

        for i in range(40):
            is_math = i >= 25
            major = majors[i % 3] if not is_math else majors[3 + (i % 2)]
            grade = grades[i % 3]
            class_list = classes_math if is_math else classes_computer
            cls = class_list[i % len(class_list)]
            dept = "数学学院" if is_math else "计算机学院"
            adv_key = "advisor2" if is_math else "advisor1"
            students.append(Student(
                student_id=f"2022{i:04d}" if i < 15 else f"2023{i:04d}" if i < 30 else f"2024{i:04d}",
                name=names_pool[i % len(names_pool)] + (str(i) if i >= len(names_pool) else ""),
                gender=["男", "女"][i % 2],
                grade=grade,
                major=major,
                class_name=cls,
                department=dept,
                phone=f"138{i:08d}",
                email=f"stu{i}@edu.cn",
                advisor_id=u_ids[adv_key],
            ))
        db.add_all(students)
        await db.flush()

        courses = [
            Course(course_code="CS101", course_name="高等数学(上)", credit=4.0, semester="2024-2025-1", department="数学学院"),
            Course(course_code="CS102", course_name="高等数学(下)", credit=4.0, semester="2024-2025-2", department="数学学院"),
            Course(course_code="CS201", course_name="线性代数", credit=3.0, semester="2024-2025-1", department="数学学院"),
            Course(course_code="CS301", course_name="概率论与数理统计", credit=3.0, semester="2024-2025-2", department="数学学院"),
            Course(course_code="PROG101", course_name="程序设计基础", credit=4.0, semester="2024-2025-1", department="计算机学院"),
            Course(course_code="PROG201", course_name="数据结构与算法", credit=4.0, semester="2024-2025-2", department="计算机学院"),
            Course(course_code="DB101", course_name="数据库原理", credit=3.5, semester="2024-2025-1", department="计算机学院"),
            Course(course_code="OS101", course_name="操作系统", credit=3.5, semester="2024-2025-2", department="计算机学院"),
            Course(course_code="AI101", course_name="人工智能导论", credit=3.0, semester="2024-2025-1", department="计算机学院"),
            Course(course_code="NET101", course_name="计算机网络", credit=3.5, semester="2024-2025-2", department="计算机学院"),
        ]
        db.add_all(courses)
        await db.flush()

        c_ids = {}
        for c in courses:
            c_ids[c.course_code] = c.id

        scores = []
        import random
        random.seed(42)
        for idx, s in enumerate(students):
            relevant_courses = ["CS101", "CS102", "CS201", "CS301"] if s.department == "数学学院" else \
                ["PROG101", "PROG201", "DB101", "OS101", "CS101", "CS201", "AI101", "NET101"]
            for cc in relevant_courses:
                cid = c_ids[cc]
                usual = random.randint(70, 95)
                mid = random.randint(60, 100)
                final = random.randint(45, 98)
                total = round(usual * 0.2 + mid * 0.3 + final * 0.5, 1)
                gp = 0.0
                if total >= 90:
                    gp = 4.0
                elif total >= 85:
                    gp = 3.7
                elif total >= 80:
                    gp = 3.3
                elif total >= 75:
                    gp = 3.0
                elif total >= 70:
                    gp = 2.3
                elif total >= 65:
                    gp = 2.0
                elif total >= 60:
                    gp = 1.0
                scores.append(Score(
                    student_id=s.id, course_id=cid,
                    usual_score=usual, midterm_score=mid, final_score=final,
                    total_score=total, grade_point=gp,
                    score_level="优秀" if total >= 90 else "良好" if total >= 80 else "中等" if total >= 70 else "及格" if total >= 60 else "不及格",
                    semester="2024-2025-1" if cc in ["CS101", "CS201", "PROG101", "DB101", "AI101"] else "2024-2025-2",
                    teacher_id=u_ids["teacher2"] if s.department == "数学学院" else u_ids["teacher1"],
                ))
        db.add_all(scores)
        await db.flush()

        reviews = []
        review_count = 0
        for i, sc in enumerate(scores):
            if sc.total_score < 60 and review_count < 15:
                review_count += 1
                student = next((s for s in students if s.id == sc.student_id), None)
                course = next((c for c in courses if c.id == sc.course_id), None)
                status = list(ReviewStatus)[review_count % 6]
                rev = ReviewApplication(
                    student_id=sc.student_id,
                    course_id=sc.course_id,
                    score_id=sc.id,
                    application_no=f"RV{20250000 + review_count}",
                    reason=f"对{course.course_name if course else ''}成绩有异议，平时作业全部完成，认为评分有误，申请复核。",
                    current_score=sc.total_score,
                    expected_score=random.randint(60, 75),
                    status=status,
                    materials=[
                        {"name": "作业证明.pdf", "type": "pdf", "url": f"/materials/hw_{review_count}.pdf",
                         "uploaded_at": (datetime.utcnow() - timedelta(days=review_count)).isoformat()},
                    ] if status != ReviewStatus.MATERIALS_MISSING else [],
                    missing_materials=["考试答卷复印件", "平时作业证明"] if status == ReviewStatus.MATERIALS_MISSING else [],
                    reviewer_id=u_ids["teacher1"] if review_count % 2 == 0 else u_ids["teacher2"],
                    handler_id=u_ids["affairs1"],
                    review_result=None if status in [ReviewStatus.PENDING, ReviewStatus.UNDER_REVIEW, ReviewStatus.MATERIALS_MISSING]
                    else ("经核查，成绩无误" if status == ReviewStatus.REJECTED else
                          ("成绩更正为及格" if status == ReviewStatus.APPROVED else "复核流程结束")),
                    adjusted_score=None if status in [ReviewStatus.PENDING, ReviewStatus.UNDER_REVIEW, ReviewStatus.MATERIALS_MISSING, ReviewStatus.REJECTED]
                    else 62.5 if status == ReviewStatus.APPROVED else None,
                    applied_at=datetime.utcnow() - timedelta(days=review_count * 3, hours=review_count),
                    reviewed_at=None if status in [ReviewStatus.PENDING, ReviewStatus.UNDER_REVIEW] else
                    datetime.utcnow() - timedelta(days=review_count),
                    closed_at=datetime.utcnow() - timedelta(days=review_count - 1) if status in [ReviewStatus.APPROVED, ReviewStatus.REJECTED, ReviewStatus.CLOSED] else None,
                    deadline=date.today() + timedelta(days=15 - review_count),
                )
                reviews.append(rev)
        db.add_all(reviews)

        quotas = [
            AdvisorQuota(advisor_id=u_ids["advisor1"], semester="2024-2025-1", max_quota=15, current_assigned=12, department="计算机学院"),
            AdvisorQuota(advisor_id=u_ids["advisor2"], semester="2024-2025-1", max_quota=10, current_assigned=8, department="数学学院"),
            AdvisorQuota(advisor_id=u_ids["advisor1"], semester="2024-2025-2", max_quota=18, current_assigned=10, department="计算机学院"),
            AdvisorQuota(advisor_id=u_ids["teacher1"], semester="2024-2025-2", max_quota=5, current_assigned=3, department="计算机学院"),
        ]
        db.add_all(quotas)

        classrooms = []
        buildings = ["第一教学楼", "第二教学楼", "第三教学楼", "实验楼"]
        for b in buildings:
            for floor in range(1, 6):
                for rn in range(1, 6):
                    capacity = 40 if rn < 4 else 80 if rn == 4 else 120
                    room_type = "普通教室" if capacity < 80 else "多媒体教室" if capacity < 100 else "阶梯教室"
                    equipment = ["投影仪", "音响系统"]
                    if capacity >= 80:
                        equipment.append("录播设备")
                    if room_type == "阶梯教室":
                        equipment.append("无线话筒")
                    classrooms.append(Classroom(
                        building=b,
                        room_no=f"{floor}{rn:02d}",
                        capacity=capacity,
                        room_type=room_type,
                        equipment=equipment,
                    ))
        db.add_all(classrooms)
        await db.flush()

        schedules = []
        today = date.today()
        for ci, cr in enumerate(classrooms[:20]):
            for day_offset in range(10):
                d = today - timedelta(days=day_offset)
                if d.weekday() >= 5:
                    continue
                periods = [(1, 2), (3, 4), (5, 6), (7, 8)]
                for pi, (ps, pe) in enumerate(periods[:ci % 3 + 1]):
                    schedules.append(ClassroomSchedule(
                        classroom_id=cr.id,
                        course_id=c_ids[list(c_ids.keys())[(ci + pi) % len(c_ids)]],
                        date=d,
                        period_start=ps,
                        period_end=pe,
                        usage_type="教学",
                        actual_attendance=max(0, cr.capacity - random.randint(2, 15)),
                    ))
        db.add_all(schedules)

        await db.commit()
