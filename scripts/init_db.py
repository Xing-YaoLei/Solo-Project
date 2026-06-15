#!/usr/bin/env python3
"""
数据库初始化脚本
用法: python scripts/init_db.py
"""

import os
import sys
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
    ReminderRule,
    AnomalyData,
    Note,
    SyncTask,
)


def init_database():
    print("=" * 60)
    print("职业教育在线课程漏斗报表 - 数据库初始化")
    print("=" * 60)

    with server.app_context():
        print("\n1. 删除所有现有表...")
        db.drop_all()
        print("   ✓ 表已删除")

        print("\n2. 创建所有表...")
        db.create_all()
        print("   ✓ 表已创建")

        print("\n3. 初始化提醒规则...")
        reminder_rules = [
            ReminderRule(
                rule_name="完成率过低预警",
                rule_type="completion_warning",
                threshold_type="completion_rate",
                threshold_value=30,
                comparison="lt",
                time_window_days=7,
                reminder_message="该学生课程完成率低于30%，请及时跟进了解学习困难",
                priority=1,
            ),
            ReminderRule(
                rule_name="进度落后预警",
                rule_type="progress_warning",
                threshold_type="completion_rate",
                threshold_value=60,
                comparison="lt",
                time_window_days=14,
                reminder_message="该学生学习进度落后于预期计划的60%",
                priority=2,
            ),
            ReminderRule(
                rule_name="成绩不合格预警",
                rule_type="score_warning",
                threshold_type="total_score",
                threshold_value=60,
                comparison="lt",
                time_window_days=30,
                reminder_message="该学生成绩未达到合格标准，需要进行辅导",
                priority=1,
            ),
            ReminderRule(
                rule_name="高完成率表扬",
                rule_type="achievement",
                threshold_type="completion_rate",
                threshold_value=90,
                comparison="gte",
                time_window_days=7,
                reminder_message="该学生学习进度良好，完成率超过90%，请给予鼓励",
                priority=3,
            ),
        ]
        db.session.add_all(reminder_rules)
        db.session.commit()
        print(f"   ✓ 已初始化 {len(reminder_rules)} 条提醒规则")

        print("\n" + "=" * 60)
        print("数据库初始化完成！")
        print("=" * 60)


if __name__ == "__main__":
    init_database()
