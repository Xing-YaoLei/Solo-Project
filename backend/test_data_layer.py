import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("  后端数据层验证测试")
print("=" * 60)
print()

from app.services.data_service import (
    get_data_source,
    get_dashboard_summary,
    get_settlement_trend,
    get_order_details,
    get_amount_checks,
    get_caliber_diffs,
    get_approval_nodes,
)

print(f"🎯 当前数据源: {get_data_source()}")
print()

print("📊 测试 Dashboard Summary:")
s = get_dashboard_summary()
print(f"   total_settlement: {s.total_settlement}")
print(f"   total_orders: {s.total_orders}")
print(f"   anomaly_count: {s.anomaly_count}")
print(f"   delay_orders: {s.delay_orders}")
print(f"   missing_cs_records: {s.missing_cs_records}")
print(f"   caliber_changes: {s.caliber_changes}")
print(f"   affected_amount: {s.affected_amount}")
print()

print("📈 测试 Settlement Trend:")
t = get_settlement_trend(1)
print(f"   merchant_name: {t.merchant_name}")
print(f"   trend_data 点数: {len(t.trend_data)}")
print(f"   anomaly_summary: {t.anomaly_summary}")
print(f"   affected_ranges: {len(t.affected_ranges)} 个")
if t.affected_ranges:
    print(f"   第一个受影响区间: {t.affected_ranges[0]}")
print()

print("📋 测试 Order Details:")
o = get_order_details(1, page=1, page_size=3)
print(f"   total: {o['total']}")
print(f"   page: {o['page']}")
print(f"   page_size: {o['page_size']}")
print(f"   items 数量: {len(o['items'])}")
if o['items']:
    first = o['items'][0]
    print(f"   第一个订单: {first.order_no}, 金额: {first.amount}")
print()

print("💰 测试 Amount Checks:")
checks = get_amount_checks()
print(f"   记录数: {len(checks)}")
if checks:
    print(f"   第一条: check_no={checks[0].check_no}, "
          f"expected={checks[0].expected_settlement}, "
          f"actual={checks[0].actual_settlement}, "
          f"consistent={checks[0].is_consistent}")
print()

print("🔍 测试 Caliber Diffs:")
diffs = get_caliber_diffs(page=1, page_size=3)
print(f"   total: {diffs['total']}")
print(f"   items 数量: {len(diffs['items'])}")
if diffs['items']:
    print(f"   第一条: diff_no={diffs['items'][0].diff_no}, "
          f"type={diffs['items'][0].diff_type}")
print()

print("✅ 测试 Approval Nodes:")
approvals = get_approval_nodes(1)
print(f"   节点数: {len(approvals)}")
for a in approvals:
    print(f"   - {a.node_name}: {a.status} ({a.approver or '待审批'})")
print()

print("=" * 60)
print(f"  ✅ 所有测试通过! 数据源: {get_data_source()}")
print("=" * 60)
