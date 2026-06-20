#!/usr/bin/env python3
"""数据导入端到端快速验证（4个测试场景）"""
import sys
import os
import polars as pl
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.data.database import db
from src.data.analytics import TicketAnalytics
from src.pages.import_data import (
    _map_to_standard_columns,
    _import_tickets_data,
    _import_payments_data,
    _get_import_history,
)

print("=" * 60)
print("🧪 数据导入端到端快速测试")
print("=" * 60)

events = db.query_to_df("SELECT event_id, event_name FROM events LIMIT 1")
test_event_id = events["event_id"][0]
test_event_name = events["event_name"][0]
print(f"✅ 测试活动: {test_event_name} ({test_event_id})")

tickets_before = db.table_row_count("tickets")
orders_before = db.table_row_count("orders")
payments_before = db.table_row_count("payments")
print(f"导入前: tickets={tickets_before}, orders={orders_before}, payments={payments_before}")

# --- 测试1: 中文字段CSV导入票务平台数据 ---
print("\n--- 测试1: 中文字段CSV导入票务平台数据 ---")
_suffix = uuid.uuid4().hex[:6]
tickets_csv = pl.DataFrame({
    "票码": [f"TCK_{_suffix}_{i:04d}" for i in range(1, 6)],
    "持票人": ["张三", "李四", "王五", "赵六", "钱七"],
    "购票人": ["张先生", "李女士", "王总", "赵经理", "钱主任"],
    "座位": [f"A1{i:02d}" for i in range(1, 6)],
    "实付金额": [99.0, 199.0, 299.0, 399.0, 499.0],
    "购买时间": [f"2026-06-20 10:{i:02d}:00" for i in range(1, 6)],
    "支付状态": ["paid"] * 5,
    "票据状态": ["active"] * 5,
    "销售渠道": ["online"] * 5,
}, infer_schema_length=None)
print(f"  原始CSV(中文列): {tickets_csv.height} 条")

mapped1 = _map_to_standard_columns(tickets_csv, "tickets")
print(f"  映射后列名: {mapped1.columns}")

# 合并 event_id 到导入 DF
mapped1 = mapped1.with_columns(pl.lit(test_event_id).alias("event_id"))

result1 = _import_tickets_data(mapped1, test_event_id, "test_tickets.csv")
print(f"  导入结果: {result1}")
assert len(result1["errors"]) == 0, f"票务导入报错: {result1['errors']}"
assert result1["tickets"] == 5, f"门票应该导入5条，实际{result1['tickets']}"

tickets_after = db.table_row_count("tickets")
orders_after = db.table_row_count("orders")
print(f"导入后: tickets={tickets_after} (+{tickets_after - tickets_before}), orders={orders_after} (+{orders_after - orders_before})")

# --- 测试2: paid_time字段自动映射为payment_time导入支付流水 ---
print("\n--- 测试2: paid_time字段自动映射为payment_time导入支付流水 ---")
existing_order_ids = db.query_to_df(
    f"SELECT order_id FROM orders WHERE event_id = '{test_event_id}' LIMIT 5"
)["order_id"].to_list()
print(f"  可用订单号: {existing_order_ids}")

payments_csv = pl.DataFrame({
    "交易流水号": [f"TXN_{_suffix}_{i:04d}" for i in range(1, 4)],
    "订单号": existing_order_ids[:3],
    "金额": [99.0, 199.0, 299.0],
    "支付方式": ["wechat", "alipay", "card"],
    "支付状态": ["success", "success", "refunded"],
    "paid_time": ["2026-06-20 11:00:00", "2026-06-20 11:05:00", "2026-06-20 11:10:00"],
    "退款金额": [0.0, 0.0, 299.0],
}, infer_schema_length=None)
print(f"  原始支付CSV: {payments_csv.height} 条")

mapped2 = _map_to_standard_columns(payments_csv, "payments")
print(f"  映射后列名: {mapped2.columns}")
assert "payment_time" in mapped2.columns, "paid_time应该映射为payment_time"

mapped2 = mapped2.with_columns(pl.lit(test_event_id).alias("event_id"))

result2 = _import_payments_data(mapped2, test_event_id, "test_payments.csv")
print(f"  支付导入结果: {result2}")
assert len(result2["errors"]) == 0, f"支付导入报错: {result2['errors']}"
assert result2["payments"] == 3, f"支付应该导入3条，实际{result2['payments']}"

payments_after = db.table_row_count("payments")
print(f"  支付表记录: {payments_after} (+{payments_after - payments_before})")

# --- 测试3: 核销漏斗数据已更新 ---
print("\n--- 测试3: 核销漏斗数据已更新 ---")
analytics = TicketAnalytics(test_event_id)
funnel = analytics.get_funnel_chart_data()
print(f"  核销漏斗: {[(row['stage'], row['count']) for row in funnel.iter_rows(named=True)]}")
assert funnel.height == 5, "漏斗应该有5层"
issued_count = funnel.filter(pl.col("stage") == "已出票")["count"][0]
assert issued_count >= tickets_before + 5, f"出票数应该>={tickets_before + 5}，实际{issued_count}"

eff = analytics.get_efficiency_metrics()
print(f"  效率指标: 核销率={eff.get('checkin_rate')}%, 退票率={eff.get('refund_rate')}%")

# --- 测试4: 导入历史可见 ---
print("\n--- 测试4: 导入历史可见 ---")
history = _get_import_history(test_event_id)
print(f"  导入历史记录: {history.height} 条")
print(f"  列: {history.columns}")
print(history.to_pandas().to_string())
assert history.height >= 2, f"应该至少2条导入记录，实际 {history.height}"

print("\n" + "=" * 60)
print("✅ 所有测试通过!")
print("=" * 60)
