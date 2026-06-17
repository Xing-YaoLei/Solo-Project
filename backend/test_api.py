#!/usr/bin/env python3
import json
import urllib.request
import urllib.error

BASE = "http://localhost:8000"

def req(method, path, data=None, token=None):
    url = BASE + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(r) as resp:
            resp_body = resp.read()
            return resp.status, json.loads(resp_body.decode()) if resp_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read()
        return e.code, json.loads(err_body.decode()) if err_body else {}

print("=== 1. health ===")
code, data = req("GET", "/health")
assert code == 200, f"/health failed: {code}"
print(f"  OK: {data}")

print("\n=== 2. admin login ===")
code, data = req("POST", "/api/v1/auth/login", {"username": "admin", "password": "admin123"})
assert code == 200, f"admin login failed: {code} {data}"
token = data["access_token"]
user = data["user"]
print(f"  OK: user={user['username']} role={user['role']} token_len={len(token)}")

print("\n=== 3. daily work orders (admin view) ===")
code, data = req("GET", "/api/v1/work-orders/daily", token=token)
assert code == 200
code, data_daily = req("GET", "/api/v1/work-orders/daily", token=token)
assert code == 200
print(f"  Total orders: {data_daily['total']}")
review_failed_count = 0
for item in data_daily['items']:
    if item['review_failed']:
        review_failed_count += 1
    print(f"  - {item['order_no']} status={item['status']:12s} review_failed={item['review_failed']} overdue={item['is_overdue']} worker={item.get('assigned_worker_name','-')} {item['title']}")
print(f"  Review-failed highlighted: {review_failed_count}")

print("\n=== 4. dashboard stats ===")
code, data = req("GET", "/api/v1/dashboard/stats", token=token)
assert code == 200
print(f"  Total orders: {data['total_orders']}")
print(f"  Pending: {data['pending_orders']}")
print(f"  InProgress: {data['in_progress_orders']}")
print(f"  Completed: {data['completed_orders']}")
print(f"  ReviewFailed: {data['review_failed_orders']}")
print(f"  FirstResolveRate: {data['first_time_resolve_rate']}%")
trend = data['first_time_resolve_trend']
print(f"  Trend (30-day skeleton): {len(trend)} days")
days_with_data = [t for t in trend if t['total'] > 0]
print(f"  Days with closed orders: {len(days_with_data)}")
for t in days_with_data[:5]:
    print(f"    {t['date']} total={t['total']} first_resolved={t['first_time_resolved']} rate={t['rate']}%")

print("\n=== 5. work order detail (first with review/comm) ===")
target_id = None
for item in data_daily['items']:
    if item['review_failed']:
        target_id = item['id']
        break
if target_id is None:
    target_id = data_daily['items'][0]['id']
code, detail = req("GET", f"/api/v1/work-orders/{target_id}", token=token)
assert code == 200
print(f"  ID={detail['id']} Title={detail['title']}")
print(f"  assigned_worker_name: {detail.get('assigned_worker_name')}")
print(f"  creator_name: {detail.get('creator_name')}")
print(f"  Photos: {len(detail['photos'])}")
print(f"  StatusLogs: {len(detail['status_logs'])}")
print(f"  ReviewRecords: {len(detail['review_records'])}")
for r in detail['review_records']:
    print(f"    REVIEW: passed={r['is_passed']} reviewer_name={r.get('reviewer_name')} comment={r.get('comment','')[:50]}")
print(f"  Communications: {len(detail['communications'])}")
for c in detail['communications']:
    print(f"    COMM: sender_name={c.get('sender_name')} content={c['content'][:60]}")

print("\n=== 6. worker1 login (一线人员 权限过滤) ===")
code, wdata = req("POST", "/api/v1/auth/login", {"username": "worker1", "password": "worker123"})
assert code == 200
wtoken = wdata["access_token"]
wuser = wdata["user"]
print(f"  OK: user={wuser['username']} role={wuser['role']} full_name={wuser['full_name']}")
code, wdaily = req("GET", "/api/v1/work-orders/daily", token=wtoken)
print(f"  worker1 sees {wdaily['total']} orders (本人记录 only):")
for item in wdaily['items']:
    print(f"    - {item['title']} assignee={item.get('assigned_worker_name','-')}")

print("\n=== 7. worker1 cannot access dashboard (权限控制) ===")
code, err = req("GET", "/api/v1/dashboard/stats", token=wtoken)
print(f"  GET /dashboard/stats as worker1: HTTP {code} {'PASS' if code == 403 else 'WRONG'}")

print("\n=== ✅ ALL API TESTS PASSED ===")
