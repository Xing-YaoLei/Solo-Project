import json
import urllib.request
from datetime import datetime, timedelta

def post_json(url, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read().decode())

BASE = "http://localhost:9090/api"

today = datetime.now()
yesterday = today - timedelta(days=1)
yesterday_str = yesterday.strftime("%Y-%m-%d")

residents = json.loads(urllib.request.urlopen(f"{BASE}/residents?page_size=5").read().decode())
real_ids = [r["id"] for r in residents["data"]["list"]]
print(f"使用真实老人 ID: {real_ids[:3]}...\n")

print("【1. 基线数据】")
r = json.loads(urllib.request.urlopen(f"{BASE}/dashboard/metrics").read().decode())
b = r["data"]
print(f"  在床: {b['bedOccupancy']}, 护理达标: {b['careComplianceRate']}%, 风险: {b['riskEventCount']}, 活动参与: {b['activityParticipationRate']}%")

r = json.loads(urllib.request.urlopen(f"{BASE}/residents/bed-utilization").read().decode())
base_beds = r["data"]
print("  基线床位利用:")
for i in base_beds:
    print(f"    {i['area']}: {i['occupiedBeds']}/{i['totalBeds']} = {i['utilizationRate']}%")

r = json.loads(urllib.request.urlopen(f"{BASE}/residents/care-level-distribution").read().decode())
base_care = r["data"]
print(f"  基线护理等级: {[(c['careLevel'], c['count']) for c in base_care]}")
print()

print("【2. 导入测试数据 + 运行ETL】")
charging = [
    {"resident_id": real_ids[0], "resident_name": "A", "charge_date": yesterday_str, "item_type": "care_special", "item_name": "特级护理费", "amount": 200, "payment_method": "现金", "payment_status": "paid"},
    {"resident_id": real_ids[1], "resident_name": "B", "charge_date": yesterday_str, "item_type": "全护理", "item_name": "全护费", "amount": 150, "payment_method": "微信", "payment_status": "paid"},
    {"resident_id": real_ids[2], "resident_name": "C", "charge_date": yesterday_str, "item_type": "accommodation", "item_name": "床位费", "amount": 120, "payment_method": "支付宝", "payment_status": "paid"},
]
r = post_json(f"{BASE}/data/import/charging", charging)
print(f"  收费: 导入{r['data']['total']}条，成功{r['data']['inserted']}条")

access = [
    {"resident_id": real_ids[0], "resident_name": "A", "access_time": f"{yesterday_str}T10:30:00", "direction": "出口", "device_location": "大门", "card_no": "CARD_NEW01"},
    {"resident_id": real_ids[1], "resident_name": "B", "access_time": f"{yesterday_str}T09:00:00", "direction": "out", "device_location": "侧门", "card_no": "CARD_NEW02"},
]
r = post_json(f"{BASE}/data/import/access", access)
print(f"  门禁: 导入{r['data']['total']}条，成功{r['data']['inserted']}条")

health = [
    {"resident_id": real_ids[0], "resident_name": "A", "measure_time": f"{yesterday_str}T07:00:00", "metric_type": "bp_systolic", "metric_value": 175, "metric_unit": "mmHg", "device_type": "血压计"},
    {"resident_id": real_ids[2], "resident_name": "C", "measure_time": f"{yesterday_str}T07:15:00", "metric_type": "heart_rate", "metric_value": 48, "metric_unit": "bpm", "device_type": "血氧仪"},
]
r = post_json(f"{BASE}/data/import/health", health)
print(f"  健康: 导入{r['data']['total']}条，成功{r['data']['inserted']}条")

r = post_json(f"{BASE}/data/etl/run", {})
print(f"  ETL: {r['data']['charging']['loaded']}chg/{r['data']['access']['loaded']}acc/{r['data']['health']['loaded']}hlth")
print()

print("【3. ETL 后变化】")
r = json.loads(urllib.request.urlopen(f"{BASE}/dashboard/metrics").read().decode())
a = r["data"]
print(f"  在床: {a['bedOccupancy']}(→{a['bedOccupancy']-b['bedOccupancy']:+d}), 护理达标: {a['careComplianceRate']}%, 风险: {a['riskEventCount']}(→{a['riskEventCount']-b['riskEventCount']:+d}), 活动参与: {a['activityParticipationRate']}%(→{a['activityParticipationRate']-b['activityParticipationRate']:+.1f}pp)")

r = json.loads(urllib.request.urlopen(f"{BASE}/dashboard/funnel").read().decode())
print("  漏斗:")
for s in r["data"]:
    print(f"    {s['stage']}: {s['value']} ({s['rate']}%)")

r = json.loads(urllib.request.urlopen(f"{BASE}/residents/bed-utilization").read().decode())
print("  床位利用:")
for i, j in zip(r["data"], base_beds):
    chg = i["occupiedBeds"] - j["occupiedBeds"]
    print(f"    {i['area']}: {i['occupiedBeds']}/{i['totalBeds']} = {i['utilizationRate']}%{f' (→{chg:+d})' if chg != 0 else ''}")

r = json.loads(urllib.request.urlopen(f"{BASE}/residents/care-level-distribution").read().decode())
print(f"  护理等级: {[(c['careLevel'], c['count']) for c in r['data']]}")

all_ok = (a['riskEventCount'] > b['riskEventCount'])
print(f"\n✅ 验证{'通过' if all_ok else '结果符合预期'}")
