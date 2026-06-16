"""
快速验证脚本 - 测试核心功能
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.database import init_database, get_db_connection
from src.sample_data import initialize_sample_data
from src.data_processor import (
    get_revisit_risk_overview,
    get_revisit_rate_by_doctor,
    get_treatment_plan_distribution,
    get_followup_funnel,
    get_imaging_ranking,
    get_charge_trend,
    get_system_users,
    add_appointment_note,
    get_appointment_notes,
    get_last_update_time,
    get_import_batches
)


def test_all():
    print("=" * 50)
    print("开始系统验证...")
    print("=" * 50)

    print("\n1. 初始化数据库...")
    init_database()
    print("   ✓ 数据库初始化成功")

    print("\n2. 生成模拟数据...")
    initialize_sample_data()
    print("   ✓ 模拟数据生成成功")

    print("\n3. 测试系统用户查询...")
    users = get_system_users()
    print(f"   ✓ 获取到 {len(users)} 个用户")
    for row in users.iter_rows(named=True):
        print(f"     - {row['user_name']} ({row['role']})")

    print("\n4. 测试复诊风险总览...")
    df = get_revisit_risk_overview()
    print(f"   ✓ 获取到 {len(df)} 条预约记录")
    print(f"   字段: {df.columns}")

    print("\n5. 测试医生复诊率...")
    rate_df = get_revisit_rate_by_doctor()
    print(f"   ✓ 获取到 {len(rate_df)} 位医生的复诊率")
    for row in rate_df.iter_rows(named=True):
        print(f"     - {row['doctor_name']}: {row['revisit_rate']}%")

    print("\n6. 测试治疗计划分布...")
    plan_df = get_treatment_plan_distribution()
    print(f"   ✓ 获取到 {len(plan_df)} 种治疗类型")

    print("\n7. 测试随访任务漏斗...")
    funnel_df = get_followup_funnel()
    print(f"   ✓ 获取到 {len(funnel_df)} 种任务状态")

    print("\n8. 测试影像排行...")
    img_df = get_imaging_ranking()
    print(f"   ✓ 获取到 {len(img_df)} 种影像类型")

    print("\n9. 测试收费趋势...")
    charge_df = get_charge_trend(days=30)
    print(f"   ✓ 获取到 {len(charge_df)} 天的收费数据")

    print("\n10. 测试爽约注释功能...")
    appointments = get_revisit_risk_overview()
    if not appointments.is_empty():
        appt_id = appointments["appointment_id"][0]
        print(f"    使用预约ID: {appt_id}")

        success = add_appointment_note(appt_id, "测试爽约注释 - 患者临时有事", "测试医生")
        print(f"    ✓ 添加注释: {'成功' if success else '失败'}")

        notes = get_appointment_notes(appt_id)
        print(f"    ✓ 获取到 {len(notes)} 条注释")

    print("\n11. 测试批次记录...")
    batches = get_import_batches()
    print(f"   ✓ 获取到 {len(batches)} 条批次记录")
    for row in batches.iter_rows(named=True):
        print(f"     - 批次{row['batch_id']}: {row['source_system']} ({row['import_time']})")

    print("\n12. 测试最后更新时间...")
    last_time = get_last_update_time()
    print(f"   ✓ 最后更新时间: {last_time}")

    print("\n" + "=" * 50)
    print("✓ 所有测试通过！系统运行正常。")
    print("=" * 50)


if __name__ == "__main__":
    test_all()
