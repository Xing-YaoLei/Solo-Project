"""
快速验证脚本 - 测试新增功能
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.database import init_database
from src.data_processor import (
    get_imaging_ranking,
    get_revisit_risk_overview,
    get_revisit_rate_by_doctor,
    get_system_users
)
from src.minio_client import get_minio_client


def test_new_features():
    print("=" * 60)
    print("新增功能验证")
    print("=" * 60)

    print("\n1. 测试MinIO客户端...")
    minio = get_minio_client()
    print(f"   MinIO可用状态: {minio.available}")

    print("\n2. 测试影像排行 (带MinIO集成)...")
    result = get_imaging_ranking()
    print(f"   数据来源: {result['source']}")
    print(f"   MinIO可用: {result['minio_available']}")
    print(f"   影像类型数: {len(result['data'])}")
    if result['minio_stats']:
        print(f"   MinIO文件数: {result['minio_stats']['total_files']}")
    print(f"   数据列: {result['data'].columns}")

    print("\n3. 测试医生数据过滤 (模拟一线人员)...")
    doctors = ["王医生", "李医生", "张医生"]
    for doctor in doctors:
        df = get_revisit_risk_overview(doctor_filter=doctor)
        print(f"   {doctor} 负责的患者数: {len(df)}")
        if not df.is_empty():
            responsible = df["responsible_doctor"].unique().to_list()
            print(f"     数据中的责任医生: {responsible}")
            assert all(d == doctor for d in responsible), "数据过滤失败！包含了其他医生的数据"

    print("\n4. 测试系统用户...")
    users = get_system_users()
    print(f"   用户总数: {len(users)}")
    management_count = len(users.filter(pl.col("role") == "management"))
    frontline_count = len(users.filter(pl.col("role") == "frontline"))
    print(f"   管理层: {management_count} 人")
    print(f"   一线人员: {frontline_count} 人")

    print("\n5. 验证所有一线人员数据隔离...")
    frontline_users = users.filter(pl.col("role") == "frontline")
    all_ok = True
    for row in frontline_users.iter_rows(named=True):
        doctor_name = row["user_name"]
        df = get_revisit_risk_overview(doctor_filter=doctor_name)
        if not df.is_empty():
            responsible_list = df["responsible_doctor"].unique().to_list()
            for d in responsible_list:
                if d != doctor_name:
                    print(f"   ❌ {doctor_name} 的数据中包含了 {d} 的患者！")
                    all_ok = False
    if all_ok:
        print("   ✓ 所有一线人员数据隔离正常")

    print("\n" + "=" * 60)
    print("✓ 新增功能验证完成！")
    print("=" * 60)

    print("\n功能总结:")
    print("  - 一线人员权限收紧: 只显示'我的复诊明细'")
    print("  - 数据严格过滤: 一线人员只能看到自己负责的患者")
    print(f"  - MinIO集成: {'已连接，影像排行展示真实对象存储数据' if minio.available else '未连接，使用降级数据展示'}")
    print("  - 降级机制: MinIO不可用时自动使用数据库数据")


if __name__ == "__main__":
    import polars as pl
    test_new_features()
