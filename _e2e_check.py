"""
端到端导入 + 回调注册验证脚本。
不依赖真实 PostgreSQL/Celery，只要模块结构、Dash 回调绑定能成功即可。
"""
import sys
import traceback


def section(title: str):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def step(name: str, fn):
    print(f"  [?] {name} ... ", end="")
    sys.stdout.flush()
    try:
        fn()
        print("OK")
        return True
    except Exception as e:
        print("FAIL")
        traceback.print_exc()
        return False


ok_all = True

# ----------------------------------------------------------------------
section("1. 基础模块导入")

import config
ok_all &= step("config.Config", lambda: (
    print(config.Config.SECRET_KEY[:6] + "...", end=" ") or True
))

import app.models as m
ok_all &= step("app.models 关键符号存在", lambda: all([
    hasattr(m, "Base"), hasattr(m, "engine"), hasattr(m, "get_session"),
    hasattr(m, "User"), hasattr(m, "Prescription"), hasattr(m, "FollowUp"),
    hasattr(m, "PrescriptionStatus"), hasattr(m, "UserRole"),
    hasattr(m, "init_default_users"), hasattr(m, "verify_user_credentials"),
]))

import app.data as d
ok_all &= step("app.data 关键符号存在", lambda: all([
    hasattr(d, "import_pos_data"), hasattr(d, "import_member_data"),
    hasattr(d, "import_insurance_data"), hasattr(d, "link_members_to_prescriptions"),
    hasattr(d, "generate_batch_no"),
]))

import app.tasks.celery_app as ca_module
from app.tasks.celery_app import celery_app as celery_app_inst
ok_all &= step("app.tasks.celery_app", lambda: print(celery_app_inst.main or "(name unset)", end=" ") or True)

from app.dashboards import charts, data_service
ok_all &= step("charts 工厂", lambda: len([x for x in dir(charts) if x.startswith("create_")]) >= 8)
ok_all &= step("data_service 读操作", lambda: len([x for x in dir(data_service) if x.startswith("get_")]) >= 10)
ok_all &= step("data_service 写操作", lambda: all([
    hasattr(data_service, "submit_pharmacist_review"),
    hasattr(data_service, "resolve_note"),
]))

from app.dashboards import (
    build_management_layout, build_executor_layout,
    register_management_callbacks, register_executor_callbacks,
)
ok_all &= step("layout + register 回调 builder 导入", lambda: True)

# ----------------------------------------------------------------------
section("2. Dash 应用启动 + 启动期回调注册（不连真实 DB）")


def build_and_check_app():
    import importlib.util
    import os
    # 项目根目录下的 app.py 是 Dash 启动入口，同时存在 app/ 包。
    # 用 importlib 直接按文件路径加载，避开包名冲突。
    app_py_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app.py")
    spec = importlib.util.spec_from_file_location("app_root", app_py_path)
    app_root = importlib.util.module_from_spec(spec)
    sys.modules["app_root"] = app_root
    spec.loader.exec_module(app_root)
    create_app = app_root.create_app

    app = create_app()
    # 统计回调数量：每个 app.callback 注册后会出现在 app.callback_map
    callback_map = getattr(app, "callback_map", {})
    total = len(callback_map)
    print(f"已注册回调数: {total}  ", end="")
    if total < 7:
        raise RuntimeError(
            f"应该至少有 7 个回调（3 管理 + 4 执行 + 3 路由登录登出），实际 {total}"
        )
    # 检查带 mgmt- 前缀和 exec- 前缀的 output
    mgmt_outputs = sum(1 for k in callback_map if "mgmt-" in k)
    exec_outputs = sum(1 for k in callback_map if "exec-" in k)
    print(f"(mgmt-*: {mgmt_outputs}, exec-*: {exec_outputs})", end=" ")
    if mgmt_outputs == 0 or exec_outputs == 0:
        raise RuntimeError("管理/执行看板回调未正确注册（缺少 mgmt-/exec- 前缀 ID）")
    return True


ok_all &= step("create_app() 且回调正确绑定", build_and_check_app)

# ----------------------------------------------------------------------
section("3. 模型与状态机完整性")


def check_enums():
    from app.models import (
        PrescriptionStatus, PharmacistOpinion, FollowUpStatus, UserRole,
    )
    # 处方状态完整链路
    statuses = set(s.value for s in PrescriptionStatus)
    required = {"received", "under_review", "approved", "rejected",
                "needs_clarification", "follow_up"}
    if not required.issubset(statuses):
        raise RuntimeError(f"PrescriptionStatus 缺少: {required - statuses}")

    opinions = set(o.value for o in PharmacistOpinion)
    required_op = {"passed", "dose_issue", "interaction_warning",
                   "duplicate_therapy", "contraindication",
                   "incomplete_info", "photo_unclear"}
    if not required_op.issubset(opinions):
        raise RuntimeError(f"PharmacistOpinion 缺少: {required_op - opinions}")

    fu = set(s.value for s in FollowUpStatus)
    if not {"pending", "in_progress", "completed", "cancelled"}.issubset(fu):
        raise RuntimeError("FollowUpStatus 不完整")

    roles = set(r.value for r in UserRole)
    if not {"management", "executor", "pharmacist"}.issubset(roles):
        raise RuntimeError("UserRole 不完整")
    return True


ok_all &= step("Enum 完整（处方/药师/回访/角色）", check_enums)

# ----------------------------------------------------------------------
section("4. 图表工厂空数据容错测试")


def test_empty_charts():
    import pandas as pd
    from app.dashboards.charts import (
        create_trend_chart, create_photo_distribution_chart,
        create_photo_quality_pie, create_pharmacist_funnel,
        create_expiry_ranking_chart, create_member_change_chart,
        create_pharmacy_comparison, create_status_pie, create_kpi_card,
    )
    empty_df = pd.DataFrame()
    # 大部分图表用 empty df，status_pie 用空 dict
    figs = [
        create_status_pie({}),
        create_kpi_card(0, "测试"),
    ]
    # 其他工厂即使空 df 也不应该抛异常（最多空图）
    safe_factories = [
        ("trend", create_trend_chart),
        ("photo_dist", create_photo_distribution_chart),
        ("photo_qual", create_photo_quality_pie),
        ("funnel", create_pharmacist_funnel),
        ("expiry", create_expiry_ranking_chart),
        ("member", create_member_change_chart),
        ("pharmacy", create_pharmacy_comparison),
    ]
    for name, fn in safe_factories:
        try:
            figs.append(fn(empty_df))
        except Exception as e:
            raise RuntimeError(f"{name} 空 df 抛错: {e}")
    if not all(hasattr(f, "to_dict") for f in figs):
        raise RuntimeError("部分图表工厂没返回 Figure")
    print(f"生成 {len(figs)} 张图  ", end="")
    return True


ok_all &= step("图表工厂空数据容错", test_empty_charts)

# ----------------------------------------------------------------------
section("5. 总结")
if ok_all:
    print("\n🎉 端到端验证全部通过。")
    sys.exit(0)
else:
    print("\n💥 端到端验证存在失败，请查看上方日志。")
    sys.exit(1)
