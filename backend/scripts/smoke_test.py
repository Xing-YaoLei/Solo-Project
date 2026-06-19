import urllib.request, urllib.parse, json
from datetime import date, timedelta

def api(method, path, params=None, data=None, headers=None):
    if params:
        path = path + '?' + urllib.parse.urlencode(params)
    url = 'http://localhost:8000' + path
    req = urllib.request.Request(url, method=method, headers=headers or {})
    if data:
        req.add_header('Content-Type', 'application/json')
        req.data = json.dumps(data).encode()
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode()
            return resp.status, json.loads(body) if body else None
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode()) if e.fp else str(e)

today = date.today()
checkin = (today + timedelta(days=7)).isoformat()
checkout = (today + timedelta(days=9)).isoformat()

print('1️⃣  套餐列表')
code, d = api('GET', '/api/v1/packages')
print(f'   → {code} packages={d["total"]}')

print('2️⃣  订单列表（无筛选）')
code, d = api('GET', '/api/v1/orders')
print(f'   → {code} orders={d["total"]} 每条是否含verification+deposit:')
for o in d['items'][:2]:
    has_v = 'verification' in o and o['verification'] is not None
    has_d = 'deposit' in o and o['deposit'] is not None
    print(f'     #{o["id"]} {o["order_no"]} verification={has_v} deposit={has_d}')

print('3️⃣  订单筛选 verification_status=pending')
code, d = api('GET', '/api/v1/orders', {'verification_status': 'pending', 'page_size': 5})
print(f'   → {code} total={d["total"]}')
assert code == 200, f'422? code={code}'
print(f'   ✅ 422 修复')

print('4️⃣  订单筛选 verification_status=verified')
code, d = api('GET', '/api/v1/orders', {'verification_status': 'verified', 'page_size': 5})
print(f'   → {code} total={d["total"]}')
assert code == 200

print('5️⃣  订单筛选 deposit_status=unpaid')
code, d = api('GET', '/api/v1/orders', {'deposit_status': 'unpaid', 'page_size': 5})
print(f'   → {code} total={d["total"]}')
assert code == 200

print('6️⃣  订单筛选 deposit_status=paid')
code, d = api('GET', '/api/v1/orders', {'deposit_status': 'paid', 'page_size': 5})
print(f'   → {code} total={d["total"]}')
assert code == 200

print('7️⃣  订单筛选 deposit_status=refunded')
code, d = api('GET', '/api/v1/orders', {'deposit_status': 'refunded', 'page_size': 5})
print(f'   → {code} total={d["total"]}')
assert code == 200

print('8️⃣  订单详情 /orders/{id}')
oid = d['items'][0]['id'] if d['items'] else 1
code, d = api('GET', f'/api/v1/orders/{oid}')
print(f'   → {code} verification={d["verification"] is not None} deposit={d["deposit"] is not None} status_logs={len(d.get("status_logs", []))}')
assert code == 200

print('9️⃣  订单状态日志')
code, d = api('GET', f'/api/v1/orders/{oid}/status-logs')
print(f'   → {code} count={len(d)}')
assert code == 200

print('🔟  库存检查 avail')
pkgs = api('GET', '/api/v1/packages')[1]
pid = pkgs['items'][0]['id']
code, d = api('GET', '/api/v1/inventories/check', {'package_id': pid, 'check_in': checkin, 'check_out': checkout})
print(f'   → {code} available={d["available"]}')
assert code == 200

print('1️⃣1️⃣  价格计算')
code, d = api('GET', '/api/v1/price-rules/calculate', {'package_id': pid, 'check_in': checkin, 'check_out': checkout})
print(f'   → {code} total={d["total"]:.0f}')
assert code == 200

print('1️⃣2️⃣  异常单列表')
code, d = api('GET', '/api/v1/anomalies')
print(f'   → {code} total={d["total"]}')
assert code == 200

print('1️⃣3️⃣  转化率分析')
ps = date(today.year, today.month, 1).isoformat()
pe = date(today.year, today.month + 1, 1).isoformat()
code, d = api('GET', '/api/v1/analytics/conversion', {'period_start': ps, 'period_end': pe})
print(f'   → {code} total_orders={d["total_orders"]} overall_rate={d["overall_conversion_rate"]}%')
assert code == 200

print('1️⃣4️⃣  健康检查')
code, d = api('GET', '/health')
print(f'   → {code} status={d["status"]} db={d["database"]}')
assert code == 200

print()
print('=' * 50)
print('✅✅✅ 全部 14 个接口冒烟测试通过！')
print('=' * 50)
