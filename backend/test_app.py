from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("=== Testing Health Check ===")
resp = client.get("/")
print(f"GET /: {resp.status_code} - {resp.json()}")
assert resp.status_code == 200

resp = client.get("/health")
print(f"GET /health: {resp.status_code} - {resp.json()}")
assert resp.status_code == 200

print()
print("=== Testing KPI APIs ===")
resp = client.get("/api/kpi/overview")
print(f"GET /api/kpi/overview: {resp.status_code}")
assert resp.status_code == 200
data = resp.json()
print(f"  code={data['code']}, message={data['message']}")
print(f"  data keys: {list(data['data'].keys()) if data['data'] else None}")
assert data["code"] == 0

resp = client.get("/api/kpi/trend?days=7")
print(f"GET /api/kpi/trend: {resp.status_code}")
assert resp.status_code == 200
data = resp.json()
print(f"  code={data['code']}, data length: {len(data['data']) if data['data'] else 0}")
assert data["code"] == 0

print()
print("=== Testing Pipeline APIs ===")
resp = client.get("/api/pipeline/status")
print(f"GET /api/pipeline/status: {resp.status_code}")
assert resp.status_code == 200
data = resp.json()
print(f"  code={data['code']}, data length: {len(data['data']) if data['data'] else 0}")
assert data["code"] == 0

resp = client.get("/api/pipeline/logs?page=1&page_size=5")
print(f"GET /api/pipeline/logs: {resp.status_code}")
assert resp.status_code == 200
data = resp.json()
print(f"  code={data['code']}, total: {data['data']['page_info']['total'] if data['data'] else 0}")
assert data["code"] == 0

print()
print("=== Testing Seatmap APIs ===")
resp = client.get("/api/seatmap/heatmap?period=current&compare=mom")
print(f"GET /api/seatmap/heatmap: {resp.status_code}")
assert resp.status_code == 200
data = resp.json()
print(f"  code={data['code']}, areas: {len(data['data']) if data['data'] else 0}")
assert data["code"] == 0

resp = client.get("/api/seatmap/checkin-trend?period=14")
print(f"GET /api/seatmap/checkin-trend: {resp.status_code}")
assert resp.status_code == 200
data = resp.json()
print(f"  code={data['code']}, points: {len(data['data']) if data['data'] else 0}")
assert data["code"] == 0

print()
print("=== Testing Sponsorship APIs ===")
resp = client.get("/api/sponsorship/list?page=1&page_size=5")
print(f"GET /api/sponsorship/list: {resp.status_code}")
assert resp.status_code == 200
data = resp.json()
print(f"  code={data['code']}, total: {data['data']['page_info']['total'] if data['data'] else 0}")
assert data["code"] == 0

items = data["data"]["items"] if data["data"] else []
if items:
    benefit_id = items[0]["id"]
    resp = client.get(f"/api/sponsorship/{benefit_id}/detail")
    print(f"GET /api/sponsorship/{benefit_id}/detail: {resp.status_code}")
    assert resp.status_code == 200
    detail = resp.json()
    print(f"  code={detail['code']}, sponsor: {detail['data']['sponsor_name'] if detail['data'] else None}")
    assert detail["code"] == 0

print()
print("=== Testing Verification APIs ===")
resp = client.get("/api/verification/efficiency?group=gate")
print(f"GET /api/verification/efficiency: {resp.status_code}")
assert resp.status_code == 200
data = resp.json()
print(f"  code={data['code']}, gates: {len(data['data']) if data['data'] else 0}")
assert data["code"] == 0

resp = client.get("/api/verification/date-trend")
print(f"GET /api/verification/date-trend: {resp.status_code}")
assert resp.status_code == 200
data = resp.json()
print(f"  code={data['code']}, points: {len(data['data']) if data['data'] else 0}")
assert data["code"] == 0

resp = client.get("/api/verification/area-compare")
print(f"GET /api/verification/area-compare: {resp.status_code}")
assert resp.status_code == 200
data = resp.json()
print(f"  code={data['code']}, areas: {len(data['data']) if data['data'] else 0}")
assert data["code"] == 0

resp = client.get("/api/verification/definition")
print(f"GET /api/verification/definition: {resp.status_code}")
assert resp.status_code == 200
data = resp.json()
print(f"  code={data['code']}")
assert data["code"] == 0

print()
print("=== Testing Ticket APIs ===")
resp = client.get("/api/ticket/rank?metric=absolute&top=5")
print(f"GET /api/ticket/rank: {resp.status_code}")
assert resp.status_code == 200
data = resp.json()
print(f"  code={data['code']}, rank items: {len(data['data']) if data['data'] else 0}")
assert data["code"] == 0

print()
print("=== Testing Refund APIs ===")
resp = client.get("/api/refund/distribution")
print(f"GET /api/refund/distribution: {resp.status_code}")
assert resp.status_code == 200
data = resp.json()
print(f"  code={data['code']}, points: {len(data['data']) if data['data'] else 0}")
assert data["code"] == 0

distribution = data["data"] if data["data"] else []
disputed_ids = []
for pt in distribution:
    disputed_ids.extend(pt.get("disputed_points", []))

if disputed_ids:
    sample_id = disputed_ids[0]
    resp = client.get(f"/api/refund/{sample_id}/sample")
    print(f"GET /api/refund/{sample_id}/sample: {resp.status_code}")
    assert resp.status_code == 200
    sample = resp.json()
    print(f"  code={sample['code']}, registrant: {sample['data']['registrant_name'] if sample['data'] else None}")
    assert sample["code"] == 0

print()
print("=== Testing Pipeline Sync (POST) ===")
resp = client.post("/api/pipeline/sync/REG_SYNC")
print(f"POST /api/pipeline/sync/REG_SYNC: {resp.status_code}")
assert resp.status_code == 200
data = resp.json()
print(f"  code={data['code']}, message={data['message']}")
print(f"  logs generated: {len(data['data']) if data['data'] else 0}")
assert data["code"] == 0

print()
print("=" * 50)
print("ALL TESTS PASSED!")
print("=" * 50)
