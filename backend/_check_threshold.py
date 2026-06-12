import urllib.request, json

def get_json(url, data=None, method=None):
    req = urllib.request.Request(url, data=data, method=method)
    if data:
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

print("=== 初始状态 offline_warning_days=3 ===")
d = get_json("http://localhost:8000/api/reports/review-material")
off1 = len(d["data"]["offline_equipments"])
warn1 = sum(1 for e in d["data"]["offline_equipments"] if e["is_warning"])
print(f"离线设备总数: {off1}, 命中预警: {warn1}")
print(f"阈值: {d['data']['thresholds_used']}")

print("\n=== 调整 offline_warning_days 从 3 → 10 ===")
body = json.dumps({"config_value": 10}).encode()
d2 = get_json("http://localhost:8000/api/thresholds/offline_warning_days", data=body, method="PUT")
print("更新结果:", d2.get("config_key"), d2.get("config_value"))

print("\n=== 调整后再取复盘材料 ===")
d3 = get_json("http://localhost:8000/api/reports/review-material")
off2 = len(d3["data"]["offline_equipments"])
warn2 = sum(1 for e in d3["data"]["offline_equipments"] if e["is_warning"])
print(f"离线设备总数: {off2}, 命中预警: {warn2}")
print(f"阈值: {d3['data']['thresholds_used']}")
print(f"\n结论：预警阈值从 3→10，命中预警 {warn1} → {warn2}（应该减少，因为门槛变宽了）")

print("\n=== 再把 inspection_pass_rate 从 90% → 98% ===")
body = json.dumps({"config_value": 98}).encode()
get_json("http://localhost:8000/api/thresholds/inspection_pass_rate", data=body, method="PUT")
d4 = get_json("http://localhost:8000/api/reports/review-material")
print(f"problematic_stores: {len(d4['data']['problematic_stores'])} 家")
print(f"阈值: {d4['data']['thresholds_used']}")
print(f"新结论: {d4['data']['review_conclusion']}")

# 恢复
body = json.dumps({"config_value": 3}).encode()
get_json("http://localhost:8000/api/thresholds/offline_warning_days", data=body, method="PUT")
body = json.dumps({"config_value": 90}).encode()
get_json("http://localhost:8000/api/thresholds/inspection_pass_rate", data=body, method="PUT")
print("\n阈值已恢复默认。")
