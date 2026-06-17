#!/usr/bin/env python3
import requests, json

BASE = 'http://localhost:4000/api'

r = requests.post(f'{BASE}/auth/login', json={'email':'admin@rental.com','password':'admin'})
admin_token = r.json()['accessToken']
admin_headers = {'Authorization': f'Bearer {admin_token}'}

# 获取所有任务看看现在的 assignee 情况
r = requests.get(f'{BASE}/tasks?pageSize=100', headers=admin_headers)
tasks = r.json()['list']
print('任务列表:')
for t in tasks:
    a = t.get('assignee') or {}
    print(f'  {t["taskNo"]} type={t["type"]} status={t["status"]} assignee={a.get("name","N/A")}({a.get("role","N/A")})')

print()

# 用维修员的 id 直接查询任务
r = requests.get(f'{BASE}/users/role/MAINTENANCE_WORKER', headers=admin_headers)
workers = r.json()
worker = workers[0]
print(f'维修员: {worker["name"]} id={worker["id"]}')

# 直接查询 assigneeId=worker_id 且 type=MAINTENANCE
r = requests.get(f'{BASE}/tasks?pageSize=100&assigneeId={worker["id"]}&type=MAINTENANCE', headers=admin_headers)
print(f'  直接查询 assigneeId=worker_id 且 type=MAINTENANCE: {r.json()["total"]} 个')
for t in r.json()['list']:
    print(f'    {t["taskNo"]} type={t["type"]} status={t["status"]}')

# 只查 assigneeId
r = requests.get(f'{BASE}/tasks?pageSize=100&assigneeId={worker["id"]}', headers=admin_headers)
print(f'  只查 assigneeId=worker_id: {r.json()["total"]} 个')

# 只查 type=MAINTENANCE
r = requests.get(f'{BASE}/tasks?pageSize=100&type=MAINTENANCE', headers=admin_headers)
print(f'  只查 type=MAINTENANCE: {r.json()["total"]} 个')
