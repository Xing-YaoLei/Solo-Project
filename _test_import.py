#!/usr/bin/env python3
"""数据导入端到端快速验证（6个测试场景）"""
import sys
import os
import polars as pl
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.data.database import db
from src.data.analytics import TicketAnalytics
from src.data.minio_client import minio_client
from src.pages.import_data import (
    _map_to_standard_columns,
    _import_tickets_data,
    _import_payments_data,
    _get_import_history,
)

print("=" * 60)
print("🧪 数据导入端到端快速测试")
print("=" * 60)

# --- 测试0: MinIO 连接状态 ---
print("\n--- 测试0: MinIO 连接状态检测 ---")
minio_status = minio_client.get_status_info()
print(f"  MinIO 端点: {minio_status['endpoint']}")
print(f"  MinIO Bucket: {minio_status['bucket']}")
print(f"  MinIO 可用: {minio_status['available']}")
assert "available" in minio_status, "MinIO 状态应包含 available 字段"

events = db.query_to_df("SELECT event_id, event_name FROM events LIMIT 1")
test_event_id = events["event_id"][0]
test_event_name = events["event_name"][0]
print(f"✅ 测试活动: {test_event_name} ({test_event_id})")

tickets_before = db.table_row_count("tickets")
orders_before = db.table_row_count("orders")
payments_before = db.table_row_count("payments")
paid_before = db.query_to_df(
    f"SELECT COUNT(*) as cnt FROM tickets WHERE event_id = '{test_event_id}' AND payment_status = 'paid'"
)["cnt"][0]
print(f"导入前: tickets={tickets_before}, orders={orders_before}, payments={payments_before}, 已支付票数={paid_before}")

# 先导入一批票务数据（有些 payment_status 不是 paid，用于后续测试支付流水联动更新）
print("\n--- 测试1: 导入票务平台基础数据（部分设置为未支付）---")
_suffix = uuid.uuid4().hex[:6]
tickets_csv = pl.DataFrame({
    "票码": [f"TCK_{_suffix}_{i:04d}" for i in range(1, 6)],
    "持票人": ["张三", "李四", "王五", "赵六", "钱七"],
    "购票人": ["张先生", "李女士", "王总", "赵经理", "钱主任"],
    "座位": [f"A1{i:02d}" for i in range(1, 6)],
    "实付金额": [99.0, 199.0, 299.0, 399.0, 499.0],
    "购买时间": [f"2026-06-20 10:{i:02d}:00" for i in range(1, 6)],
    "支付状态": ["paid", "paid", "unpaid", "unpaid", "unpaid"],  # 3张未支付
    "票据状态": ["active"] * 5,
    "销售渠道": ["online"] * 5,
}, infer_schema_length=None)
print(f"  原始CSV(中文列): {tickets_csv.height} 条（3张未支付）")

mapped1 = _map_to_standard_columns(tickets_csv, "tickets")
mapped1 = mapped1.with_columns(pl.lit(test_event_id).alias("event_id"))

result1 = _import_tickets_data(mapped1, test_event_id, "test_tickets.csv")
print(f"  导入结果: {result1}")
assert len(result1["errors"]) == 0, f"票务导入报错: {result1['errors']}"
assert result1["tickets"] == 5, f"门票应该导入5条，实际{result1['tickets']}"

# 查询刚导入的这些票的 order_id
new_order_ids = db.query_to_df(
    f"SELECT DISTINCT order_id FROM tickets WHERE event_id = '{test_event_id}' AND source_file = 'test_tickets.csv' ORDER BY purchase_time"
)["order_id"].to_list()
print(f"  新导入订单ID: {new_order_ids}")
assert len(new_order_ids) == 5, f"应该有5个订单ID，实际{len(new_order_ids)}"

# --- 测试2: paid_time字段自动映射为payment_time导入支付流水，联动更新票务支付状态 ---
print("\n--- 测试2: 支付流水导入后联动更新 tickets.payment_status ---")
payments_csv = pl.DataFrame({
    "交易流水号": [f"TXN_{_suffix}_{i:04d}" for i in range(1, 6)],
    "订单号": new_order_ids,  # 用刚导入的5个订单ID
    "金额": [99.0, 199.0, 299.0, 399.0, 499.0],
    "支付方式": ["wechat", "alipay", "card", "wechat", "alipay"],
    "支付状态": ["success"] * 5,  # 全部支付成功
    "paid_time": [f"2026-06-20 11:{i:02d}:00" for i in range(1, 6)],
    "退款金额": [0.0] * 5,
}, infer_schema_length=None)
print(f"  原始支付CSV: {payments_csv.height} 条，对应5个订单")

mapped2 = _map_to_standard_columns(payments_csv, "payments")
print(f"  映射后列名: {mapped2.columns}")
assert "payment_time" in mapped2.columns, "paid_time应该映射为payment_time"

mapped2 = mapped2.with_columns(pl.lit(test_event_id).alias("event_id"))

result2 = _import_payments_data(mapped2, test_event_id, "test_payments.csv")
print(f"  支付导入结果: {result2}")
assert len(result2["errors"]) == 0, f"支付导入报错: {result2['errors']}"
assert result2["payments"] == 5, f"支付应该导入5条，实际{result2['payments']}"
assert result2["tickets_updated"] == 3, f"应该联动更新3张未支付票的状态，实际{result2['tickets_updated']}"

tickets_after = db.table_row_count("tickets")
orders_after = db.table_row_count("orders")
payments_after = db.table_row_count("payments")

paid_after = db.query_to_df(
    f"SELECT COUNT(*) as cnt FROM tickets WHERE event_id = '{test_event_id}' AND payment_status = 'paid'"
)["cnt"][0]
print(f"导入后: tickets={tickets_after} (+{tickets_after - tickets_before}), "
      f"orders={orders_after} (+{orders_after - orders_before}), "
      f"payments={payments_after} (+{payments_after - payments_before})")
print(f"已支付票数: {paid_before} → {paid_after} (+{paid_after - paid_before})")
assert paid_after == paid_before + 3, f"已支付票数应该增加3，实际增加{paid_after - paid_before}"

# --- 测试3: 核销漏斗数据已更新 ---
print("\n--- 测试3: 核销漏斗数据已更新 ---")
analytics = TicketAnalytics(test_event_id)
funnel = analytics.get_funnel_chart_data()
print(f"  核销漏斗: {[(row['stage'], row['count']) for row in funnel.iter_rows(named=True)]}")
assert funnel.height == 5, "漏斗应该有5层"
issued_count = funnel.filter(pl.col("stage") == "已出票")["count"][0]
paid_count = funnel.filter(pl.col("stage") == "已支付")["count"][0]
assert paid_count >= paid_after, f"漏斗已支付数应该>={paid_after}，实际{paid_count}"

eff = analytics.get_efficiency_metrics()
print(f"  效率指标: 核销率={eff.get('checkin_rate')}%, 退票率={eff.get('refund_rate')}%")

# --- 测试4: 对账统计 ---
print("\n--- 测试4: 支付对账统计 ---")
recon = analytics.get_payment_reconciliation()
print(f"  对账结果: {recon}")
assert "票务已支付票数" in recon
assert "支付流水成功数" in recon
assert "对账状态" in recon
print(f"  对账状态: {recon['对账状态']}")
print(f"  对账详情: {recon['对账详情']}")
assert recon["票务已支付票数"] == paid_after, f"票务已支付票数应该为{paid_after}"
assert recon["支付流水成功数"] == 5, "支付流水成功数应该为5"

# --- 测试5: 导入历史可见 ---
print("\n--- 测试5: 导入历史可见 ---")
history = _get_import_history(test_event_id)
print(f"  导入历史记录: {history.height} 条")
print(f"  列: {history.columns}")
print(history.to_pandas().to_string())
assert history.height >= 2, f"应该至少2条导入记录，实际 {history.height}"

print("\n" + "=" * 60)
print("✅ 所有测试通过!")
print("=" * 60)

