import requests

BASE = "http://localhost:8000"

print("=== 1. GET /api/pipeline/status ===")
r = requests.get(BASE + "/api/pipeline/status")
assert r.status_code == 200, f"HTTP {r.status_code}"
data = r.json()
print(f"code: {data['code']}, msg: {data['message']}")
items = data["data"]
print(f"返回 {len(items)} 个任务:")
for s in items:
    print(f"  - {s['task_code']}: status={s['status']}, count={s['last_sync_count']}, delay={s['delay_seconds']}s")
assert len(items) == 3, f"应返回 3 个任务，实际 {len(items)}"
codes = [s["task_code"] for s in items]
assert "REG_SYNC" in codes, "缺少 REG_SYNC"
assert "PAY_SYNC" in codes, "缺少 PAY_SYNC"
assert "GATE_SYNC" in codes, "缺少 GATE_SYNC"
print("✅ 3 个任务编码正确")

print()
print("=== 2. POST /api/pipeline/sync/GATE_SYNC (闸机记录同步) ===")
r2 = requests.post(BASE + "/api/pipeline/sync/GATE_SYNC")
assert r2.status_code == 200, f"HTTP {r2.status_code}: {r2.text}"
data2 = r2.json()
print(f"code: {data2['code']}, msg: {data2['message']}")
logs = data2["data"]
print(f"返回 {len(logs)} 条同步日志")
for log in logs[:4]:
    print(f"  [{log['level']}] {log['message']}")
print("✅ GATE_SYNC 同步成功")

print()
print("=== 3. POST /api/pipeline/sync/PAY_SYNC (支付流水同步) ===")
r3 = requests.post(BASE + "/api/pipeline/sync/PAY_SYNC")
assert r3.status_code == 200, f"HTTP {r3.status_code}: {r3.text}"
data3 = r3.json()
print(f"code: {data3['code']}, msg: {data3['message']}")
print(f"返回 {len(data3['data'])} 条同步日志")
print("✅ PAY_SYNC 同步成功")

print()
print("=== 4. 同步后状态检查 ===")
r4 = requests.get(BASE + "/api/pipeline/status")
items4 = r4.json()["data"]
for s in items4:
    print(f"  {s['task_code']}: {s['status']}, last_count={s['last_sync_count']}")
print("✅ 全部验证通过！")
