import polars as pl
import numpy as np
from datetime import datetime, timedelta
import uuid
import random
from typing import List, Dict
from src.data.database import db
from config import setup_logger

logger = setup_logger()


class SampleDataGenerator:
    def __init__(self):
        self.departments = [
            {"dept_id": "DEPT001", "dept_name": "计算机科学与技术学院", "dept_code": "CS", "parent_dept_id": None},
            {"dept_id": "DEPT002", "dept_name": "电子信息工程学院", "dept_code": "EE", "parent_dept_id": None},
            {"dept_id": "DEPT003", "dept_name": "机械工程学院", "dept_code": "ME", "parent_dept_id": None},
            {"dept_id": "DEPT004", "dept_name": "经济管理学院", "dept_code": "EM", "parent_dept_id": None},
            {"dept_id": "DEPT005", "dept_name": "外国语学院", "dept_code": "FL", "parent_dept_id": None},
            {"dept_id": "DEPT006", "dept_name": "数学与统计学院", "dept_code": "MA", "parent_dept_id": None},
        ]

        self.grades = ["2021", "2022", "2023", "2024"]
        self.majors = {
            "DEPT001": ["计算机科学与技术", "软件工程", "人工智能", "网络空间安全"],
            "DEPT002": ["电子信息工程", "通信工程", "微电子"],
            "DEPT003": ["机械设计制造", "车辆工程", "工业设计"],
            "DEPT004": ["工商管理", "会计学", "金融学"],
            "DEPT005": ["英语", "日语", "翻译"],
            "DEPT006": ["数学与应用数学", "统计学", "信息与计算科学"],
        }

        self.course_types = ["必修课", "选修课", "公共课", "实践课"]
        self.textbooks = [
            "高等数学", "大学英语", "计算机基础", "程序设计基础",
            "数据结构", "计算机网络", "操作系统", "数据库原理",
            "线性代数", "概率论与数理统计", "大学物理", "马克思主义基本原理",
            "毛泽东思想和中国特色社会主义理论体系概论", "大学体育", "创新创业基础",
            "软件工程", "人工智能导论", "机器学习", "深度学习",
            "计算机图形学", "编译原理", "数字电路", "信号与系统",
        ]

        self.publishers = [
            "高等教育出版社", "清华大学出版社", "北京大学出版社",
            "机械工业出版社", "电子工业出版社", "人民邮电出版社",
            "外语教学与研究出版社", "上海外语教育出版社",
        ]

        self.approvers = ["张教授", "李主任", "王院长", "赵处长"]
        self.student_names = [
            "张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十",
            "郑十一", "王十二", "冯十三", "陈十四", "褚十五", "卫十六",
        ]

        self.terms = [
            {"term_id": "2023-2024-1", "term_name": "2023-2024学年第一学期",
             "start_date": "2023-09-01", "end_date": "2024-01-31", "status": "completed"},
            {"term_id": "2023-2024-2", "term_name": "2023-2024学年第二学期",
             "start_date": "2024-02-26", "end_date": "2024-07-15", "status": "completed"},
            {"term_id": "2024-2025-1", "term_name": "2024-2025学年第一学期",
             "start_date": "2024-09-02", "end_date": "2025-02-07", "status": "completed"},
            {"term_id": "2024-2025-2", "term_name": "2024-2025学年第二学期",
             "start_date": "2025-02-24", "end_date": "2025-07-11", "status": "active"},
            {"term_id": "2025-2026-1", "term_name": "2025-2026学年第一学期",
             "start_date": "2025-09-01", "end_date": "2026-01-29", "status": "current"},
        ]

        self.buildings = ["教学楼A", "教学楼B", "教学楼C", "实验楼", "综合楼", "图书馆"]

        self.statuses = ["submitted", "approved", "purchased", "stocked", "distributed", "pending", "rejected"]

    def generate_all(self):
        logger.info("开始生成示例数据...")

        self._generate_terms()
        self._generate_departments()
        self._generate_courses()
        self._generate_students()
        self._generate_textbook_orders()
        self._generate_student_applications()
        self._generate_approvals()
        self._generate_campus_card_records()
        self._generate_classrooms()
        self._generate_course_schedules()
        self._generate_evaluations()
        self._generate_data_sources()
        self._generate_data_versions()

        logger.info("示例数据生成完成！")

    def _generate_terms(self):
        df = pl.DataFrame(self.terms)
        df = df.with_columns([
            pl.col("start_date").str.to_date(),
            pl.col("end_date").str.to_date(),
        ])
        db.insert_dataframe("academic_term", df)
        logger.info(f"生成 {len(df)} 条学期数据")

    def _generate_departments(self):
        df = pl.DataFrame(self.departments)
        db.insert_dataframe("department", df)
        logger.info(f"生成 {len(df)} 条院系数据")

    def _generate_courses(self):
        courses = []
        course_id = 1
        for dept in self.departments:
            for grade in self.grades:
                majors = self.majors.get(dept["dept_id"], [])
                for major in majors:
                    num_courses = random.randint(3, 6)
                    for i in range(num_courses):
                        textbook_idx = random.randint(0, len(self.textbooks) - 1)
                        course_type = random.choice(self.course_types)
                        student_count = random.randint(30, 120)

                        courses.append({
                            "course_id": f"COURSE{course_id:04d}",
                            "course_code": f"{dept['dept_code']}{grade[-2:]}{course_id:03d}",
                            "course_name": self.textbooks[textbook_idx],
                            "dept_id": dept["dept_id"],
                            "grade": grade,
                            "major": major,
                            "student_count": student_count,
                            "course_type": course_type,
                        })
                        course_id += 1

        df = pl.DataFrame(courses)
        db.insert_dataframe("course", df)
        logger.info(f"生成 {len(df)} 条课程数据")

    def _generate_students(self):
        students = []
        student_id = 1
        for dept in self.departments:
            for grade in self.grades:
                majors = self.majors.get(dept["dept_id"], [])
                for major in majors:
                    num_students = random.randint(80, 150)
                    for i in range(num_students):
                        class_idx = random.randint(1, 5)
                        name_idx = random.randint(0, len(self.student_names) - 1)
                        students.append({
                            "student_id": f"STU{student_id:06d}",
                            "student_name": f"{self.student_names[name_idx]}{random.randint(1, 100)}",
                            "dept_id": dept["dept_id"],
                            "grade": grade,
                            "major": major,
                            "class_name": f"{grade}{major[:2]}{class_idx:02d}班",
                        })
                        student_id += 1

        df = pl.DataFrame(students)
        db.insert_dataframe("student", df)
        logger.info(f"生成 {len(df)} 条学生数据")

    def _generate_textbook_orders(self):
        courses_df = db.query("SELECT * FROM course")
        orders = []
        order_id = 1

        for term in self.terms[-3:]:
            for course in courses_df.to_dicts():
                if random.random() < 0.85:
                    textbook_idx = random.randint(0, len(self.textbooks) - 1)
                    status = random.choices(
                        self.statuses,
                        weights=[0.1, 0.2, 0.25, 0.2, 0.15, 0.05, 0.05]
                    )[0]

                    base_price = random.uniform(25, 85)
                    quantity = course["student_count"] if random.random() < 0.7 else int(course["student_count"] * random.uniform(0.8, 1.2))

                    data_sources = ["teaching_platform", "campus_card", "student_application"]
                    data_source = random.choice(data_sources)

                    created_date = datetime.strptime(term["start_date"], "%Y-%m-%d") + timedelta(days=random.randint(5, 30))
                    updated_date = created_date + timedelta(days=random.randint(1, 60))

                    orders.append({
                        "order_id": f"ORD{order_id:06d}",
                        "course_id": course["course_id"],
                        "term_id": term["term_id"],
                        "textbook_isbn": f"978-7-{random.randint(100, 999)}-{random.randint(1000, 9999)}-{random.randint(0, 9)}" if random.random() < 0.9 else None,
                        "textbook_name": self.textbooks[textbook_idx],
                        "publisher": random.choice(self.publishers) if random.random() < 0.95 else None,
                        "price": round(base_price, 2) if random.random() < 0.9 else None,
                        "quantity": int(quantity) if random.random() < 0.95 else 0,
                        "order_status": status,
                        "created_at": created_date,
                        "updated_at": updated_date,
                        "data_source": data_source,
                        "version_id": random.randint(1, 5),
                    })
                    order_id += 1

        df = pl.DataFrame(orders)
        db.insert_dataframe("textbook_order", df)
        logger.info(f"生成 {len(df)} 条教材订购数据")

    def _generate_student_applications(self):
        orders_df = db.query("SELECT * FROM textbook_order WHERE order_status IN ('submitted', 'approved', 'purchased', 'stocked', 'distributed')")
        students_df = db.query("SELECT student_id, dept_id FROM student LIMIT 500")

        applications = []
        application_id = 1

        for order in orders_df.to_dicts():
            if random.random() > 0.85:
                continue

            course = db.query(f"SELECT * FROM course WHERE course_id = '{order['course_id']}'").to_dicts()
            if not course:
                continue

            course = course[0]
            dept_students = students_df.filter(pl.col("dept_id") == course["dept_id"])
            if dept_students.is_empty():
                dept_students = students_df

            if len(dept_students) == 0:
                continue

            num_applications = min(
                max(1, int(order["quantity"] * 0.6) if order["quantity"] > 0 else random.randint(1, 3)),
                len(dept_students)
            )

            selected_indices = random.sample(range(len(dept_students)), num_applications)

            for idx in selected_indices:
                student = dept_students.row(idx, named=True)
                submit_date = order["created_at"] + timedelta(days=random.randint(-7, 3))
                version = random.randint(1, 3)
                has_confirmed = random.random() > 0.1

                applications.append({
                    "application_id": f"APP{application_id:06d}",
                    "order_id": order["order_id"],
                    "student_id": student["student_id"],
                    "textbook_name": order["textbook_name"],
                    "textbook_isbn": order["textbook_isbn"],
                    "publisher": order["publisher"],
                    "price": order["price"],
                    "quantity": 1,
                    "submit_time": submit_date,
                    "has_confirmed": has_confirmed,
                    "confirm_time": submit_date + timedelta(hours=random.randint(1, 72)) if has_confirmed else None,
                    "version_id": version,
                    "data_source": random.choice(["student_portal", "manual"]),
                    "created_at": submit_date,
                    "updated_at": submit_date + timedelta(hours=random.randint(1, 48)),
                })
                application_id += 1

        df = pl.DataFrame(applications)
        db.insert_dataframe("student_application", df)
        logger.info(f"生成 {len(df)} 条学生申请数据")

    def _generate_approvals(self):
        orders_df = db.query("SELECT * FROM textbook_order WHERE order_status IN ('approved', 'purchased', 'stocked', 'distributed')")
        approvals = []
        approval_id = 1

        for order in orders_df.to_dicts():
            num_steps = random.randint(2, 4)
            for step in range(1, num_steps + 1):
                approver_idx = min(step - 1, len(self.approvers) - 1)
                created_date = order["created_at"]
                approval_date = created_date + timedelta(days=step * random.randint(1, 5))

                approvals.append({
                    "approval_id": f"APR{approval_id:06d}",
                    "order_id": order["order_id"],
                    "approval_step": step,
                    "approver": self.approvers[approver_idx],
                    "approval_time": approval_date if order["order_status"] != "pending" else None,
                    "approval_result": "approved" if order["order_status"] != "rejected" else "rejected",
                    "opinion": "同意" if order["order_status"] != "rejected" else "需要补充材料",
                })
                approval_id += 1

        df = pl.DataFrame(approvals)
        db.insert_dataframe("approval_record", df)
        logger.info(f"生成 {len(df)} 条审批记录")

    def _generate_campus_card_records(self):
        students_df = db.query("SELECT * FROM student LIMIT 500")
        orders_df = db.query("SELECT * FROM textbook_order WHERE order_status = 'distributed'")

        records = []
        record_id = 1

        for order in orders_df.to_dicts():
            course = db.query(f"SELECT * FROM course WHERE course_id = '{order['course_id']}'").to_dicts()
            if not course:
                continue

            num_records = min(order["quantity"] if order["quantity"] > 0 else course[0]["student_count"], 50)

            for i in range(num_records):
                student_idx = random.randint(0, len(students_df) - 1)
                student = students_df.row(student_idx, named=True)
                trans_date = order["updated_at"] + timedelta(days=random.randint(1, 30))
                amount = order["price"] if order["price"] else random.uniform(30, 70)

                records.append({
                    "record_id": f"REC{record_id:06d}",
                    "student_id": student["student_id"],
                    "order_id": order["order_id"],
                    "trans_time": trans_date,
                    "amount": round(amount, 2),
                    "trans_type": "教材费",
                    "status": "success",
                })
                record_id += 1

        df = pl.DataFrame(records)
        db.insert_dataframe("campus_card_record", df)
        logger.info(f"生成 {len(df)} 条一卡通记录")

    def _generate_classrooms(self):
        classrooms = []
        room_id = 1

        for building in self.buildings:
            for floor in range(1, 6):
                for room_num in range(1, random.randint(3, 8)):
                    capacity = random.choice([30, 45, 60, 90, 120, 150])
                    building_type = "普通教室" if "教学楼" in building else "实验室" if "实验楼" in building else "多媒体教室"

                    equipment_options = ["投影仪", "音响系统", "白板", "空调"]
                    if building_type == "实验室":
                        equipment_options.extend(["实验设备", "电脑"])

                    selected_equipment = random.sample(equipment_options, random.randint(2, len(equipment_options)))

                    classrooms.append({
                        "classroom_id": f"ROOM{room_id:04d}",
                        "building": building,
                        "room_number": f"{floor}{room_num:02d}",
                        "capacity": capacity,
                        "equipment": ",".join(selected_equipment),
                        "building_type": building_type,
                    })
                    room_id += 1

        df = pl.DataFrame(classrooms)
        db.insert_dataframe("classroom", df)
        logger.info(f"生成 {len(df)} 条教室数据")

    def _generate_course_schedules(self):
        courses_df = db.query("SELECT * FROM course")
        classrooms_df = db.query("SELECT * FROM classroom")
        schedules = []
        schedule_id = 1

        for course in courses_df.to_dicts():
            num_schedules = random.randint(1, 3)
            for i in range(num_schedules):
                classroom_idx = random.randint(0, len(classrooms_df) - 1)
                classroom = classrooms_df.row(classroom_idx, named=True)
                day_of_week = random.randint(1, 5)
                period_start = random.choice([1, 3, 5, 7, 9])
                period_end = period_start + random.randint(1, 2)
                weeks = ",".join([str(w) for w in random.sample(range(1, 19), random.randint(10, 16))])

                schedules.append({
                    "schedule_id": f"SCH{schedule_id:06d}",
                    "course_id": course["course_id"],
                    "classroom_id": classroom["classroom_id"],
                    "day_of_week": day_of_week,
                    "period_start": period_start,
                    "period_end": period_end,
                    "weeks": weeks,
                })
                schedule_id += 1

        df = pl.DataFrame(schedules)
        db.insert_dataframe("course_schedule", df)
        logger.info(f"生成 {len(df)} 条排课数据")

    def _generate_evaluations(self):
        students_df = db.query("SELECT * FROM student LIMIT 300")
        courses_df = db.query("SELECT * FROM course")

        evaluations = []
        eval_id = 1

        for course in courses_df.to_dicts():
            num_evals = int(course["student_count"] * random.uniform(0.6, 0.95))
            for i in range(num_evals):
                student_idx = random.randint(0, len(students_df) - 1)
                student = students_df.row(student_idx, named=True)

                score = round(random.uniform(60, 100), 2)
                is_submitted = random.random() < 0.9
                eval_time = datetime.strptime("2025-06-01", "%Y-%m-%d") + timedelta(days=random.randint(1, 30))

                comments = [
                    "老师讲课清晰，内容充实",
                    "课程内容丰富，收获很大",
                    "希望能增加更多实践环节",
                    "教材内容有点难",
                    "讲解清楚，易懂",
                ]
                comment = random.choice(comments) if random.random() < 0.6 else ""

                evaluations.append({
                    "eval_id": f"EVAL{eval_id:06d}",
                    "student_id": student["student_id"],
                    "course_id": course["course_id"],
                    "score": score if is_submitted else None,
                    "comment": comment if is_submitted else None,
                    "eval_time": eval_time if is_submitted else None,
                    "is_submitted": is_submitted,
                })
                eval_id += 1

        df = pl.DataFrame(evaluations)
        db.insert_dataframe("teaching_evaluation", df)
        logger.info(f"生成 {len(df)} 条评教数据")

    def _generate_data_sources(self):
        sources = [
            {"source_id": "teaching_platform", "source_name": "教学平台", "source_type": "api", "connection_info": "http://api.university.edu/teaching", "is_active": True},
            {"source_id": "campus_card", "source_name": "一卡通系统", "source_type": "database", "connection_info": "oracle://card_db", "is_active": True},
            {"source_id": "student_application", "source_name": "学生申请表", "source_type": "excel", "connection_info": "/data/student_apps", "is_active": True},
            {"source_id": "classroom", "source_name": "教室资源系统", "source_type": "api", "connection_info": "http://api.university.edu/classroom", "is_active": True},
            {"source_id": "evaluation", "source_name": "评教系统", "source_type": "database", "connection_info": "mysql://eval_db", "is_active": True},
        ]
        df = pl.DataFrame(sources)
        db.insert_dataframe("data_source", df)
        logger.info(f"生成 {len(df)} 条数据源配置")

    def _generate_data_versions(self):
        versions = []
        version_id = 1
        for source in ["teaching_platform", "campus_card", "student_application"]:
            for v in range(1, random.randint(3, 6)):
                versions.append({
                    "version_id": version_id,
                    "data_source": source,
                    "snapshot_name": f"{source}_v{v}",
                    "snapshot_time": datetime.now() - timedelta(days=v * 7),
                    "description": f"{source} 第{v}次数据快照",
                    "record_count": random.randint(100, 500),
                })
                version_id += 1

        df = pl.DataFrame(versions)
        db.insert_dataframe("data_version", df)
        logger.info(f"生成 {len(df)} 条数据版本记录")


generator = SampleDataGenerator()
