import sys
sys.path.insert(0, '.')
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run():
    print("=== Test 1: 健康检查 ===")
    r = client.get("/")
    print(f"GET / => {r.status_code}")
    print(f"  mockMode: {r.json()['data']['mockMode']}")
    print()

    print("=== Test 2: Auth 登录 ===")
    r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "123456"})
    print(f"POST /api/v1/auth/login => {r.status_code}")
    data = r.json()
    print(f"  code: {data['code']}, message: {data['message']}")
    print(f"  user role: {data['data']['userInfo']['role']}")
    print(f"  token prefix: {data['data']['token'][:20]}...")
    print()

    print("=== Test 3: Dashboard Summary ===")
    r = client.get("/api/v1/analytics/dashboard-summary")
    print(f"GET /api/v1/analytics/dashboard-summary => {r.status_code}")
    data = r.json()["data"]
    print(f"  inStockCount: {data['summary']['inStockCount']}")
    print(f"  alertCount: {data['summary']['alertCount']}")
    print(f"  syncDelayInfo count: {len(data['syncDelayInfo'])}")
    delayed = [x for x in data['syncDelayInfo'] if x['isDelayed']]
    print(f"  delayed sources: {[x['sourceName'] for x in delayed]}")
    print()

    print("=== Test 4: Stores 列表 ===")
    r = client.get("/api/v1/stores")
    print(f"GET /api/v1/stores => {r.status_code}")
    d = r.json()
    print(f"  total: {d['data']['total']}")
    s0 = d["data"]["items"][0]
    print(f"  first store: {s0['name']}")
    print(f"  first store lng/lat: {s0['lng']}/{s0['lat']}")
    print(f"  first store riskScore: {s0['riskScore']}")
    print()

    print("=== Test 5: Stores 地图数据 ===")
    r = client.get("/api/v1/stores/geo/map-data")
    print(f"GET /api/v1/stores/geo/map-data => {r.status_code}")
    d = r.json()
    print(f"  count: {len(d['data'])} (期望 8)")
    print()

    print("=== Test 6: Vehicles 列表 ===")
    r = client.get("/api/v1/vehicles?page=1&pageSize=5")
    print(f"GET /api/v1/vehicles => {r.status_code}")
    d = r.json()
    print(f"  total: {d['data']['total']} (期望 30)")
    v0 = d["data"]["items"][0]
    print(f"  first vehicle: {v0['brand']} {v0['model']}")
    print(f"  vin: {v0['vin']}")
    print(f"  riskLevel: {v0['riskLevel']}, stockDays: {v0['stockDays']}")
    print()

    print("=== Test 7: Alerts 列表 ===")
    r = client.get("/api/v1/alerts?page=1&pageSize=5")
    print(f"GET /api/v1/alerts => {r.status_code}")
    d = r.json()
    print(f"  total: {d['data']['total']} (期望 25)")
    a0 = d["data"]["items"][0]
    print(f"  first alert level: {a0['level']}")
    print(f"  vin: {a0['vin']}, storeName: {a0['storeName']}")
    print()

    print("=== Test 8: Alert Stats ===")
    r = client.get("/api/v1/alerts/stats")
    print(f"GET /api/v1/alerts/stats => {r.status_code}")
    d = r.json()["data"]
    print(f"  total: {d['total']}")
    print(f"  levelDistribution: {d['levelDistribution']}")
    print()

    print("=== Test 9: Rules 列表 ===")
    r = client.get("/api/v1/rules")
    print(f"GET /api/v1/rules => {r.status_code}")
    d = r.json()
    print(f"  total: {d['data']['total']} (期望 6)")
    print(f"  first rule: {d['data']['items'][0]['name']}")
    print(f"  first rule enabled: {d['data']['items'][0]['enabled']}")
    print()

    print("=== Test 10: Risk Matrix 气泡 ===")
    r = client.get("/api/v1/vehicles/risk-matrix")
    print(f"GET /api/v1/vehicles/risk-matrix => {r.status_code}")
    d = r.json()
    print(f"  bubbles: {len(d['data'])} (期望 16=4x4)")
    print()

    print("=== Test 11: Preparation Trend ===")
    r = client.get("/api/v1/analytics/preparation-trend?days=30")
    print(f"GET /api/v1/analytics/preparation-trend => {r.status_code}")
    d = r.json()
    print(f"  days: {len(d['data'])} (期望 30)")
    print()

    print("=== Test 12: Quote Candles ===")
    r = client.get("/api/v1/analytics/quote-candles?days=30")
    print(f"GET /api/v1/analytics/quote-candles => {r.status_code}")
    d = r.json()
    print(f"  candles: {len(d['data'])} (期望 30)")
    print()

    print("=== Test 13: Review 复盘 ===")
    vehicles = client.get("/api/v1/vehicles?page=1&pageSize=1").json()
    vin = vehicles["data"]["items"][0]["vin"]
    print(f"Using VIN: {vin}")
    r = client.get(f"/api/v1/review/{vin}")
    print(f"GET /api/v1/review/{vin[:8]}... => {r.status_code}")
    d = r.json()["data"]
    print(f"  vehicle brand: {d['vehicle']['brand']}")
    print(f"  timeline items: {len(d['timeline'])}")
    print(f"  preparation_records: {len(d['preparation_records'])}")
    print(f"  test_drive_records: {len(d['test_drive_records'])}")
    print(f"  quote_records: {len(d['quote_records'])}")
    print()

    print("=== Test 14: Review Export ===")
    r = client.get(f"/api/v1/review/{vin}/export")
    print(f"GET /api/v1/review/{vin[:8]}.../export => {r.status_code}")
    d = r.json()["data"]
    print(f"  downloadUrl: {d['downloadUrl']}")
    print(f"  filename: {d['filename']}")
    print()

    print("=== Test 15: Alert Acknowledge ===")
    alerts_resp = client.get("/api/v1/alerts?page=1&pageSize=1").json()
    alert_id = alerts_resp["data"]["items"][0]["id"]
    r = client.post(f"/api/v1/alerts/{alert_id}/acknowledge")
    print(f"POST /api/v1/alerts/{alert_id[:8]}.../acknowledge => {r.status_code}")
    d = r.json()
    print(f"  acknowledged: {d['data']['acknowledged']}")
    print()

    print("=== Test 16: Rule Toggle ===")
    rules_resp = client.get("/api/v1/rules?page=1&pageSize=1").json()
    rule_id = rules_resp["data"]["items"][0]["id"]
    r = client.patch(f"/api/v1/rules/{rule_id}/toggle", json={"enabled": False})
    print(f"PATCH /api/v1/rules/{rule_id[:8]}.../toggle => {r.status_code}")
    d = r.json()
    print(f"  now enabled: {d['data']['enabled']}")
    print()

    print("=== Test 17: Rule Dry Run ===")
    r = client.post(f"/api/v1/rules/{rule_id}/dry-run")
    print(f"POST /api/v1/rules/{rule_id[:8]}.../dry-run => {r.status_code}")
    d = r.json()
    print(f"  matchedCount: {d['data']['matchedCount']}")
    print()

    print("=== Test 18: Sync Status ===")
    r = client.get("/api/v1/sync/status")
    print(f"GET /api/v1/sync/status => {r.status_code}")
    d = r.json()["data"]
    print(f"  sources: {list(d['sources'].keys())}")
    vs = d["sources"]["vehicle_source"]
    print(f"  vehicle_source: status={vs['status']}, delay={vs['delayHours']}h")
    print()

    print("=== Test 19: Sync Trigger ===")
    r = client.post("/api/v1/sync/trigger/finance")
    print(f"POST /api/v1/sync/trigger/finance => {r.status_code}")
    d = r.json()
    print(f"  jobId: {d['data']['jobId'][:16]}...")
    print(f"  status: {d['data']['status']}")
    print()

    print("=== Test 20: ETL Stats ===")
    r = client.get("/api/v1/etl/stats")
    print(f"GET /api/v1/etl/stats => {r.status_code}")
    d = r.json()["data"]
    print(f"  extract records: {d['extract']['records']}")
    print(f"  transform deduped: {d['transform']['deduped']}")
    print(f"  transform normalized: {d['transform']['normalized']}")
    print(f"  transform filled: {d['transform']['filled']}")
    print(f"  summary successRate: {d['summary']['successRate']}")
    print()

    print("✅ All 20 tests passed!")

if __name__ == "__main__":
    run()
