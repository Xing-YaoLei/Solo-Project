import sys
sys.path.insert(0, '.')

print("⚡ 快速SQL语法验证...")
from src.data.database import db
from src.data.analytics import TicketAnalytics

# 先清掉有问题的旧数据库（通过删除连接并在内存测试）
analytics = TicketAnalytics(event_id=None)

tests = [
    ("get_funnel_data", lambda: analytics.get_funnel_data()),
    ("get_efficiency_metrics", lambda: analytics.get_efficiency_metrics()),
    ("get_events_list", lambda: analytics.get_events_list()),
    ("get_sponsor_breakdown", lambda: analytics.get_sponsor_breakdown()),
    ("get_ticket_type_breakdown", lambda: analytics.get_ticket_type_breakdown()),
    ("get_checkin_timeline", lambda: analytics.get_checkin_timeline("15minute")),
    ("get_gate_efficiency", lambda: analytics.get_gate_efficiency()),
    ("get_staff_performance", lambda: analytics.get_staff_performance()),
    ("get_processing_conclusions", lambda: analytics.get_processing_conclusions()),
]

all_ok = True
for name, fn in tests:
    try:
        result = fn()
        if isinstance(result, dict):
            print(f"  ✅ {name}: {len(result)} keys")
        else:
            print(f"  ✅ {name}: {result.height if hasattr(result, 'height') else len(result)} rows")
    except Exception as e:
        print(f"  ❌ {name}: {type(e).__name__}: {str(e)[:200]}")
        all_ok = False

print()
if all_ok:
    print("🎉 所有SQL查询语法验证通过！")
else:
    print("⚠️ 存在查询错误，需要修复")
