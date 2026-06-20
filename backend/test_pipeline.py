import requests
import time
import os
import sys

BASE = "http://localhost:8000"

print("=== 1. 测试 pipeline/status API ===")
r = requests.get(BASE + "/api/pipeline/status")
status_data = r.json()["data"]
print(f"  返回 {len(status_data)} 个任务状态")
for s in status_data:
    print(f"    - {s['task_code']}: {s['status']} (最后同步: {s['last_sync_count']}条)")

print("\n=== 2. 测试 pipeline/sync/REG_SYNC (报名表同步) ===")
r2 = requests.post(BASE + "/api/pipeline/sync/REG_SYNC")
if r2.status_code == 200:
    data = r2.json()
    print(f"  code: {data['code']}, msg: {data['message']}")
    logs = data["data"]
    print(f"  返回 {len(logs)} 条同步日志")
    for log in logs[:3]:
        print(f"    [{log['level']}] {log['message']}")
else:
    print(f"  错误: {r2.status_code} - {r2.text}")

time.sleep(1)

print("\n=== 3. 测试 pipeline/sync/PAY_SYNC (支付流水同步) ===")
r3 = requests.post(BASE + "/api/pipeline/sync/PAY_SYNC")
if r3.status_code == 200:
    data = r3.json()
    print(f"  code: {data['code']}, msg: {data['message']}")
    logs = data["data"]
    print(f"  返回 {len(logs)} 条同步日志")
else:
    print(f"  错误: {r3.status_code} - {r3.text}")

time.sleep(1)

print("\n=== 4. 测试 pipeline/sync/GATE_SYNC (闸机记录同步) ===")
r4 = requests.post(BASE + "/api/pipeline/sync/GATE_SYNC")
if r4.status_code == 200:
    data = r4.json()
    print(f"  code: {data['code']}, msg: {data['message']}")
    logs = data["data"]
    print(f"  返回 {len(logs)} 条同步日志")
else:
    print(f"  错误: {r4.status_code} - {r4.text}")

print("\n=== 5. 测试错误的 task_code ===")
r5 = requests.post(BASE + "/api/pipeline/sync/WRONG_CODE")
print(f"  状态码: {r5.status_code} (应为 400)")
print(f"  错误信息: {r5.json().get('detail', '')[:80]}")

print("\n=== 6. 同步后状态检查 ===")
r6 = requests.get(BASE + "/api/pipeline/status")
status_data = r6.json()["data"]
for s in status_data:
    print(f"    - {s['task_code']}: {s['status']}")

print("\n✅ 同步 API 验证完成")

# 7. 如果有 DATABASE_URL，测试 PG 双写
if os.environ.get("DATABASE_URL"):
    print("\n=== 7. PostgreSQL 双写验证（需要配置 DATABASE_URL）===")
    print(f"  DATABASE_URL 已配置: {os.environ['DATABASE_URL'].split('@')[-1][:30]}...")

    try:
        import sqlalchemy
        from sqlalchemy import create_engine, text

        engine = create_engine(os.environ["DATABASE_URL"])
        with engine.connect() as conn:
            tables = ["registrations", "payments", "gate_records", "sync_logs"]
            for t in tables:
                try:
                    cnt = conn.execute(text(f"SELECT COUNT(*) FROM {t}")).fetchone()[0]
                    print(f"    {t}: {cnt} 条")
                except Exception as e:
                    print(f"    {t}: 表不存在或查询失败 - {e}")
        print("  ✅ PostgreSQL 双写验证完成")
    except Exception as e:
        print(f"  ❌ PostgreSQL 连接失败: {e}")
else:
    print("\n=== 7. PostgreSQL 双写验证 ===")
    print("  ℹ️  未配置 DATABASE_URL，跳过 PostgreSQL 验证")
    print("  配置示例: export DATABASE_URL=postgresql://user:pass@localhost:5432/dbname")
    print("  配置后重启后端即可自动建表并启用双写")
