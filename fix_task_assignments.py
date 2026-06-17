#!/usr/bin/env python3
import requests, json

BASE = 'http://localhost:4000/api'

r = requests.post(f'{BASE}/auth/login', json={'email':'admin@rental.com','password':'admin'})
admin_token = r.json()['accessToken']
admin_headers = {'Authorization': f'Bearer {admin_token}'}

# 获取所有用户
r = requests.get(f'{BASE}/users?pageSize=100', headers=admin_headers)
users = r.json()['list']
user_map = {u['role']: u for u in users}
print('用户:')
for role, u in user_map.items():
    print(f'  {role}: {u["name"]} id={u["id"]}')

print()

# 获取所有任务
r = requests.get(f'{BASE}/tasks?pageSize=100', headers=admin_headers)
tasks = r.json()['list']
print(f'现有 {len(tasks)} 个任务:')
for t in tasks:
    print(f'  {t["taskNo"]} type={t["type"]} status={t["status"]} assigneeId={t.get("assigneeId")}')

# 修正任务分配：
# PROPERTY_MANAGER -> 房源上架、合同审核
# MAINTENANCE_WORKER -> 维修工单
# FINANCE -> 租金逾期、合同审核
# FRONTLINE -> 房源上架、水电读数、维修
# TENANT -> 与自己相关的

manager_id = user_map['PROPERTY_MANAGER']['id']
worker_id = user_map['MAINTENANCE_WORKER']['id']
finance_id = user_map['FINANCE']['id']
frontline_id = user_map['FRONTLINE']['id']

for t in tasks:
    new_assignee = None
    if t['type'] == 'MAINTENANCE':
        new_assignee = worker_id
    elif t['type'] == 'RENT_OVERDUE' or t['type'] == 'CONTRACT_REVIEW':
        new_assignee = finance_id
    elif t['type'] == 'PROPERTY_LISTING':
        new_assignee = frontline_id
    elif t['type'] == 'UTILITY_READING':
        new_assignee = frontline_id
    
    if new_assignee and t.get('assigneeId') != new_assignee:
        print(f'  更新 {t["taskNo"]} type={t["type"]}: assignee {t.get("assigneeId")} -> {new_assignee}')
        requests.put(f'{BASE}/tasks/{t["id"]}', headers=admin_headers, json={'assigneeId': new_assignee})

print()
print('任务分配更新完成')
print()

# 验证
print('验证角色视图:')
for role in ['PROPERTY_MANAGER', 'MAINTENANCE_WORKER', 'FINANCE', 'FRONTLINE', 'TENANT', 'ADMIN']:
    r = requests.get(f'{BASE}/tasks?pageSize=100&viewRole={role}', headers=admin_headers)
    print(f'  {role}: {r.json()["total"]} 个任务')
