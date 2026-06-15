#!/usr/bin/env python3
"""
同步任务测试脚本
验证 Celery 同步任务的功能：
1. 从 API 拉取数据写入对应表
2. API 失败和校验失败进入 anomaly_data
3. sync_tasks 记录 config_source 和 config_url
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
    validate_employment_record,
    validate_live_record,
    validate_lms_record,
    save_anomaly_data,
)


def test_employment_sync():
    """测试就业数据同步"""
    print("\n" + "=" * 60)
    print("测试 1: 就业数据同步")
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
        {
            "student_id": "STU2024002",
            "external_student_id": "EXT002",
            "company_name": "腾讯",
            "position": "后端开发工程师",
            "salary": 18000,
            "employment_date": "2026-02-01",
            "employment_status": "已入职",
            "is_match_major": True,
        },
        {
            "student_id": "",
            "external_student_id": "",
            "company_name": "测试公司",
            "salary": -1000,
        },
    ]

    with server.app_context():
        result = sync_employment_data(records=test_records)
        print(f"\n同步结果: {json.dumps(result, ensure_ascii=False, indent=2)}")

        sync_batch = result.get("sync_batch")

        sync_task = SyncTask.query.filter_by(sync_batch=sync_batch).first()
        if sync_task:
            print(f"\n✓ SyncTask 记录:")
            print(f"  - config_source: {sync_task.config_source}")
            print(f"  - config_url: {sync_task.config_url}")
            print(f"  - 状态: {sync_task.status}")
            print(f"  - 总记录: {sync_task.total_records}")
            print(f"  - 成功: {sync_task.success_count}")
            print(f"  - 失败: {sync_task.error_count}")

        employments = Employment.query.filter_by(sync_batch=sync_batch).all()
        print(f"\n✓ 写入 employments 表: {len(employments)} 条")
        for emp in employments:
            print(f"  - {emp.student.name}: {emp.company_name} - {emp.position}")

        anomalies = AnomalyData.query.filter_by(sync_batch=sync_batch).all()
        print(f"\n✓ 写入 anomaly_data 表: {len(anomalies)} 条")
        for anom in anomalies:
            print(f"  - {anom.anomaly_type}: {anom.anomaly_description}")

        assert result["success_count"] == 2, f"成功数应为 2, 实际 {result['success_count']}"
        assert result["error_count"] == 1, f"失败数应为 1, 实际 {result['error_count']}"
        assert sync_task.config_source == "EMPLOYMENT_API_URL", "config_source 不正确"
        assert len(employments) == 2, "就业数据写入失败"
        assert len(anomalies) == 1, "异常数据写入失败"

        print("\n✓ 就业数据同步测试通过!")


def test_live_session_sync():
    """测试直播数据同步"""
    print("\n" + "=" * 60)
    print("测试 2: 直播数据同步")
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
        {
            "student_id": "",
            "external_student_id": "",
            "live_room_id": "",
            "duration_minutes": -10,
        },
    ]

    with server.app_context():
        result = sync_live_platform_data(records=test_records)
        print(f"\n同步结果: {json.dumps(result, ensure_ascii=False, indent=2)}")

        sync_batch = result.get("sync_batch")

        sync_task = SyncTask.query.filter_by(sync_batch=sync_batch).first()
        if sync_task:
            print(f"\n✓ SyncTask 记录:")
            print(f"  - config_source: {sync_task.config_source}")
            print(f"  - config_url: {sync_task.config_url}")

        live_sessions = LiveSession.query.filter_by(sync_batch=sync_batch).all()
        print(f"\n✓ 写入 live_sessions 表: {len(live_sessions)} 条")
        for ls in live_sessions:
            print(f"  - {ls.student.name}: {ls.live_title} ({ls.duration_minutes}分钟)")

        anomalies = AnomalyData.query.filter_by(sync_batch=sync_batch).all()
        print(f"\n✓ 写入 anomaly_data 表: {len(anomalies)} 条")
        for anom in anomalies:
            print(f"  - {anom.anomaly_type}: {anom.anomaly_description}")

        assert result["success_count"] == 1, f"成功数应为 1, 实际 {result['success_count']}"
        assert result["error_count"] == 1, f"失败数应为 1, 实际 {result['error_count']}"
        assert sync_task.config_source == "LIVE_API_URL", "config_source 不正确"
        assert len(live_sessions) == 1, "直播数据写入失败"
        assert len(anomalies) == 1, "异常数据写入失败"

        print("\n✓ 直播数据同步测试通过!")


def test_lms_record_sync():
    """测试 LMS 数据同步"""
    print("\n" + "=" * 60)
    print("测试 3: LMS 数据同步")
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
        {
            "student_id": "",
            "external_student_id": "",
            "course_id": None,
            "chapter_id": None,
            "progress_percent": 150,
            "quiz_score": -10,
        },
    ]

    with server.app_context():
        result = sync_lms_data(records=test_records)
        print(f"\n同步结果: {json.dumps(result, ensure_ascii=False, indent=2)}")

        sync_batch = result.get("sync_batch")

        sync_task = SyncTask.query.filter_by(sync_batch=sync_batch).first()
        if sync_task:
            print(f"\n✓ SyncTask 记录:")
            print(f"  - config_source: {sync_task.config_source}")
            print(f"  - config_url: {sync_task.config_url}")

        lms_records = LMSRecord.query.filter_by(sync_batch=sync_batch).all()
        print(f"\n✓ 写入 lms_records 表: {len(lms_records)} 条")
        for lr in lms_records:
            print(f"  - {lr.student.name}: 章节{lr.chapter_id} ({lr.progress_percent}%)")

        anomalies = AnomalyData.query.filter_by(sync_batch=sync_batch).all()
        print(f"\n✓ 写入 anomaly_data 表: {len(anomalies)} 条")
        for anom in anomalies:
            print(f"  - {anom.anomaly_type}: {anom.anomaly_description}")

        assert result["success_count"] == 1, f"成功数应为 1, 实际 {result['success_count']}"
        assert result["error_count"] == 1, f"失败数应为 1, 实际 {result['error_count']}"
        assert sync_task.config_source == "LMS_API_URL", "config_source 不正确"
        assert len(lms_records) == 1, "LMS 数据写入失败"
        assert len(anomalies) == 1, "异常数据写入失败"

        print("\n✓ LMS 数据同步测试通过!")


def test_validation_functions():
    """测试数据校验函数"""
    print("\n" + "=" * 60)
    print("测试 4: 数据校验函数")
    print("=" * 60)

    valid_employment = {
        "student_id": "STU001",
        "employment_date": "2026-01-01",
        "salary": 10000,
    }
    invalid_employment = {
        "student_id": "",
        "employment_date": "",
        "salary": -100,
    }
    errors = validate_employment_record(valid_employment)
    assert len(errors) == 0, f"有效就业数据不应有错误，实际: {errors}"
    print(f"✓ 有效就业数据校验通过: {errors}")

    errors = validate_employment_record(invalid_employment)
    assert len(errors) == 3, f"无效就业数据应有 3 个错误，实际: {len(errors)}"
    print(f"✓ 无效就业数据校验通过: {errors}")

    valid_live = {
        "student_id": "STU001",
        "live_room_id": "ROOM001",
        "join_time": "2026-01-01T10:00:00",
        "leave_time": "2026-01-01T12:00:00",
        "duration_minutes": 120,
    }
    invalid_live = {
        "student_id": "",
        "live_room_id": "",
        "join_time": "2026-01-01T12:00:00",
        "leave_time": "2026-01-01T10:00:00",
        "duration_minutes": -10,
    }
    errors = validate_live_record(valid_live)
    assert len(errors) == 0, f"有效直播数据不应有错误，实际: {errors}"
    print(f"✓ 有效直播数据校验通过: {errors}")

    errors = validate_live_record(invalid_live)
    assert len(errors) == 4, f"无效直播数据应有 4 个错误，实际: {len(errors)}"
    print(f"✓ 无效直播数据校验通过: {errors}")

    valid_lms = {
        "student_id": "STU001",
        "course_id": 1,
        "chapter_id": 1,
        "progress_percent": 80,
        "quiz_score": 90,
    }
    invalid_lms = {
        "student_id": "",
        "course_id": None,
        "chapter_id": None,
        "progress_percent": 150,
        "quiz_score": -10,
    }
    errors = validate_lms_record(valid_lms)
    assert len(errors) == 0, f"有效 LMS 数据不应有错误，实际: {errors}"
    print(f"✓ 有效 LMS 数据校验通过: {errors}")

    errors = validate_lms_record(invalid_lms)
    assert len(errors) == 4, f"无效 LMS 数据应有 4 个错误，实际: {len(errors)}"
    print(f"✓ 无效 LMS 数据校验通过: {errors}")

    print("\n✓ 数据校验函数测试通过!")


def test_save_anomaly_data():
    """测试异常数据保存"""
    print("\n" + "=" * 60)
    print("测试 5: 异常数据保存")
    print("=" * 60)

    with server.app_context():
        test_data = {
            "test_field": "test_value",
            "error": "test error",
        }

        save_anomaly_data(
            data_source="test_source",
            sync_batch="TEST_BATCH_001",
            raw_data=test_data,
            anomaly_type="测试异常",
            anomaly_description="这是一个测试异常",
            error_message="测试错误信息",
            record_id_external="TEST001",
        )
        db.session.commit()

        anomaly = AnomalyData.query.filter_by(
            sync_batch="TEST_BATCH_001",
            record_id_external="TEST001"
        ).first()

        assert anomaly is not None, "异常数据未保存"
        assert anomaly.data_source == "test_source", "data_source 不正确"
        assert anomaly.anomaly_type == "测试异常", "anomaly_type 不正确"
        assert "test_value" in anomaly.raw_data, "raw_data 不正确"

        print(f"✓ 异常数据保存成功:")
        print(f"  - data_source: {anomaly.data_source}")
        print(f"  - anomaly_type: {anomaly.anomaly_type}")
        print(f"  - raw_data: {anomaly.raw_data}")

        print("\n✓ 异常数据保存测试通过!")


def run_all_tests():
    """运行所有测试"""
    print("=" * 60)
    print("同步任务综合测试")
    print("=" * 60)

    try:
        test_validation_functions()
        test_save_anomaly_data()
        test_employment_sync()
        test_live_session_sync()
        test_lms_record_sync()

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
            print(f"  - students: {Student.query.count()} 条")

    except AssertionError as e:
        print(f"\n✗ 测试失败: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ 测试异常: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    run_all_tests()
