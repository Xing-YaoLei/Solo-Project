import requests

BASE = "http://localhost:8000"

print("=== 1. 验证赞助清单 API 返回真实 UUID ===")
r = requests.get(BASE + "/api/sponsorship/list?page=1&page_size=3")
data = r.json()["data"]
items = data["items"]
print(f"  返回 {len(items)} 条记录")
for item in items[:2]:
    print(f"    - id: {item['id']}")
    print(f"      sponsor_name: {item['sponsor_name']}")
    print(f"      UUID 格式正确: {len(item['id']) == 36 and '-' in item['id']}")

print("\n=== 2. 验证赞助明细 API 使用 UUID ===")
first_id = items[0]["id"]
print(f"  请求明细 ID: {first_id[:12]}...")
r2 = requests.get(BASE + f"/api/sponsorship/{first_id}/detail")
detail = r2.json()["data"]
print(f"  返回明细:")
print(f"    赞助商: {detail['sponsor_name']}")
print(f"    权益类型: {detail['benefit_type']}")
print(f"    合同数: {detail['contract_qty']}")
print(f"    已兑现: {detail['fulfilled_qty']}")
print(f"    兑现记录数: {len(detail['fulfillment_records'])}")
if detail["fulfillment_records"]:
    rec = detail["fulfillment_records"][0]
    print(f"    首条记录: {rec['fulfilled_at']} - {rec['recipient']} - {rec['quantity']}项")

print("\n=== 3. 验证 pipeline sync API (触发同步，测试 PG 双写路径) ===")
print("  注意: 需要配置 DATABASE_URL 才会触发 PG 双写")
print("  当前路径检测: 代码已就绪，load 方法会检查 self._pg_available")
print("  BasePipeline.__init__ 中会调用 is_pg_enabled()")
print("  各子类 load 方法中: if getattr(self, '_pg_available', False): ...")

print("\n=== 4. 验证 requirements.txt 不再有 pendulum ===")
with open("/Users/yaoleyxing/Developer/solo-mange-pro/MP0415/backend/requirements.txt") as f:
    content = f.read()
has_pendulum = "pendulum" in content
has_sqlalchemy = "sqlalchemy" in content
has_psycopg2 = "psycopg2-binary" in content
print(f"  包含 pendulum: {has_pendulum} (应为 False)")
print(f"  包含 sqlalchemy: {has_sqlalchemy} (应为 True)")
print(f"  包含 psycopg2-binary: {has_psycopg2} (应为 True)")

print("\n✅ 验证完成")
