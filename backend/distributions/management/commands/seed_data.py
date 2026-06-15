from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from courses.models import Course, Chapter
from materials.models import Tag, Material
from students.models import Student
from distributions.models import Distribution
from progress_app.models import Progress, ChapterCompletion, Grade
from risk.models import RiskRecord, Communication, ReviewConclusion
from reminders.models import ReminderRule, ReminderLog


class Command(BaseCommand):
    help = "Seed the database with initial demo data"

    def handle(self, *args, **options):
        self.stdout.write("🌱 Seeding demo data...")

        self._create_courses_and_chapters()
        self._create_tags()
        self._create_materials()
        self._create_students()
        self._create_distributions()
        self._create_progress()
        self._create_risks()
        self._create_reminder_rules()

        self.stdout.write(self.style.SUCCESS("✅ Demo data seeded successfully!"))

    def _create_courses_and_chapters(self):
        self.stdout.write("  → Creating courses and chapters...")
        courses_data = [
            {
                "name": "青少年编程入门",
                "description": "面向青少年的 Python 编程基础课程",
                "chapters": ["环境搭建与第一个程序", "变量与数据类型", "条件判断", "循环结构", "函数入门"],
            },
            {
                "name": "数学思维训练",
                "description": "培养逻辑思维和数学解题能力",
                "chapters": ["数论基础", "几何图形", "概率统计", "逻辑推理", "综合应用"],
            },
            {
                "name": "英语阅读提升",
                "description": "提升英语阅读理解和词汇量",
                "chapters": ["词汇拓展", "短篇阅读", "长篇阅读", "技巧训练", "模拟测试"],
            },
        ]

        for course_data in courses_data:
            course, _ = Course.objects.get_or_create(
                name=course_data["name"],
                defaults={"description": course_data["description"]},
            )
            for order, chapter_name in enumerate(course_data["chapters"], 1):
                Chapter.objects.get_or_create(
                    course=course,
                    order=order,
                    defaults={"name": chapter_name},
                )

    def _create_tags(self):
        self.stdout.write("  → Creating tags...")
        tags_data = [
            ("基础", "#3498DB"),
            ("进阶", "#9B59B6"),
            ("重点", "#E74C3C"),
            ("必学", "#F28C28"),
            ("选学", "#27AE60"),
        ]
        for name, color in tags_data:
            Tag.objects.get_or_create(name=name, defaults={"color": color})

    def _create_materials(self):
        self.stdout.write("  → Creating materials...")
        course1 = Course.objects.get(name="青少年编程入门")
        course2 = Course.objects.get(name="数学思维训练")
        course3 = Course.objects.get(name="英语阅读提升")
        tag_basic = Tag.objects.get(name="基础")
        tag_key = Tag.objects.get(name="重点")
        tag_required = Tag.objects.get(name="必学")
        tag_optional = Tag.objects.get(name="选学")

        materials_data = [
            {
                "title": "Python 编程基础手册（上）",
                "description": "涵盖变量、数据类型、条件判断等核心概念",
                "course": course1,
                "tags": [tag_basic, tag_required],
                "file_url": "materials/python-basic-1.pdf",
            },
            {
                "title": "Python 编程基础手册（下）",
                "description": "循环、函数、模块等进阶内容",
                "course": course1,
                "tags": [tag_basic, tag_key],
                "file_url": "materials/python-basic-2.pdf",
            },
            {
                "title": "数论入门讲义",
                "description": "质数、因数、倍数等基础数论",
                "course": course2,
                "tags": [tag_basic, tag_required],
                "file_url": "materials/math-number-theory.pdf",
            },
            {
                "title": "几何图形习题集",
                "description": "平面几何与立体几何练习",
                "course": course2,
                "tags": [tag_key],
                "file_url": "materials/math-geometry.pdf",
            },
            {
                "title": "英语核心词汇 500",
                "description": "常用词汇记忆手册",
                "course": course3,
                "tags": [tag_basic, tag_required],
                "file_url": "materials/english-vocabulary.pdf",
            },
            {
                "title": "英语阅读理解精选",
                "description": "20篇精选阅读文章带解析",
                "course": course3,
                "tags": [tag_key, tag_optional],
                "file_url": "materials/english-reading.pdf",
            },
        ]

        for mat_data in materials_data:
            tags = mat_data.pop("tags")
            material, _ = Material.objects.get_or_create(
                title=mat_data["title"], defaults=mat_data
            )
            material.tags.set(tags)

    def _create_students(self):
        self.stdout.write("  → Creating students...")
        students_data = [
            ("张小明", "初一(2)班", "13800138001", "13900139001"),
            ("李华", "初一(2)班", "13800138002", "13900139002"),
            ("王芳", "初二(1)班", "13800138003", "13900139003"),
            ("刘洋", "初二(1)班", "13800138004", "13900139004"),
            ("陈静", "初一(1)班", "13800138005", "13900139005"),
            ("杨帆", "初三(2)班", "13800138006", "13900139006"),
            ("赵敏", "初三(2)班", "13800138007", "13900139007"),
            ("孙浩然", "初一(3)班", "13800138008", "13900139008"),
            ("周雨桐", "初二(3)班", "13800138009", "13900139009"),
            ("吴磊", "初三(1)班", "13800138010", "13900139010"),
        ]
        for name, class_name, contact, guardian in students_data:
            Student.objects.get_or_create(
                name=name,
                defaults={
                    "class_name": class_name,
                    "contact": contact,
                    "guardian_contact": guardian,
                },
            )

    def _create_distributions(self):
        self.stdout.write("  → Creating distributions...")
        materials = list(Material.objects.all())
        students = list(Student.objects.all())
        statuses = ["pending", "following", "following", "reviewing", "completed", "completed"]
        risk_levels = [None, None, "low", "medium", "high", None]
        all_tags = list(Tag.objects.all())

        now = timezone.now()
        for i, student in enumerate(students):
            for j, material in enumerate(materials[:3]):
                idx = (i + j) % len(statuses)
                dist, created = Distribution.objects.get_or_create(
                    student=student,
                    material=material,
                    defaults={
                        "status": statuses[idx],
                        "risk_level": risk_levels[idx],
                        "distributed_at": now - timedelta(days=i * 2 + j),
                    },
                )
                if created and idx % 2 == 0:
                    dist.tags.add(all_tags[j % len(all_tags)])

    def _create_progress(self):
        self.stdout.write("  → Creating progress records...")
        distributions = Distribution.objects.exclude(status="pending")
        for dist in distributions:
            progress, _ = Progress.objects.get_or_create(
                distribution=dist,
                defaults={
                    "percentage": min(dist.id * 17 % 101, 100),
                    "last_updated": timezone.now() - timedelta(days=dist.id % 5),
                },
            )
            chapters = Chapter.objects.filter(course=dist.material.course)
            for k, chapter in enumerate(chapters):
                completed = k < (progress.percentage // 20)
                ChapterCompletion.objects.get_or_create(
                    progress=progress,
                    chapter=chapter,
                    defaults={
                        "completed": completed,
                        "completed_at": timezone.now() - timedelta(days=k) if completed else None,
                    },
                )
                if completed and k > 0:
                    Grade.objects.get_or_create(
                        progress=progress,
                        chapter=chapter,
                        defaults={
                            "score": 70 + (k * 7 + dist.id) % 30,
                            "feedback": "表现不错，继续保持！" if k % 2 == 0 else "需要加强练习。",
                        },
                    )

    def _create_risks(self):
        self.stdout.write("  → Creating risk records...")
        high_risk_dists = Distribution.objects.filter(risk_level="high")
        medium_risk_dists = Distribution.objects.filter(risk_level="medium")
        low_risk_dists = Distribution.objects.filter(risk_level="low")

        for dist in high_risk_dists:
            risk, _ = RiskRecord.objects.get_or_create(
                distribution=dist,
                defaults={
                    "risk_level": "high",
                    "reason": "学习进度严重落后，连续2周无更新记录。",
                },
            )
            Communication.objects.get_or_create(
                risk=risk,
                comm_type="phone",
                defaults={
                    "content": "已与家长电话沟通，了解到学员近期学业较重，已协商调整学习计划。",
                },
            )
            Communication.objects.get_or_create(
                risk=risk,
                comm_type="in_person",
                defaults={
                    "content": "面谈学员，分析学习难点，制定补习方案。",
                },
            )
            ReviewConclusion.objects.get_or_create(
                risk=risk,
                defaults={
                    "conclusion": "已制定个性化学习计划，每周跟进2次，2周后复核。",
                    "reviewer_id": 1,
                },
            )

        for dist in medium_risk_dists:
            risk, _ = RiskRecord.objects.get_or_create(
                distribution=dist,
                defaults={
                    "risk_level": "medium",
                    "reason": "学习进度低于预期50%。",
                },
            )
            Communication.objects.get_or_create(
                risk=risk,
                comm_type="online",
                defaults={
                    "content": "已通过微信提醒学员和家长，建议增加学习时间。",
                },
            )

        for dist in low_risk_dists:
            RiskRecord.objects.get_or_create(
                distribution=dist,
                defaults={
                    "risk_level": "low",
                    "reason": "进度略有滞后，需持续关注。",
                },
            )

    def _create_reminder_rules(self):
        self.stdout.write("  → Creating reminder rules...")
        rules_data = [
            ("进度低于30%提醒", "progress_below", 30, "both", 3, True),
            ("7天未更新提醒", "no_update_days", 7, "in_app", 7, True),
            ("成绩低于60分提醒", "grade_below", 60, "email", 5, True),
            ("进度低于50%提醒", "progress_below", 50, "in_app", 7, False),
        ]
        for name, cond, threshold, method, freq, active in rules_data:
            ReminderRule.objects.get_or_create(
                name=name,
                defaults={
                    "condition_type": cond,
                    "threshold": threshold,
                    "remind_method": method,
                    "frequency_days": freq,
                    "is_active": active,
                },
            )

        rule = ReminderRule.objects.first()
        if rule:
            students = Student.objects.all()[:3]
            for student in students:
                ReminderLog.objects.get_or_create(
                    rule=rule,
                    student=student,
                    defaults={
                        "message": f"学员{student.name}的学习进度低于{rule.threshold}%，请及时关注。",
                        "is_read": False,
                    },
                )
