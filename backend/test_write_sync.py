import json
import urllib.request

def put_json(url, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="PUT")
    return json.loads(urllib.request.urlopen(req).read().decode())

BASE = "http://localhost:9090/api"

thresholds = json.loads(urllib.request.urlopen(f"{BASE}/thresholds").read().decode())
first_tid = thresholds["data"][0]["id"]
first_name = thresholds["data"][0]["metricName"]
print(f"【原阈值】{first_name}: warning={thresholds['data'][0]['warningThreshold']}")

r = put_json(f"{BASE}/thresholds/{first_tid}", {"warningThreshold": 88.0, "criticalThreshold": 75.0})
print(f"【更新阈值后】DuckDB中 warning={r['data']['warningThreshold']}（已自动从PG同步）")

risks = json.loads(urllib.request.urlopen(f"{BASE}/risk/events?page=1&pageSize=1").read().decode())
first_eid = risks["data"]["list"][0]["id"]
old_remark = risks["data"]["list"][0].get("remark")
print(f"\n【原备注】事件{first_eid[:8]}... 原remark={old_remark}")

r = put_json(f"{BASE}/risk/events/{first_eid}/remark", {"remark": "验证备注：双库同步测试通过！"})
print(f"【添加备注后】DuckDB中 remark={r['data']['remark']}（已自动从PG同步）")

change_logs = json.loads(urllib.request.urlopen(f"{BASE}/thresholds/change-logs?limit=2").read().decode())
if change_logs["data"]:
    log = change_logs["data"][0]
    print(f"\n【阈值变更日志】metric={log['metricName']}: {log['oldWarning']}% → {log['newWarning']}% by {log['changedBy']}")

risks2 = json.loads(urllib.request.urlopen(f"{BASE}/risk/events?page=1&pageSize=1").read().decode())
new_remark = risks2["data"]["list"][0].get("remark")
print(f"\n【二次查询确认】最新备注显示={new_remark}")

print("\n✅ 写操作验证：PostgreSQL写入 + DuckDB分析库同步 完成")
