import urllib.request
import urllib.parse
import json

BASE = "http://localhost:8005"

def req(method, path, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(f"{BASE}{path}", data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(r) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return f"HTTP {e.code}: {e.read().decode()}"

# Login
login = req("POST", "/api/v1/auth/login", {"username": "admin", "password": "admin123"})
print("LOGIN:", "OK" if isinstance(login, dict) and "access_token" in login else login)
token = login["access_token"] if isinstance(login, dict) and "access_token" in login else None

def test(tag, path):
    print(f"\n=== {tag} ===")
    res = req("GET", path, token=token)
    if isinstance(res, dict):
        print(json.dumps(res, ensure_ascii=False, indent=2)[:800])
    else:
        print(res)

test("Dashboard", "/api/v1/analytics/dashboard")
test("Batches page1 size3", "/api/v1/inventory/batches?page=1&page_size=3")
test("Shortage orders", "/api/v1/shortage?page=1&page_size=5")
test("Usage rules", "/api/v1/rules/usage")
test("Thresholds", "/api/v1/rules/thresholds")
test("Safety stock", "/api/v1/inventory/safety")
test("Suppliers", "/api/v1/suppliers?page=1&page_size=5")

# 测试短缺工单详情 + 处理
print("\n=== Shortage detail + handle supplement ===")
shortages = req("GET", "/api/v1/shortage?page=1&page_size=5", token=token)
if isinstance(shortages, dict) and shortages.get("data"):
    first_id = shortages["data"][0]["id"]
    first_status = shortages["data"][0]["status"]
    print(f"First shortage id={first_id}, status={first_status}")
    detail = req("GET", f"/api/v1/shortage/{first_id}", token=token)
    print("Detail keys:", list(detail.keys()) if isinstance(detail, dict) else detail)
    if first_status in ("pending", "processing"):
        res = req("POST", f"/api/v1/shortage/{first_id}/handle", {
            "action": "supplement",
            "remark": "通过真实API测试补录，供应商补货",
            "supplement_quantity": shortages["data"][0]["shortage_quantity"]
        }, token=token)
        print("Supplement result:", json.dumps(res, ensure_ascii=False, indent=2)[:500] if isinstance(res, dict) else res)
    print("\nLogs for the shortage:")
    logs = req("GET", f"/api/v1/shortage/{first_id}", token=token)
    if isinstance(logs, dict) and "action_logs" in logs:
        for l in logs["action_logs"][:5]:
            print(f"  [{l.get('created_at','')[:16]}] {l.get('action')} by {l.get('operator')}: {l.get('remark')}")
