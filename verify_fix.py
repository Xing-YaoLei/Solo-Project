#!/usr/bin/env python3
"""验证回调注册修复的快速测试"""
import sys
import traceback

passed = 0
failed = 0

def check(name, fn):
    global passed, failed
    try:
        result = fn()
        print(f"  ✅ {name}")
        passed += 1
        return result
    except Exception as e:
        print(f"  ❌ {name}: {e}")
        traceback.print_exc()
        failed += 1
        return None

print("=" * 60)
print("验证 1: elder_callbacks 导入 (ALL 是否存在)")
print("=" * 60)

check("from dash import ALL", lambda: __import__("dash", fromlist=["ALL"]).ALL)

def import_elder_callbacks():
    from app.callbacks.elder_callbacks import (
        register_elder_callbacks, _render_profile_html, _render_care_figure,
        _render_medication_html, _render_notes_html,
    )
    return True

check("register_elder_callbacks 可导入", import_elder_callbacks)

print()
print("=" * 60)
print("验证 2: view_storage 服务函数")
print("=" * 60)

def import_view_storage():
    from app.services.view_storage import (
        save_view, list_views, get_view, delete_view, build_snapshot,
    )
    return True

check("view_storage 全部函数可导入", import_view_storage)

def list_views_call():
    from app.services.view_storage import list_views
    result = list_views()
    assert isinstance(result, list), f"返回类型应为list，实际{type(result)}"
    return True

check("list_views() 调用成功", list_views_call)

print()
print("=" * 60)
print("验证 3: 4个 _render_* 对模拟快照的渲染")
print("=" * 60)

mock_snapshot = {
    "profile": {
        "name": "测试老人", "elder_code": "EL001", "gender": "男",
        "birth_date": "1945-01-01", "admission_date": "2024-01-01",
        "room_number": "101", "phone": "13800138000",
        "emergency_contact": "家属A", "emergency_phone": "13900139000",
        "current_status": "在住",
    },
    "assessments": [
        {"date": "2024-01-01", "level": "自理", "score": 92},
        {"date": "2024-06-01", "level": "半自理", "score": 68},
    ],
    "medications": [
        {"medication_name": "阿司匹林", "dosage": "100mg", "frequency": "每日一次",
         "administration_route": "口服", "start_date": "2024-01-01",
         "prescribing_doctor": "医生A", "notes": "餐后服用"},
    ],
    "review_notes": [
        {"date": "2024-06-15", "type": "常规评估", "content": "状态良好", "author": "护士长"},
    ],
}

from app.callbacks.elder_callbacks import (
    _render_profile_html, _render_care_figure,
    _render_medication_html, _render_notes_html,
)

def render_profile():
    html_node = _render_profile_html(mock_snapshot["profile"])
    assert len(getattr(html_node, "children", [])) >= 10, "字段数应>=10"
    return True

def render_care():
    fig = _render_care_figure(mock_snapshot["assessments"])
    assert len(fig.data) == 1, f"应有1条trace，实际{len(fig.data)}"
    return True

def render_meds():
    html_node = _render_medication_html(mock_snapshot["medications"])
    assert html_node is not None, "返回不应为None"
    return True

def render_notes():
    html_node = _render_notes_html(mock_snapshot["review_notes"])
    children = getattr(html_node, "children", [])
    assert len(children) == 1, f"应渲染1张卡片，实际{len(children)}"
    return True

check("_render_profile_html 渲染11项档案字段", render_profile)
check("_render_care_figure 渲染护理曲线图", render_care)
check("_render_medication_html 渲染用药表格", render_meds)
check("_render_notes_html 渲染备注卡片", render_notes)

print()
print("=" * 60)
print("验证 4: register_elder_callbacks 不使用 ALL 模式匹配时能正常调用")
print("=" * 60)

def check_all_imported_in_module():
    from app.callbacks.elder_callbacks import register_elder_callbacks
    import inspect
    source = inspect.getsource(register_elder_callbacks)
    assert "ALL" in source, "回调中应使用ALL模式匹配恢复按钮"
    return True

check("register_elder_callbacks 使用 ALL 匹配动态按钮", check_all_imported_in_module)

print()
print("=" * 60)
print(f"结果: {passed} 通过 / {failed} 失败")
print("=" * 60)

sys.exit(0 if failed == 0 else 1)
