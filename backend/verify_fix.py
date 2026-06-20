import requests
import duckdb

BASE = "http://localhost:8000"
DB_PATH = "/Users/yaoleyxing/Developer/solo-mange-pro/MP0415/backend/data/analytics.duckdb"

print("=== 1. Refund Distribution (30天?) ===")
r = requests.get(BASE + "/api/refund/distribution")
data = r.json()["data"]
print(f"  天数: {len(data)}")
disputed_days = [d for d in data if d["disputed_count"] > 0]
print(f"  有争议天数: {len(disputed_days)}")
print(f"  日期范围: {data[0]['date']} 到 {data[-1]['date']}")

print("\n=== 2. DuckDB 文件持久化 ===")
import os
size = os.path.getsize(DB_PATH)
print(f"  文件大小: {size / 1024 / 1024:.2f} MB")

conn = duckdb.connect(DB_PATH)
tables = ["registrations", "payments", "tickets", "gate_records", 
          "refunds", "sync_logs", "sponsorship_benefits", "sponsors", "seat_areas"]
for t in tables:
    cnt = conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    print(f"    {t}: {cnt} 条")

print("\n=== 3. 赞助明细 ===")
r = requests.get(BASE + "/api/sponsorship/list?page=1&page_size=1")
first_id = r.json()["data"]["items"][0]["id"]
print(f"  取第一条 ID: {first_id[:12]}...")
r2 = requests.get(BASE + f"/api/sponsorship/{first_id}/detail")
detail = r2.json()["data"]
print(f"  赞助商: {detail['sponsor_name']}")
print(f"  权益类型: {detail['benefit_type']}")
print(f"  合同/已兑现: {detail['contract_qty']} / {detail['fulfilled_qty']}")
print(f"  兑现记录数: {len(detail['fulfillment_records'])}")

print("\n=== 4. 核销口径 (5条规则) ===")
r = requests.get(BASE + "/api/verification/definition")
defs = r.json()["data"]
print(f"  规则数量: {len(defs)}")
for d in defs:
    print(f"    - {d['id']}: {d['title']}")

print("\n=== 5. 退票争议标记处理 ===")
# 找一个争议的
dist = requests.get(BASE + "/api/refund/distribution").json()["data"]
refund_id = None
for day in dist:
    if day["disputed_points"]:
        refund_id = day["disputed_points"][0]["refund_id"]
        break

if refund_id:
    print(f"  找到争议退票: {refund_id[:12]}...")
    sample_before = requests.get(BASE + f"/api/refund/{refund_id}/sample").json()["data"]
    print(f"  处理前 is_disputed: {sample_before['is_disputed']}")
    r = requests.post(BASE + f"/api/refund/{refund_id}/mark-processed",
                      json={"note": "已与客户协商一致，争议解除"})
    sample_after = r.json()["data"]
    print(f"  处理后 is_disputed: {sample_after['is_disputed']}")
    print(f"  处理备注: {sample_after['dispute_note'][:40]}...")
else:
    print("  没有找到争议退票样本")

print("\n✅ 所有验证完成")
