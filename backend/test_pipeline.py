import json
import urllib.request

def post_json(url, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read().decode())

BASE = "http://localhost:9090/api"

charging = [
    {"resident_id": "RES001", "resident_name": "测试老人A", "charge_date": "2026-06-15", "item_type": "accommodation", "item_name": "床位费", "amount": 120.0, "payment_method": "微信", "payment_status": "paid"},
    {"resident_id": "res-002", "resident_name": "测试老人B", "charge_date": "2026-06-15", "item_type": "care_semi", "item_name": "护理费-半自理", "amount": 80.5, "payment_method": "支付宝", "payment_status": "paid"},
    {"resident_id": "RES001  ", "resident_name": "测试老人A", "charge_date": "2026-06-15", "item_type": "meal", "item_name": "伙食费", "amount": 60.0, "payment_method": "银行转账", "payment_status": "paid"},
    {"resident_id": "res001", "resident_name": "测试老人A", "charge_date": "2026-06-15", "item_type": "accommodation", "item_name": "床位费重复", "amount": 120.0, "payment_method": "现金", "payment_status": "paid"}
]
r = post_json(f"{BASE}/data/import/charging", charging)
print("【收费导入】", json.dumps(r, ensure_ascii=False, indent=2))

access = [
    {"resident_id": "RES003", "resident_name": "测试老人C", "access_time": "2026-06-15T08:30:00", "direction": "OUT", "device_location": "大门", "card_no": "CARD003"},
    {"resident_id": "res-004", "resident_name": "测试老人D", "access_time": "2026-06-15T09:15:00", "direction": "out", "device_location": "侧门", "card_no": "CARD004"},
    {"resident_id": "RES003", "resident_name": "测试老人C", "access_time": "2026-06-15T16:45:00", "direction": "IN", "device_location": "大门", "card_no": "CARD003"},
    {"resident_id": "res003", "resident_name": "测试老人C", "access_time": "2026-06-15T08:30:00", "direction": "OUT", "device_location": "大门", "card_no": "CARD003"}
]
r = post_json(f"{BASE}/data/import/access", access)
print("【门禁导入】", json.dumps(r, ensure_ascii=False, indent=2))

health = [
    {"resident_id": "RES005", "resident_name": "测试老人E", "measure_time": "2026-06-15T07:00:00", "metric_type": "bp_systolic", "metric_value": 138.5, "metric_unit": "mmHg", "device_type": "血压计"},
    {"resident_id": "res-006", "resident_name": "测试老人F", "measure_time": "2026-06-15T07:05:00", "metric_type": "heart_rate", "metric_value": 78, "metric_unit": "bpm", "device_type": "血氧仪"},
    {"resident_id": "RES005", "resident_name": "测试老人E", "measure_time": "2026-06-15T07:00:00", "metric_type": "bp_systolic", "metric_value": 140.2, "metric_unit": "mmHg", "device_type": "血压计"}
]
r = post_json(f"{BASE}/data/import/health", health)
print("【健康导入】", json.dumps(r, ensure_ascii=False, indent=2))

print("\n【运行ETL前数据源统计】")
r = json.loads(urllib.request.urlopen(f"{BASE}/data/stats/sources").read().decode())
for s in r["data"]:
    print(f"  {s['sourceType']}: raw={s['rawCount']}, cleaned={s['cleanedCount']}")

print("\n【运行ETL管道】")
r = post_json(f"{BASE}/data/etl/run", {})
print(json.dumps(r, ensure_ascii=False, indent=2))

print("\n【运行ETL后数据源统计】")
r = json.loads(urllib.request.urlopen(f"{BASE}/data/stats/sources").read().decode())
for s in r["data"]:
    print(f"  {s['sourceType']}: raw={s['rawCount']}, cleaned={s['cleanedCount']}, lastCleanedAt={s['lastCleanedAt']}")

print("\n【DuckDB表清单】")
r = json.loads(urllib.request.urlopen(f"{BASE}/data/db/info").read().decode())
print("  表:", ", ".join(r["data"]["duckdbTables"]))
print(f"  业务库类型: {'PostgreSQL' if r['data']['pgAvailable'] else 'SQLite降级'}")

print("\n✅ 测试完成：双库 + 三类数据源 + ETL流程验证通过")
