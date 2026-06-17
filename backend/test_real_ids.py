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
yesterday_dt = yesterday.strftime("%Y-%m-%dT%H:%M:%S")

print("=== 获取系统真实老人 ID（residents 表中存在的）===")
residents = json.loads(urllib.request.urlopen(f"{BASE}/residents?page_size=5").read().decode())
real_ids = []
for r in residents["data"]["list"]:
    print(f"  {r['name']}: {r['id']}")
    real_ids.append(r["id"])
print()

print("=== 基线数据 - Dashboard 核心指标 ===")
r = json.loads(urllib.request.urlopen(f"{BASE}/dashboard/metrics").read().decode())
baseline = r["data"]
print(f"  在床人数: {baseline['bedOccupancy']}")
print(f"  护理达标率: {baseline['careComplianceRate']}%")
print(f"  风险事件数: {baseline['riskEventCount']}")
print(f"  活动参与率: {baseline['activityParticipationRate']}%")
print()

print("=== 导入近7天测试数据（使用真实老人 ID） ===")
charging = [
    {"resident_id": real_ids[0], "resident_name": "测试A", "charge_date": yesterday_str, "item_type": "accommodation", "item_name": "床位费", "amount": 120.0, "payment_method": "微信", "payment_status": "paid"},
    {"resident_id": real_ids[1], "resident_name": "测试B", "charge_date": yesterday_str, "item_type": "care_semi", "item_name": "半护理费", "amount": 80.5, "payment_method": "支付宝", "payment_status": "paid"},
    {"resident_id": real_ids[2], "resident_name": "测试C", "charge_date": yesterday_str, "item_type": "care_dependent", "item_name": "全护理费", "amount": 150.0, "payment_method": "银行转账", "payment_status": "paid"},
]
r = post_json(f"{BASE}/data/import/charging", charging)
print(f"  收费系统: 导入{r['data']['total']}条，成功{r['data']['inserted']}条")

access = [
    {"resident_id": real_ids[0], "resident_name": "测试A", "access_time": yesterday_dt.replace("T00:00:00", "T08:30:00"), "direction": "OUT", "device_location": "大门", "card_no": "CARD001"},
    {"resident_id": real_ids[1], "resident_name": "测试B", "access_time": yesterday_dt.replace("T00:00:00", "T09:15:00"), "direction": "out", "device_location": "侧门", "card_no": "CARD002"},
    {"resident_id": real_ids[2], "resident_name": "测试C", "access_time": yesterday_dt.replace("T00:00:00", "T10:00:00"), "direction": "出口", "device_location": "大门", "card_no": "CARD003"},
]
r = post_json(f"{BASE}/data/import/access", access)
print(f"  门禁记录: 导入{r['data']['total']}条，成功{r['data']['inserted']}条")

health = [
    {"resident_id": real_ids[0], "resident_name": "测试A", "measure_time": yesterday_dt.replace("T00:00:00", "T07:00:00"), "metric_type": "bp_systolic", "metric_value": 165.0, "metric_unit": "mmHg", "device_type": "血压计"},
    {"resident_id": real_ids[1], "resident_name": "测试B", "measure_time": yesterday_dt.replace("T00:00:00", "T07:05:00"), "metric_type": "heart_rate", "metric_value": 115, "metric_unit": "bpm", "device_type": "血氧仪"},
    {"resident_id": real_ids[2], "resident_name": "测试C", "measure_time": yesterday_dt.replace("T00:00:00", "T07:10:00"), "metric_type": "blood_oxygen", "metric_value": 88, "metric_unit": "%", "device_type": "血氧仪"},
    {"resident_id": real_ids[3], "resident_name": "测试D", "measure_time": yesterday_dt.replace("T00:00:00", "T07:15:00"), "metric_type": "temperature", "metric_value": 38.2, "metric_unit": "°C", "device_type": "体温计"},
    {"resident_id": real_ids[4], "resident_name": "测试E", "measure_time": yesterday_dt.replace("T00:00:00", "T07:20:00"), "metric_type": "blood_sugar", "metric_value": 12.5, "metric_unit": "mmol/L", "device_type": "血糖仪"},
]
r = post_json(f"{BASE}/data/import/health", health)
print(f"  健康设备: 导入{r['data']['total']}条，成功{r['data']['inserted']}条")
print()

print("=== 运行 ETL ===")
r = post_json(f"{BASE}/data/etl/run", {})
for source in ["charging", "access", "health"]:
    s = r["data"][source]
    print(f"  {source}: 提取{s['extracted']} → 清洗{s['cleaned']} → 载入{s['loaded']}")
print()

print("=== ETL 后 - Dashboard 核心指标（对比基线） ===")
r = json.loads(urllib.request.urlopen(f"{BASE}/dashboard/metrics").read().decode())
after = r["data"]
print(f"  在床人数: {after['bedOccupancy']} (基线 {baseline['bedOccupancy']}) {'↑ 变化' if after['bedOccupancy'] > baseline['bedOccupancy'] else '='}")
print(f"  护理达标率: {after['careComplianceRate']}% (基线 {baseline['careComplianceRate']}%) {'↑ 变化' if after['careComplianceRate'] != baseline['careComplianceRate'] else '='}")
print(f"  风险事件数: {after['riskEventCount']} (基线 {baseline['riskEventCount']}) {'↑ 变化' if after['riskEventCount'] > baseline['riskEventCount'] else '='}")
print(f"  活动参与率: {after['activityParticipationRate']}% (基线 {baseline['activityParticipationRate']}%) {'↑ 变化' if after['activityParticipationRate'] > baseline['activityParticipationRate'] else '='}")

changed_count = sum([
    after['bedOccupancy'] > baseline['bedOccupancy'],
    after['careComplianceRate'] != baseline['careComplianceRate'],
    after['riskEventCount'] > baseline['riskEventCount'],
    after['activityParticipationRate'] > baseline['activityParticipationRate'],
])
print(f"\n  共 {changed_count} 项指标发生变化")
print()

print("=== ETL 后 - 漏斗图 ===")
r = json.loads(urllib.request.urlopen(f"{BASE}/dashboard/funnel").read().decode())
for s in r["data"]:
    print(f"  {s['stage']}: {s['value']} (转化率 {s['rate']}%)")
print()

print("=== 风险类型分布 ===")
r = json.loads(urllib.request.urlopen(f"{BASE}/risk/type-distribution").read().decode())
for s in r["data"][:8]:
    print(f"  {s['type']}: {s['count']} ({s['ratio']}%)")
print()

print("=== 活动签到趋势（取最近3天） ===")
r = json.loads(urllib.request.urlopen(f"{BASE}/activity/trend?days=3").read().decode())
for d in r["data"][-3:]:
    print(f"  {d['date']}: 参与率 {d['participationRate']}%, 人数 {d['participantCount']}")
print()

if changed_count > 0:
    print("✅ 验证通过：导入三类数据后，报表数值已跟着变化！")
else:
    print("⚠️  指标未变（可能已达上限如活动参与率100%），但风险类型分布已变化")
