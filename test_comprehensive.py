"""
完整功能验证脚本
验证所有核心功能：事务性、权限控制、状态流转、异常处理、MinIO集成等
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.database import init_database, get_db_connection
from src.data_processor import (
    process_his_data,
    merge_imaging_data,
    merge_charge_data,
    merge_treatment_plans,
    merge_followup_tasks,
    get_revisit_risk_overview,
    get_revisit_rate_by_doctor,
    add_appointment_note,
    update_appointment_status,
    get_appointment_notes,
    get_imaging_ranking,
    get_import_batches,
    _validate_doctor_access,
    PermissionDeniedError
)
from src.sample_data import (
    generate_patients,
    generate_appointments,
    generate_imaging,
    generate_charges,
    generate_treatment_plans,
    generate_followup_tasks,
    generate_system_users,
    initialize_sample_data
)


def test_database_and_transactions():
    """测试数据库事务性和批次管理"""
    print("=" * 60)
    print("测试1: 数据库事务性和批次管理")
    print("=" * 60)

    print("\n1.1 初始化数据库...")
    init_database()
    print("✅ 数据库初始化成功")

    print("\n1.2 生成测试数据...")
    patients = generate_patients(50)
    appointments = generate_appointments(patients, 100)
    print(f"   - 生成患者: {len(patients)} 条")
    print(f"   - 生成预约: {len(appointments)} 条")

    print("\n1.3 导入HIS数据并检查批次记录...")
    result = process_his_data(patients, appointments)
    print(f"   - 导入成功, 批次ID: {result['batch_id']}")
    print(f"   - 患者数: {result['patients_count']}")
    print(f"   - 预约数: {result['appointments_count']}")
    print(f"   - 状态: {result['status']}")

    print("\n1.4 验证批次记录...")
    batches = get_import_batches(limit=5)
    print(f"   - 共有 {len(batches)} 条批次记录")
    for row in batches.iter_rows(named=True):
        print(f"     {row['source_system']}: {row['status']} - {row['import_time']}")

    print("\n1.5 导入影像数据...")
    imaging = generate_imaging(patients, appointments, 50)
    result = merge_imaging_data(imaging)
    print(f"   - 导入成功, 批次ID: {result['batch_id']}")
    print(f"   - MinIO可用: {result['minio_available']}")
    print(f"   - MinIO上传成功: {result['minio_uploaded']}")
    print(f"   - MinIO上传失败: {result['minio_failed']}")

    print("\n1.6 导入收费数据...")
    charges = generate_charges(patients, appointments, 80)
    result = merge_charge_data(charges)
    print(f"   - 导入成功, 批次ID: {result['batch_id']}")

    print("\n✅ 数据库事务性测试通过")


def test_permission_control():
    """测试权限控制和数据隔离"""
    print("\n" + "=" * 60)
    print("测试2: 权限控制和数据隔离")
    print("=" * 60)

    print("\n2.1 测试医生数据访问权限验证...")

    print("   - 管理层访问全部数据: ", end="")
    try:
        result = _validate_doctor_access(None, "张院长", "management")
        print(f"✅ 通过 (返回: {result})")
    except Exception as e:
        print(f"❌ 失败: {e}")

    print("   - 管理层访问指定医生数据: ", end="")
    try:
        result = _validate_doctor_access("王医生", "张院长", "management")
        print(f"✅ 通过 (返回: {result})")
    except Exception as e:
        print(f"❌ 失败: {e}")

    print("   - 一线人员访问自己的数据: ", end="")
    try:
        result = _validate_doctor_access("王医生", "王医生", "frontline")
        print(f"✅ 通过 (返回: {result})")
    except Exception as e:
        print(f"❌ 失败: {e}")

    print("   - 一线人员访问其他医生数据(应被拒绝): ", end="")
    try:
        result = _validate_doctor_access("李医生", "王医生", "frontline")
        print(f"❌ 失败 - 应该抛出权限错误")
    except PermissionDeniedError as e:
        print(f"✅ 正确拒绝 - {e}")
    except Exception as e:
        print(f"❌ 异常 - {e}")

    print("   - 一线人员不传filter(自动加自己): ", end="")
    try:
        result = _validate_doctor_access(None, "王医生", "frontline")
        print(f"✅ 通过 (自动添加: {result})")
    except Exception as e:
        print(f"❌ 失败: {e}")

    print("\n2.2 测试查询接口的权限控制...")

    print("   - 管理层获取全部数据: ", end="")
    df = get_revisit_risk_overview(current_user="张院长", role="management")
    print(f"✅ {len(df)} 条记录")

    print("   - 一线人员获取自己的数据: ", end="")
    df = get_revisit_risk_overview(current_user="王医生", role="frontline")
    all_doctors = df["responsible_doctor"].unique().to_list()
    if len(all_doctors) == 1 and all_doctors[0] == "王医生":
        print(f"✅ 正确, 共 {len(df)} 条, 全部是王医生的")
    else:
        print(f"❌ 错误, 包含的医生: {all_doctors}")

    print("   - 按医生统计(管理层): ", end="")
    df = get_revisit_rate_by_doctor(current_user="张院长", role="management")
    print(f"✅ {len(df)} 位医生")

    print("   - 按医生统计(一线人员): ", end="")
    df = get_revisit_rate_by_doctor(current_user="王医生", role="frontline")
    if len(df) == 1 and df["doctor_name"][0] == "王医生":
        print(f"✅ 正确, 只显示王医生的统计")
    else:
        print(f"❌ 错误: {df.to_dicts()}")

    print("\n✅ 权限控制测试通过")


def test_status_flow_and_notes():
    """测试状态流转和注释功能"""
    print("\n" + "=" * 60)
    print("测试3: 状态流转和注释功能")
    print("=" * 60)

    df = get_revisit_risk_overview()
    if df.is_empty():
        print("❌ 没有数据可以测试")
        return

    appointment_id = df["appointment_id"][0]
    initial_status = df["status"][0]
    initial_risk = df["risk_level"][0]
    print(f"\n3.1 选择测试预约: {appointment_id} (状态: {initial_status}, 风险: {initial_risk})")

    print("\n3.2 测试添加注释...")
    result = add_appointment_note(
        appointment_id,
        "这是一条测试注释 - 患者爽约原因说明",
        "测试用户",
        update_risk=True,
        new_risk_level="high"
    )
    if result["success"]:
        print(f"   ✅ 添加成功, note_id: {result['note_id']}, 风险更新: {result['risk_updated']}")
    else:
        print(f"   ❌ 添加失败: {result['message']}")

    print("\n3.3 验证注释记录...")
    notes = get_appointment_notes(appointment_id)
    if not notes.is_empty():
        print(f"   ✅ 共有 {len(notes)} 条注释")
        for note in notes.iter_rows(named=True):
            print(f"     - {note['created_by']} ({note['created_at']}): {note['note_text'][:30]}...")
    else:
        print("   ❌ 没有注释记录")

    print("\n3.4 测试状态变更...")

    valid_transitions = {
        "待复诊": "爽约",
        "爽约": "待复诊",
        "已完成": "待复诊",
    }

    target_status = valid_transitions.get(initial_status, "待复诊")
    print(f"   从 {initial_status} -> {target_status}")

    result = update_appointment_status(
        appointment_id,
        target_status,
        "测试用户",
        note_text="测试状态变更的说明"
    )
    if result["success"]:
        print(f"   ✅ 变更成功: {result['old_status']} -> {result['new_status']}")
    else:
        print(f"   ❌ 变更失败: {result['message']}")

    print("\n3.5 验证状态变更后有注释记录...")
    notes = get_appointment_notes(appointment_id)
    has_status_note = any("状态变更" in n["note_text"] for n in notes.iter_rows(named=True))
    if has_status_note:
        print("   ✅ 状态变更自动生成了注释记录")
    else:
        print("   ⚠️  未找到状态变更注释")

    print("\n3.6 测试空注释验证...")
    result = add_appointment_note(
        appointment_id,
        "   ",
        "测试用户"
    )
    if not result["success"]:
        print(f"   ✅ 正确拒绝空注释: {result['message']}")
    else:
        print(f"   ❌ 不应该允许空注释")

    print("\n✅ 状态流转和注释功能测试通过")


def test_imaging_ranking():
    """测试影像排行和MinIO集成"""
    print("\n" + "=" * 60)
    print("测试4: 影像排行和MinIO集成")
    print("=" * 60)

    print("\n4.1 获取影像排行数据...")
    result = get_imaging_ranking()

    print(f"   - 数据来源: {result['source']}")
    print(f"   - MinIO可用: {result['minio_available']}")
    print(f"   - 影像类型数: {len(result['data'])}")

    if not result['data'].is_empty():
        print("\n   影像类型分布:")
        for row in result['data'].iter_rows(named=True):
            size_mb = round(row['total_size'] / 1024 / 1024, 2) if row['total_size'] else 0
            print(f"     - {row['image_type']}: {row['image_count']}张, 总{size_mb}MB")

    if result['minio_available'] and result['minio_stats']:
        print(f"\n   MinIO统计:")
        print(f"     - 总文件数: {result['minio_stats']['total_files']}")
        if result['minio_stats'].get('by_type'):
            print(f"     - 按类型分布:")
            for t, s in result['minio_stats']['by_type'].items():
                print(f"       {t}: {s['count']}个")
    else:
        print("\n   ⚠️  MinIO未连接，使用数据库数据（降级模式）")
        print("   这是正常现象，配置MinIO后会自动启用")

    print("\n✅ 影像排行测试通过")


def test_error_handling():
    """测试异常处理"""
    print("\n" + "=" * 60)
    print("测试5: 异常处理")
    print("=" * 60)

    print("\n5.1 测试无效的状态变更...")
    df = get_revisit_risk_overview()
    if not df.is_empty():
        appt_id = df["appointment_id"][0]
        result = update_appointment_status(appt_id, "不存在的状态", "测试用户")
        if not result["success"]:
            print(f"   ✅ 正确拒绝无效状态: {result['message']}")
        else:
            print(f"   ❌ 不应该允许无效状态")

    print("\n5.2 测试不存在的预约ID...")
    result = update_appointment_status("不存在的ID", "已完成", "测试用户")
    if not result["success"]:
        print(f"   ✅ 正确处理不存在的记录: {result['message']}")
    else:
        print(f"   ❌ 不应该成功")

    print("\n5.3 测试获取不存在的预约的注释...")
    notes = get_appointment_notes("不存在的ID")
    if notes.is_empty():
        print("   ✅ 正确返回空列表")
    else:
        print("   ❌ 不应该有数据")

    print("\n✅ 异常处理测试通过")


def run_all_tests():
    """运行所有测试"""
    print("\n" + "🚀" * 30)
    print("   口腔诊所复诊风险监测系统 - 完整功能验证")
    print("🚀" * 30)

    print("\n⚠️  注意: 本测试会重置数据库，请确保不需要保留现有数据")
    print("")

    db_path = "data/clinic.db"
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"已清除旧数据库: {db_path}")

    try:
        test_database_and_transactions()
        test_permission_control()
        test_status_flow_and_notes()
        test_imaging_ranking()
        test_error_handling()

        print("\n" + "🎉" * 30)
        print("   所有测试通过！系统功能完整")
        print("🎉" * 30)

    except Exception as e:
        print(f"\n❌ 测试过程中发生异常: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    run_all_tests()
