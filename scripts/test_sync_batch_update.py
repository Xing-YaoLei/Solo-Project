#!/usr/bin/env python3
"""
同步任务测试脚本 - 重点测试 sync_batch 覆盖更新
验证重复执行同步时，当前批次真正反映写入结果
"""

import os
import sys
import json
from dotenv import load_dotenv

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(PROJECT_ROOT)
sys.path.insert(0, PROJECT_ROOT)

load_dotenv()

from app import db, server
from app.models import (
    SyncTask, Employment, LiveSession, LMSRecord, AnomalyData, Student
)
from app.sync.tasks import (
    sync_employment_data,
    sync_live_platform_data,
    sync_lms_data,
)


def test_employment_sync_batch_update():
    """测试就业数据同步 - 重复执行时 sync_batch 正确更新"""
    print("\n" + "=" * 60)
    print("测试 1: 就业数据同步 - sync_batch 覆盖更新")
    print("=" * 60)

    test_records = [
        {
            "student_id": "STU2024001",
            "external_student_id": "EXT001",
            "company_name": "阿里巴巴",
            "position": "前端开发工程师",
            "salary": 15000,
            "employment_date": "2026-01-15",
            "employment_status": "已入职",
            "is_match_major": True,
        },
    ]

    with server.app_context():
        print("\n>>> 第一次同步...")
        result1 = sync_employment_data(records=test_records)
        batch1 = result1.get("sync_batch")
        print(f"批次 1: {batch1}")
        print(f"结果: {json.dumps(result1, ensure_ascii=False, indent=2)}")

        emp1 = Employment.query.filter_by(sync_batch=batch1).all()
        print(f"\n批次 1 查询到 {len(emp1)} 条就业记录")
        for e in emp1:
            print(f"  - {e.student.name}: {e.company_name}, sync_batch={e.sync_batch}")

        assert len(emp1) == 1, "第一次同步应该有 1 条就业记录"
        assert emp1[0].sync_batch == batch1, "sync_batch 应该等于 batch1"

        print("\n>>> 第二次同步（相同数据）...")
        result2 = sync_employment_data(records=test_records)
        batch2 = result2.get("sync_batch")
        print(f"批次 2: {batch2}")
        print(f"结果: {json.dumps(result2, ensure_ascii=False, indent=2)}")

        assert batch1 != batch2, "两次同步的 sync_batch 应该不同"

        emp2_new = Employment.query.filter_by(sync_batch=batch2).all()
        print(f"\n批次 2 查询到 {len(emp2_new)} 条就业记录")
        for e in emp2_new:
            print(f"  - {e.student.name}: {e.company_name}, sync_batch={e.sync_batch}")

        emp1_old = Employment.query.filter_by(sync_batch=batch1).all()
        print(f"批次 1 现在查询到 {len(emp1_old)} 条就业记录")

        assert len(emp2_new) == 1, "第二次同步后应该能通过 batch2 查询到 1 条就业记录"
        assert len(emp1_old) == 0, "第二次同步后 batch1 应该没有就业记录（已被覆盖）"
        assert emp2_new[0].sync_batch == batch2, "sync_batch 应该更新为 batch2"

        print(f"\n✓ 就业数据 sync_batch 覆盖更新验证通过!")
        print(f"  - 批次1: {batch1} -> 现在无记录")
        print(f"  - 批次2: {batch2} -> 有 {len(emp2_new)} 条记录")

        sync_task2 = SyncTask.query.filter_by(sync_batch=batch2).first()
        if sync_task2:
            print(f"\n✓ SyncTask 记录:")
            print(f"  - config_source: {sync_task2.config_source}")
            print(f"  - config_url: {sync_task2.config_url}")
            print(f"  - success_count: {sync_task2.success_count}")


def test_live_session_sync_batch_update():
    """测试直播数据同步 - 重复执行时 sync_batch 正确更新"""
    print("\n" + "=" * 60)
    print("测试 2: 直播数据同步 - sync_batch 覆盖更新")
    print("=" * 60)

    test_records = [
        {
            "student_id": "STU2024001",
            "external_student_id": "EXT001",
            "live_room_id": "LIVE001",
            "live_title": "Web前端开发实战",
            "course_related": "Web前端开发",
            "join_time": "2026-03-01T19:00:00",
            "leave_time": "2026-03-01T21:00:00",
            "duration_minutes": 120,
            "is_online": True,
            "interaction_count": 15,
        },
    ]

    with server.app_context():
        print("\n>>> 第一次同步...")
        result1 = sync_live_platform_data(records=test_records)
        batch1 = result1.get("sync_batch")
        print(f"批次 1: {batch1}")

        live1 = LiveSession.query.filter_by(sync_batch=batch1).all()
        print(f"批次 1 查询到 {len(live1)} 条直播记录")
        assert len(live1) == 1, "第一次同步应该有 1 条直播记录"

        print("\n>>> 第二次同步（相同数据）...")
        result2 = sync_live_platform_data(records=test_records)
        batch2 = result2.get("sync_batch")
        print(f"批次 2: {batch2}")

        assert batch1 != batch2, "两次同步的 sync_batch 应该不同"

        live2_new = LiveSession.query.filter_by(sync_batch=batch2).all()
        print(f"批次 2 查询到 {len(live2_new)} 条直播记录")
        assert len(live2_new) == 1, "第二次同步后应该能通过 batch2 查询到 1 条直播记录"

        live1_old = LiveSession.query.filter_by(sync_batch=batch1).all()
        print(f"批次 1 现在查询到 {len(live1_old)} 条直播记录")
        assert len(live1_old) == 0, "第二次同步后 batch1 应该没有直播记录（已被覆盖）"

        print(f"\n✓ 直播数据 sync_batch 覆盖更新验证通过!")


def test_lms_record_sync_batch_update():
    """测试 LMS 数据同步 - 重复执行时 sync_batch 正确更新"""
    print("\n" + "=" * 60)
    print("测试 3: LMS 数据同步 - sync_batch 覆盖更新")
    print("=" * 60)

    test_records = [
        {
            "student_id": "STU2024001",
            "external_student_id": "EXT001",
            "course_id": 1,
            "chapter_id": 1,
            "first_access_time": "2026-03-01T10:00:00",
            "last_access_time": "2026-03-05T15:30:00",
            "study_duration_minutes": 180,
            "completion_status": "completed",
            "quiz_score": 85.5,
            "progress_percent": 100,
        },
    ]

    with server.app_context():
        print("\n>>> 第一次同步...")
        result1 = sync_lms_data(records=test_records)
        batch1 = result1.get("sync_batch")
        print(f"批次 1: {batch1}")

        lms1 = LMSRecord.query.filter_by(sync_batch=batch1).all()
        print(f"批次 1 查询到 {len(lms1)} 条 LMS 记录")
        assert len(lms1) == 1, "第一次同步应该有 1 条 LMS 记录"

        print("\n>>> 第二次同步（相同数据）...")
        result2 = sync_lms_data(records=test_records)
        batch2 = result2.get("sync_batch")
        print(f"批次 2: {batch2}")

        assert batch1 != batch2, "两次同步的 sync_batch 应该不同"

        lms2_new = LMSRecord.query.filter_by(sync_batch=batch2).all()
        print(f"批次 2 查询到 {len(lms2_new)} 条 LMS 记录")
        assert len(lms2_new) == 1, "第二次同步后应该能通过 batch2 查询到 1 条 LMS 记录"

        lms1_old = LMSRecord.query.filter_by(sync_batch=batch1).all()
        print(f"批次 1 现在查询到 {len(lms1_old)} 条 LMS 记录")
        assert len(lms1_old) == 0, "第二次同步后 batch1 应该没有 LMS 记录（已被覆盖）"

        print(f"\n✓ LMS 数据 sync_batch 覆盖更新验证通过!")


def test_sync_task_config_source():
    """测试 SyncTask 记录 config_source 和 config_url"""
    print("\n" + "=" * 60)
    print("测试 4: SyncTask 配置来源记录")
    print("=" * 60)

    test_records = [
        {
            "student_id": "STU2024001",
            "external_student_id": "EXT001",
            "company_name": "字节跳动",
            "position": "全栈开发工程师",
            "salary": 20000,
            "employment_date": "2026-02-01",
            "employment_status": "已入职",
            "is_match_major": True,
        },
    ]

    with server.app_context():
        result = sync_employment_data(records=test_records)
        batch = result.get("sync_batch")

        sync_task = SyncTask.query.filter_by(sync_batch=batch).first()
        assert sync_task is not None, "SyncTask 记录应该存在"
        assert sync_task.config_source == "EMPLOYMENT_API_URL", "config_source 不正确"
        assert sync_task.config_url is not None, "config_url 不应该为空"

        print(f"\n✓ SyncTask 配置来源记录验证通过!")
        print(f"  - sync_batch: {batch}")
        print(f"  - config_source: {sync_task.config_source}")
        print(f"  - config_url: {sync_task.config_url}")
        print(f"  - success_count: {sync_task.success_count}")
        print(f"  - error_count: {sync_task.error_count}")


def test_anomaly_data_preservation():
    """测试异常数据保留"""
    print("\n" + "=" * 60)
    print("测试 5: 异常数据保留")
    print("=" * 60)

    test_records = [
        {
            "student_id": "",
            "external_student_id": "",
            "company_name": "测试公司",
            "salary": -1000,
        },
    ]

    with server.app_context():
        result = sync_employment_data(records=test_records)
        batch = result.get("sync_batch")

        assert result["success_count"] == 0, "成功数应为 0"
        assert result["error_count"] == 1, "失败数应为 1"

        anomalies = AnomalyData.query.filter_by(sync_batch=batch).all()
        print(f"\n✓ 异常数据保留验证通过!")
        print(f"  - batch: {batch}")
        print(f"  - anomaly_count: {len(anomalies)}")
        for a in anomalies:
            print(f"  - type: {a.anomaly_type}")
            print(f"  - desc: {a.anomaly_description}")

        assert len(anomalies) == 1, "应该有 1 条异常记录"
        assert anomalies[0].anomaly_type == "数据验证失败", "异常类型不正确"


def run_all_tests():
    """运行所有测试"""
    print("=" * 60)
    print("同步任务 sync_batch 覆盖更新测试")
    print("=" * 60)

    try:
        test_sync_task_config_source()
        test_anomaly_data_preservation()
        test_employment_sync_batch_update()
        test_live_session_sync_batch_update()
        test_lms_record_sync_batch_update()

        print("\n" + "=" * 60)
        print("✓ 所有测试通过!")
        print("=" * 60)

        with server.app_context():
            print("\n数据库统计:")
            print(f"  - sync_tasks: {SyncTask.query.count()} 条")
            print(f"  - employments: {Employment.query.count()} 条")
            print(f"  - live_sessions: {LiveSession.query.count()} 条")
            print(f"  - lms_records: {LMSRecord.query.count()} 条")
            print(f"  - anomaly_data: {AnomalyData.query.count()} 条")

    except AssertionError as e:
        print(f"\n✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ 测试异常: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    run_all_tests()
