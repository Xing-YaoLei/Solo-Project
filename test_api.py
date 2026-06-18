#!/usr/bin/env python3
import requests
import json

BASE = 'http://localhost:8000/api'

# 登录
def login(username='zhangsan', password='123456'):
    r = requests.post(f'{BASE}/auth/login/', json={'username': username, 'password': password})
    r.raise_for_status()
    data = r.json()
    print(f"[Login] {username}: token={data['access'][:20]}..., user_id={data['user_id']}, role={data['role']}")
    return data['access']

def auth(token):
    return {'Authorization': f'Bearer {token}'}

# Test 1: 新建记录 - 专员 (zhangsan)
print("\n=== Test 1: Create Record (specialist) ===")
token_zs = login('zhangsan')
r = requests.post(f'{BASE}/transfer-records/', headers=auth(token_zs), json={
    'contract_no': 'AUTO-ZS-001',
    'buyer_name': '张三客户',
    'buyer_id_no': '110101199001011234',
    'seller_name': '李卖家',
    'seller_id_no': '110101198501015678',
    'transfer_tax': 5000,
})
print(f"Status: {r.status_code}")
data = r.json()
print(f"Response keys: {list(data.keys())}")
print(f"  id={data.get('id')}")
print(f"  assignee={data.get('assignee')}")
record_id_zs = data['id']

# Test 2: 新建记录 - 经理 (wangwu) 指定 assignee=lisi
print("\n=== Test 2: Create Record (manager, specify assignee) ===")
token_ww = login('wangwu', '123456')
r = requests.post(f'{BASE}/transfer-records/', headers=auth(token_ww), json={
    'contract_no': 'AUTO-WW-001',
    'buyer_name': '王五客户',
    'buyer_id_no': '110101199001018888',
    'seller_name': '赵卖家',
    'seller_id_no': '110101198501016666',
    'transfer_tax': 6600,
    'assignee': 2,  # lisi
})
print(f"Status: {r.status_code}")
data = r.json()
print(f"  assignee={data.get('assignee')}")
record_id_ww = data['id']

# Test 3: 添加异常项
print("\n=== Test 3: Add Exception Items ===")
for missing in ['buyer_id', 'license']:
    r = requests.post(f'{BASE}/transfer-records/{record_id_zs}/mark_exception/', headers=auth(token_zs), json={
        'missing_type': missing, 'urgency': 'high'
    })
    print(f"  {missing}: {r.status_code} - {r.json()}")

# Test 4: 列表 exception_count
print("\n=== Test 4: List Records (check exception_count) ===")
r = requests.get(f'{BASE}/transfer-records/?page_size=20', headers=auth(token_zs))
for rec in r.json()['results']:
    print(f"  {rec['contract_no']}: id={rec['id'][:8]}... exc_count={rec.get('exception_count')} assignee={rec.get('assignee', {}).get('username') if rec.get('assignee') else None}")

# Test 5: Dashboard stats
print("\n=== Test 5: Dashboard Stats ===")
r = requests.get(f'{BASE}/dashboard/stats/', headers=auth(token_zs))
print(f"  [zhangsan-specialist]: {r.json()}")
r = requests.get(f'{BASE}/dashboard/stats/', headers=auth(token_ww))
print(f"  [wangwu-manager]: {r.json()}")

# Test 6: Exceptions list - check record_id and record fields
print("\n=== Test 6: Exception Items (record_id & record) ===")
r = requests.get(f'{BASE}/exception-items/?page_size=20', headers=auth(token_zs))
for ex in r.json()['results']:
    print(f"  id={ex['id'][:8]} missing={ex['missing_type']}")
    print(f"    record_id (direct field): {ex.get('record_id')}")
    print(f"    record (nested): {ex.get('record')}")
    rid = ex.get('record', {}).get('id') if ex.get('record') else None
    rid2 = ex.get('record_id')
    print(f"    Workspace nav would go to: /workspace/{rid or rid2}")

# Test 7: 获取某条记录详情 - 跳转工作台
print("\n=== Test 7: Fetch Record Detail ===")
r = requests.get(f'{BASE}/transfer-records/{record_id_zs}/', headers=auth(token_zs))
data = r.json()
print(f"  {data['contract_no']}: exception_items count={len(data.get('exception_items', []))}")
for ex in data.get('exception_items', []):
    print(f"    - {ex['missing_type']} status={ex['status']}")

print("\n[All tests completed]")
