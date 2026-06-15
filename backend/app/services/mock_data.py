import duckdb
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
from ..core.config import get_settings

settings = get_settings()


def init_mock_data():
    os.makedirs(os.path.dirname(settings.DUCKDB_PATH), exist_ok=True)
    con = duckdb.connect(settings.DUCKDB_PATH)

    _create_tag_trend_table(con)
    _create_progress_composition_table(con)
    _create_grade_feedback_table(con)
    _create_anomaly_alerts_table(con)
    _create_chapter_rank_table(con)

    con.close()


def _create_tag_trend_table(con):
    tags = ["Java基础", "Python编程", "数据结构", "算法", "数据库", "网络安全", "前端开发", "操作系统"]
    days = 30
    dates = [(datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days - 1, -1, -1)]

    data = []
    for date in dates:
        for tag in tags:
            base_count = np.random.randint(50, 200)
            trend_factor = 1 + 0.02 * (days - dates.index(date) - 15) / 15
            count = int(base_count * trend_factor * np.random.uniform(0.8, 1.2))
            data.append({"date": date, "tag": tag, "count": count})

    df = pd.DataFrame(data)
    con.execute("DROP TABLE IF EXISTS tag_trend")
    con.execute("CREATE TABLE tag_trend AS SELECT * FROM df")


def _create_progress_composition_table(con):
    categories = ["已完成", "进行中", "未开始", "已逾期", "已放弃"]
    values = [45, 25, 15, 10, 5]
    counts = [1350, 750, 450, 300, 150]

    data = [{"category": c, "value": v, "count": cnt} for c, v, cnt in zip(categories, values, counts)]
    df = pd.DataFrame(data)
    con.execute("DROP TABLE IF EXISTS progress_composition")
    con.execute("CREATE TABLE progress_composition AS SELECT * FROM df")


def _create_grade_feedback_table(con):
    first_names = ["张", "李", "王", "刘", "陈", "杨", "赵", "黄", "周", "吴", "徐", "孙", "马", "朱", "胡"]
    last_names = ["伟", "芳", "娜", "敏", "静", "强", "磊", "洋", "艳", "勇", "军", "杰", "娟", "涛", "明"]

    courses = ["Java高级开发", "Python数据分析", "Web前端工程", "数据库系统原理", "计算机网络"]
    chapters = ["第一章 基础入门", "第二章 核心概念", "第三章 进阶技巧", "第四章 实战演练", "第五章 综合测试"]

    data = []
    for i in range(200):
        student_id = f"S{2024001 + i}"
        student_name = np.random.choice(first_names) + np.random.choice(last_names)
        course = np.random.choice(courses)
        chapter = np.random.choice(chapters)
        total_questions = np.random.randint(20, 50)
        correct_count = np.random.randint(5, total_questions)
        score = round(correct_count / total_questions * 100, 1)
        time_spent = np.random.randint(600, 3600)
        submit_time = datetime.now() - timedelta(
            days=np.random.randint(0, 30),
            hours=np.random.randint(0, 24),
            minutes=np.random.randint(0, 60)
        )

        data.append({
            "student_id": student_id,
            "student_name": student_name,
            "course": course,
            "chapter": chapter,
            "score": score,
            "total_questions": total_questions,
            "correct_count": correct_count,
            "time_spent": time_spent,
            "submit_time": submit_time
        })

    df = pd.DataFrame(data)
    con.execute("DROP TABLE IF EXISTS grade_feedback")
    con.execute("CREATE TABLE grade_feedback AS SELECT * FROM df")


def _create_anomaly_alerts_table(con):
    rule_names = [
        "连续3次成绩低于60分",
        "学习进度落后超过50%",
        "答题时间异常短",
        "正确率骤降超过30%",
        "逾期未完成作业",
        "高频错题未复习"
    ]
    rule_types = ["成绩预警", "进度预警", "行为预警", "趋势预警", "时间预警", "学习策略"]
    severities = ["高", "中", "低"]

    first_names = ["张", "李", "王", "刘", "陈", "杨", "赵", "黄", "周", "吴"]
    last_names = ["伟", "芳", "娜", "敏", "静", "强", "磊", "洋", "艳", "勇"]

    courses = ["Java高级开发", "Python数据分析", "Web前端工程", "数据库系统原理"]

    data = []
    for i in range(50):
        idx = np.random.randint(0, len(rule_names))
        student_name = np.random.choice(first_names) + np.random.choice(last_names)
        detected_at = datetime.now() - timedelta(
            days=np.random.randint(0, 15),
            hours=np.random.randint(0, 24)
        )
        severity = np.random.choice(severities, p=[0.2, 0.5, 0.3])

        data.append({
            "id": i + 1,
            "rule_name": rule_names[idx],
            "rule_type": rule_types[idx],
            "student_id": f"S{2024001 + np.random.randint(0, 200)}",
            "student_name": student_name,
            "course": np.random.choice(courses),
            "description": f"{student_name}触发了「{rule_names[idx]}」规则，请及时关注。",
            "severity": severity,
            "detected_at": detected_at,
            "is_resolved": np.random.choice([True, False], p=[0.3, 0.7])
        })

    df = pd.DataFrame(data)
    con.execute("DROP TABLE IF EXISTS anomaly_alerts")
    con.execute("CREATE TABLE anomaly_alerts AS SELECT * FROM df")


def _create_chapter_rank_table(con):
    courses = [
        ("CS001", "Java高级开发"),
        ("CS002", "Python数据分析"),
        ("CS003", "Web前端工程"),
        ("CS004", "数据库系统原理"),
        ("CS005", "计算机网络基础")
    ]

    chapters = [
        "第一章 基础入门",
        "第二章 核心概念",
        "第三章 进阶技巧",
        "第四章 实战演练",
        "第五章 综合测试"
    ]

    data = []
    chapter_id = 1
    for course_id, course_name in courses:
        for i, chapter in enumerate(chapters):
            total_students = np.random.randint(200, 500)
            completed_students = int(total_students * np.random.uniform(0.3, 0.9))
            completion_rate = round(completed_students / total_students * 100, 2)
            avg_score = round(np.random.uniform(60, 90), 1)

            data.append({
                "chapter_id": f"{course_id}-{i + 1}",
                "chapter_name": chapter,
                "course": course_name,
                "total_students": total_students,
                "completed_students": completed_students,
                "completion_rate": completion_rate,
                "avg_score": avg_score
            })
            chapter_id += 1

    df = pd.DataFrame(data)
    con.execute("DROP TABLE IF EXISTS chapter_rank")
    con.execute("CREATE TABLE chapter_rank AS SELECT * FROM df")


def get_refresh_time(con: duckdb.DuckDBPyConnection, table_name: str) -> datetime:
    try:
        result = con.execute(f"SELECT MAX(submit_time) as last_time FROM {table_name}").fetchone()
        if result and result[0]:
            return result[0]
    except:
        pass
    return datetime.now()
