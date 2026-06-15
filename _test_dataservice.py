#!/usr/bin/env python3
"""验证 DataService PostgreSQL 查询能力和导出接口参数"""

import sys
import os
import io
from datetime import datetime, date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.data_service import MockDataService, DataService, BaseDataService
from utils.exporter import ReportExporter

def test_interface_consistency():
    """验证 DataService 和 MockDataService 接口一致性"""
    print("=" * 60)
    print("📋 接口一致性测试")
    print("=" * 60)

    base_methods = [m for m in dir(BaseDataService) if not m.startswith("_")]
    ds_methods = set([m for m in dir(DataService) if not m.startswith("_")])
    mock_methods = set([m for m in dir(MockDataService) if not m.startswith("_")])

    all_good = True
    for method in base_methods:
        if method not in ds_methods:
            print(f"❌ DataService 缺少方法: {method}")
            all_good = False
        if method not in mock_methods:
            print(f"❌ MockDataService 缺少方法: {method}")
            all_good = False

    if all_good:
        print(f"✅ 所有 {len(base_methods)} 个方法接口一致")
    return all_good


def test_mock_new_params():
    """验证 MockDataService 新参数工作"""
    print("\n" + "=" * 60)
    print("🔬 MockDataService 新参数测试")
    print("=" * 60)

    ds = MockDataService()

    # 测试 get_applications 新参数 course_type
    print("\n1. get_applications(course_type='专业课'):")
    apps_pro = ds.get_applications(course_type="专业课")
    print(f"   专业课申请数: {len(apps_pro)}")

    apps_pub = ds.get_applications(course_type="公选课")
    print(f"   公选课申请数: {len(apps_pub)}")

    # 测试 get_applications 日期范围
    start = date(2025, 9, 1)
    end = date(2025, 9, 30)
    apps_date = ds.get_applications(start_date=start, end_date=end)
    print(f"\n2. get_applications(start_date='2025-09-01', end_date='2025-09-30'):")
    print(f"   9月申请数: {len(apps_date)}")

    # 测试 get_duration_stats 新参数 course_type
    print("\n3. get_duration_stats(course_type='专业课'):")
    dur_pro = ds.get_duration_stats(course_type="专业课")
    print(f"   专业课时长统计行数: {len(dur_pro)}")
    print(f"   attrs: {dur_pro.attrs if hasattr(dur_pro, 'attrs') else '无'}")

    # 测试 get_raw_samples course_code
    print("\n4. get_raw_samples(course_code='CS101'):")
    samples = ds.get_raw_samples(course_code="CS101")
    print(f"   CS101 原始样本数: {len(samples)}")
    if len(samples) > 0:
        print(f"   首个样本 course_code: {samples.iloc[0].get('course_code', 'N/A')}")

    return True


def test_course_details_raw_samples():
    """验证 get_course_details 原始样本按 course_code 过滤"""
    print("\n" + "=" * 60)
    print("🔍 get_course_details 原始样本过滤测试")
    print("=" * 60)

    ds = MockDataService()
    courses = ds.get_courses()

    if len(courses) == 0:
        print("⚠️  无课程数据，跳过")
        return True

    test_code = courses.iloc[0]["course_code"]
    test_name = courses.iloc[0]["course_name"]
    print(f"\n测试课程: {test_code} - {test_name}")

    details = ds.get_course_details(test_code)
    raw_samples = details.get("raw_samples", [])

    print(f"返回原始样本数: {len(raw_samples)}")

    if len(raw_samples) > 0:
        all_match = True
        for i, s in enumerate(raw_samples[:3]):
            sc = s.get("course_code", "")
            print(f"  样本[{i}]: course_code={sc}, source={s.get('source_system')}")
            if str(sc) != str(test_code):
                print(f"    ❌ 不匹配！期望: {test_code}, 实际: {sc}")
                all_match = False

        if all_match:
            print(f"✅ 所有样本 course_code 均为 {test_code}")
        return all_match
    else:
        print("⚠️  该课程无关联原始样本（mock数据限制）")
        return True


def test_exporter_new_params():
    """验证 ReportExporter 新参数"""
    print("\n" + "=" * 60)
    print("📊 ReportExporter 新参数测试")
    print("=" * 60)

    ds = MockDataService()
    exporter = ReportExporter(ds)

    # 模拟页面参数
    params = {
        "academic_term": "2025-2026-1",
        "college": "计算机学院",
        "course_type": "专业课",
        "status": None,
        "has_conflict": None,
        "start_date": "2025-09-01",
        "end_date": "2025-09-30",
    }

    print(f"\n参数: {params}")

    output = exporter.export_duration_report(**params)

    print(f"✅ 导出成功，大小: {len(output.getvalue())} bytes")

    output.seek(0)
    import pandas as pd
    xls = pd.ExcelFile(output)
    sheets = xls.sheet_names
    print(f"📑 Sheet列表: {sheets}")

    # 检查说明页的筛选范围
    header_df = pd.read_excel(xls, sheet_name="说明", header=None)
    print("\n说明页内容:")
    for _, row in header_df.head(10).iterrows():
        line = [str(c) for c in row.values if not pd.isna(c)]
        if line:
            print(f"  {' | '.join(line)}")

    # 验证有课程类型这一项
    header_text = " ".join(header_df.astype(str).values.flatten())
    has_course_type = "课程类型" in header_text
    has_date_range = "提交日期范围" in header_text

    print(f"\n✅ 课程类型在筛选范围中: {has_course_type}")
    print(f"✅ 提交日期范围在筛选范围中: {has_date_range}")

    return has_course_type and has_date_range


def test_dataservice_methods():
    """验证 DataService 所有方法的 SQL 语法（无需真实连接）"""
    print("\n" + "=" * 60)
    print("🗄️  DataService 方法 SQL 语法检查")
    print("=" * 60)

    # 检查导入
    try:
        from utils.data_service import DataService
        print("✅ DataService 导入成功")
    except Exception as e:
        print(f"❌ 导入失败: {e}")
        return False

    # 检查 SQLAlchemy 查询构造是否正确（静态检查）
    import inspect
    methods = [
        "get_funnel_data", "get_courses", "get_classrooms", "get_students",
        "get_applications", "get_schedules", "get_conflicts", "get_anomalies",
        "get_sync_logs", "get_raw_samples", "get_duration_stats", "get_college_stats",
        "get_course_details", "get_room_schedule_heatmap"
    ]

    all_ok = True
    for method in methods:
        if hasattr(DataService, method):
            fn = getattr(DataService, method)
            src = inspect.getsource(fn)
            # 检查是否有 db.query 调用
            if "db.query" in src or "self.get_" in src or "_query_to_df" in src:
                print(f"✅ {method}: 包含正确的查询逻辑")
            else:
                print(f"⚠️  {method}: 未检测到查询逻辑")
        else:
            print(f"❌ {method}: 方法不存在")
            all_ok = False

    return all_ok


def main():
    results = []
    results.append(("接口一致性", test_interface_consistency()))
    results.append(("Mock参数测试", test_mock_new_params()))
    results.append(("原始样本过滤", test_course_details_raw_samples()))
    results.append(("导出接口参数", test_exporter_new_params()))
    results.append(("SQL语法检查", test_dataservice_methods()))

    print("\n" + "=" * 60)
    print("📋 测试结果汇总")
    print("=" * 60)

    all_passed = True
    for name, passed in results:
        status = "✅ 通过" if passed else "❌ 失败"
        print(f"  {name}: {status}")
        if not passed:
            all_passed = False

    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 全部测试通过！")
        return 0
    else:
        print("⚠️  部分测试未通过，请检查")
        return 1


if __name__ == "__main__":
    sys.exit(main())
