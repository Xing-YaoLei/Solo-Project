import requests
import json

# 管理员登录
admin_resp = requests.post('http://localhost:4000/api/auth/login', json={'email': 'admin@rental.com', 'password': 'admin'})
admin_token = admin_resp.json()['accessToken']
admin_headers = {'Authorization': f'Bearer {admin_token}'}

# 租客登录
tenant_resp = requests.post('http://localhost:4000/api/auth/login', json={'email': 'tenant@rental.com', 'password': 'tenant'})
tenant_token = tenant_resp.json()['accessToken']
tenant_headers = {'Authorization': f'Bearer {tenant_token}'}
tenant_user = tenant_resp.json()['user']
print('租客用户:', tenant_user)
print('租客 userId:', tenant_user['id'])

print()
print('=== 真实租客登录 - 任务列表 ===')
resp = requests.get('http://localhost:4000/api/tasks?pageSize=20', headers=tenant_headers)
data = resp.json()
print(f'  Total={data["total"]}')
for t in data['list'][:5]:
    print(f'    - {t["title"]} ({t["type"]})')

print()
print('=== 管理员切租客视图 - 任务列表 ===')
resp = requests.get('http://localhost:4000/api/tasks?viewRole=TENANT&pageSize=20', headers=admin_headers)
data = resp.json()
print(f'  Total={data["total"]}')
for t in data['list'][:5]:
    print(f'    - {t["title"]} ({t["type"]})')

print()
print('=== 真实租客登录 - 逾期 ===')
resp = requests.get('http://localhost:4000/api/tasks/overdue', headers=tenant_headers)
tasks = resp.json()
print(f'  Count={len(tasks)}')

print()
print('=== 管理员切租客视图 - 逾期 ===')
resp = requests.get('http://localhost:4000/api/tasks/overdue?viewRole=TENANT', headers=admin_headers)
tasks = resp.json()
print(f'  Count={len(tasks)}')

print()
print('=== 任务报表 - 租客视图 ===')
resp = requests.get('http://localhost:4000/api/reports/tasks?viewRole=TENANT', headers=admin_headers)
data = resp.json()
print(f'  Summary={data.get("summary", {})}')
