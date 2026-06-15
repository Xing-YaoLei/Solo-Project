from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app import models
from app.auth import get_password_hash
from datetime import datetime, timedelta
import random


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.User).count() > 0:
            print("数据库已存在数据，跳过初始化")
            return

        print("开始初始化数据库...")

        admin = models.User(
            username="admin",
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            full_name="系统管理员",
            role=models.UserRole.ADMIN,
        )

        manager = models.User(
            username="manager",
            email="manager@example.com",
            hashed_password=get_password_hash("manager123"),
            full_name="张经理",
            role=models.UserRole.MANAGER,
        )

        teacher = models.User(
            username="teacher",
            email="teacher@example.com",
            hashed_password=get_password_hash("teacher123"),
            full_name="李老师",
            role=models.UserRole.TEACHER,
        )

        students = []
        for i in range(1, 6):
            student = models.User(
                username=f"student{i}",
                email=f"student{i}@example.com",
                hashed_password=get_password_hash(f"student{i}123"),
                full_name=f"学生{i:02d}",
                role=models.UserRole.STUDENT,
            )
            students.append(student)

        db.add_all([admin, manager, teacher] + students)
        db.commit()

        tags_data = [
            ("基础概念", "知识点", "#3b82f6"),
            ("重点掌握", "知识点", "#10b981"),
            ("难点突破", "知识点", "#ef4444"),
            ("历年真题", "来源", "#8b5cf6"),
            ("模拟题", "来源", "#f59e0b"),
            ("第一章", "章节", "#06b6d4"),
            ("第二章", "章节", "#84cc16"),
            ("第三章", "章节", "#ec4899"),
            ("简单", "难度", "#10b981"),
            ("中等", "难度", "#f59e0b"),
            ("困难", "难度", "#ef4444"),
        ]
        tags = []
        for name, category, color in tags_data:
            tag = models.Tag(name=name, category=category, color=color)
            tags.append(tag)
            db.add(tag)
        db.commit()

        courses_data = [
            ("计算机网络基础", "CN001", "计算机网络基础知识课程，涵盖网络协议、TCP/IP、HTTP等内容"),
            ("数据库原理", "DB001", "数据库系统原理与应用课程"),
            ("数据结构与算法", "DS001", "常用数据结构与算法分析"),
            ("软件工程", "SE001", "软件开发过程与软件工程方法"),
        ]
        courses = []
        for name, code, desc in courses_data:
            course = models.Course(name=name, code=code, description=desc)
            courses.append(course)
            db.add(course)
        db.commit()

        for course in courses:
            course.teachers = [teacher]
        db.commit()

        chapters_data = {
            0: [("网络概述", 1), ("物理层", 2), ("数据链路层", 3), ("网络层", 4)],
            1: [("数据库概述", 1), ("关系模型", 2), ("SQL语言", 3), ("数据库设计", 4)],
            2: [("线性表", 1), ("栈和队列", 2), ("树和二叉树", 3), ("查找和排序", 4)],
            3: [("软件工程概述", 1), ("需求分析", 2), ("软件设计", 3), ("软件测试", 4)],
        }

        chapters = []
        for course_idx, chapter_list in chapters_data.items():
            course = courses[course_idx]
            for name, order in chapter_list:
                chapter = models.Chapter(
                    course_id=course.id,
                    name=name,
                    order_index=order,
                    description=f"{course.name} - {name}",
                    question_count=0,
                )
                chapters.append(chapter)
                db.add(chapter)
        db.commit()

        question_contents = [
            ("TCP/IP协议体系结构分为几层？", ["A. 3层", "B. 4层", "C. 5层", "D. 7层"], "B"),
            ("HTTP协议默认使用的端口号是？", ["A. 21", "B. 22", "C. 80", "D. 443"], "C"),
            ("DNS的主要作用是什么？", ["A. 数据加密", "B. 域名解析", "C. 数据压缩", "D. 负载均衡"], "B"),
            ("数据库中ACID特性不包括以下哪项？", ["A. 原子性", "B. 一致性", "C. 隔离性", "D. 可扩展性"], "D"),
            ("SQL语言中，用于查询数据的关键字是？", ["A. INSERT", "B. UPDATE", "C. SELECT", "D. DELETE"], "C"),
            ("以下哪种数据结构是先进先出？", ["A. 栈", "B. 队列", "C. 数组", "D. 链表"], "B"),
            ("快速排序的平均时间复杂度是？", ["A. O(n)", "B. O(nlogn)", "C. O(n²)", "D. O(logn)"], "B"),
            ("软件工程中，瀑布模型的第一个阶段是？", ["A. 设计", "B. 编码", "C. 需求分析", "D. 测试"], "C"),
            ("软件测试中，白盒测试主要关注什么？", ["A. 功能", "B. 性能", "C. 代码结构", "D. 用户界面"], "C"),
            ("二叉树的前序遍历顺序是？", ["A. 左-根-右", "B. 根-左-右", "C. 左-右-根", "D. 根-右-左"], "B"),
            ("TCP是面向连接的协议。", [], "正确"),
            ("数据库的三级模式结构包括外模式、模式和内模式。", [], "正确"),
            ("栈是一种先进先出的数据结构。", [], "错误"),
            ("软件生命周期包括可行性分析、需求分析、设计、编码、测试和维护。", [], "正确"),
        ]

        chapter_idx = 0
        for i, (content, options, answer) in enumerate(question_contents):
            chapter = chapters[chapter_idx % len(chapters)]
            course = courses[chapter_idx // 4 % len(courses)]

            q_type = models.QuestionType.SINGLE_CHOICE
            opt_dict = {}
            if options:
                for opt in options:
                    key = opt.split(".")[0]
                    val = opt.split(". ", 1)[1] if ". " in opt else opt
                    opt_dict[key] = val
            else:
                q_type = models.QuestionType.TRUE_FALSE

            difficulty = random.randint(1, 5)

            question = models.Question(
                course_id=course.id,
                chapter_id=chapter.id,
                question_type=q_type,
                content=content,
                options=opt_dict if opt_dict else None,
                correct_answer=answer,
                explanation=f"本题考查{course.name}的相关知识点。正确答案是{answer}。",
                difficulty=difficulty,
            )

            tag_indices = []
            tag_indices.append(i % 3)
            if difficulty >= 4:
                tag_indices.append(2)
            elif difficulty <= 2:
                tag_indices.append(8)
            else:
                tag_indices.append(9)
            tag_indices.append(3 + (i % 3))

            for idx in set(tag_indices):
                if idx < len(tags):
                    question.tags.append(tags[idx])

            db.add(question)
            chapter_idx += 1

        db.commit()

        for course in courses:
            course.total_questions = db.query(models.Question).filter(
                models.Question.course_id == course.id,
                models.Question.is_active == True
            ).count()

        for chapter in chapters:
            chapter.question_count = db.query(models.Question).filter(
                models.Question.chapter_id == chapter.id,
                models.Question.is_active == True
            ).count()

        db.commit()

        for i, student in enumerate(students):
            for j, course in enumerate(courses):
                total_q = course.total_questions
                completed = random.randint(0, total_q)
                correct = int(completed * random.uniform(0.5, 0.9))

                progress = models.StudyProgress(
                    student_id=student.id,
                    course_id=course.id,
                    total_questions=total_q,
                    completed_questions=completed,
                    correct_count=correct,
                    accuracy_rate=round(correct / completed * 100, 2) if completed > 0 else 0,
                    completion_rate=round(completed / total_q * 100, 2) if total_q > 0 else 0,
                    last_practice_at=datetime.utcnow() - timedelta(days=random.randint(0, 15)),
                )

                completion_rate = progress.completion_rate
                if completion_rate < 30:
                    progress.risk_level = models.RiskLevel.CRITICAL
                elif completion_rate < 50:
                    progress.risk_level = models.RiskLevel.DANGER
                elif completion_rate < 70:
                    progress.risk_level = models.RiskLevel.WARNING
                else:
                    progress.risk_level = models.RiskLevel.NORMAL

                db.add(progress)

        db.commit()

        reminder_rules = [
            ("完成率低于70%提醒", "学习完成率低于70%时触发提醒", "completion_rate", 70, models.RiskLevel.WARNING),
            ("完成率低于50%风险", "学习完成率低于50%时标记为风险", "completion_rate", 50, models.RiskLevel.DANGER),
            ("完成率低于30%严重", "学习完成率低于30%时标记为严重", "completion_rate", 30, models.RiskLevel.CRITICAL),
            ("连续3天未练习提醒", "连续3天没有练习记录时触发提醒", "days_without_practice", 3, models.RiskLevel.WARNING, 3),
            ("连续7天未练习风险", "连续7天没有练习记录时标记为风险", "days_without_practice", 7, models.RiskLevel.DANGER, 7),
        ]

        for rule_data in reminder_rules:
            rule = models.ReminderRule(
                name=rule_data[0],
                description=rule_data[1],
                rule_type=rule_data[2],
                threshold=rule_data[3],
                risk_level=rule_data[4],
                days_without_practice=rule_data[5] if len(rule_data) > 5 else None,
                is_active=True,
            )
            db.add(rule)

        db.commit()

        todo_items = [
            ("查看高风险学生学习情况", "需要跟进完成率低于50%的学生", "risk_followup", 1, teacher.id),
            ("准备下周复习资料", "整理本周学习难点，准备复习资料", "other", 2, teacher.id),
            ("完成计算机网络第一章练习", "本周需要完成网络概述部分的练习题", "review", 2, students[0].id),
            ("复习数据库SQL语句", "重点复习SELECT语句的各种用法", "other", 3, students[1].id),
        ]

        for title, desc, todo_type, priority, user_id in todo_items:
            todo = models.TodoItem(
                user_id=user_id,
                title=title,
                description=desc,
                todo_type=todo_type,
                priority=priority,
                is_completed=False,
            )
            db.add(todo)

        db.commit()

        print("数据库初始化完成！")
        print(f"创建了 {len([admin, manager, teacher] + students)} 个用户")
        print(f"创建了 {len(courses)} 门课程")
        print(f"创建了 {len(chapters)} 个章节")
        print(f"创建了 {len(tags)} 个标签")
        print(f"创建了 {len(question_contents)} 道题目")
        print(f"创建了 {len(reminder_rules)} 条提醒规则")

    except Exception as e:
        print(f"初始化失败: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
