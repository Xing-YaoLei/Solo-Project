import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from datetime import date

from app.db.session import SessionLocal
from app.models import User, Student, TeacherStudent, Course, Chapter, Question, QuestionTag, QuestionTagRelation, CaliberVersion
from app.core.security import get_password_hash

db = SessionLocal()

try:
    print("开始创建初始数据...")

    users = [
        User(username="admin", password_hash=get_password_hash("admin123"), role="admin", name="系统管理员"),
        User(username="manager", password_hash=get_password_hash("manager123"), role="manager", name="张经理"),
        User(username="teacher1", password_hash=get_password_hash("teacher123"), role="teacher", name="李老师"),
        User(username="teacher2", password_hash=get_password_hash("teacher123"), role="teacher", name="王老师"),
    ]
    db.add_all(users)
    db.flush()
    print("创建用户完成")

    students = []
    for i in range(1, 51):
        class_id = f"CLASS_{(i-1) // 10 + 1:02d}"
        students.append(Student(
            name=f"学员{i:02d}",
            class_id=class_id,
            employee_no=f"EMP{i:04d}"
        ))
    db.add_all(students)
    db.flush()
    print("创建学员完成")

    teacher1 = db.query(User).filter(User.username == "teacher1").first()
    teacher2 = db.query(User).filter(User.username == "teacher2").first()

    relations = []
    for i, student in enumerate(students):
        teacher = teacher1 if i < 25 else teacher2
        relations.append(TeacherStudent(
            teacher_id=teacher.id,
            student_id=student.id
        ))
    db.add_all(relations)
    db.flush()
    print("创建教师-学员关联完成")

    courses = [
        Course(name="Python程序设计", description="Python编程语言从入门到精通"),
        Course(name="数据分析实战", description="数据分析方法与工具应用"),
        Course(name="Web前端开发", description="HTML/CSS/JavaScript前端开发技术"),
    ]
    db.add_all(courses)
    db.flush()
    print("创建课程完成")

    chapters = []
    for course in courses:
        for i in range(1, 6):
            chapters.append(Chapter(
                course_id=course.id,
                name=f"{course.name} - 第{i}章",
                order_index=i
            ))
    db.add_all(chapters)
    db.flush()
    print("创建章节完成")

    questions = []
    for chapter in chapters:
        for i in range(1, 11):
            questions.append(Question(
                chapter_id=chapter.id,
                content=f"{chapter.name} 第{i}题",
                difficulty=["easy", "medium", "hard"][i % 3]
            ))
    db.add_all(questions)
    db.flush()
    print("创建题目完成")

    tags = [
        QuestionTag(tag_name="基础概念"),
        QuestionTag(tag_name="代码实操"),
        QuestionTag(tag_name="算法分析"),
        QuestionTag(tag_name="案例分析"),
        QuestionTag(tag_name="综合应用"),
        QuestionTag(tag_name="易错点"),
        QuestionTag(tag_name="高频考点"),
        QuestionTag(tag_name="拓展知识"),
    ]
    db.add_all(tags)
    db.flush()
    print("创建标签完成")

    tag_relations = []
    for i, question in enumerate(questions):
        tag_relations.append(QuestionTagRelation(
            question_id=question.id,
            tag_id=tags[i % len(tags)].id
        ))
    db.add_all(tag_relations)
    db.flush()
    print("创建题目-标签关联完成")

    calibers = [
        CaliberVersion(
            version="v1.0",
            effective_date=date.today(),
            formula="完成率 = 正确题目数 / 总练习题目数 × 100%",
            description="基础完成率计算口径，统计所有练习记录",
            change_reason="初始版本",
            is_active=True
        ),
        CaliberVersion(
            version="v1.1",
            effective_date=date.today(),
            formula="完成率 = 正确题目数 / (总练习题目数 - 重复练习题目数) × 100%",
            description="优化完成率计算，去重重复练习记录",
            change_reason="解决重复刷题导致完成率虚高问题",
            is_active=False
        ),
    ]
    db.add_all(calibers)
    db.commit()
    print("创建口径版本完成")

    print("\n=== 初始数据创建成功! ===")
    print("\n测试账号:")
    print("  管理员: admin / admin123")
    print("  管理层: manager / manager123")
    print("  教师1: teacher1 / teacher123")
    print("  教师2: teacher2 / teacher123")

except Exception as e:
    db.rollback()
    print(f"创建数据失败: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
