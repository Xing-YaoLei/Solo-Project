#!/usr/bin/env python3
import requests, json

BASE = 'http://localhost:4000/api'

r = requests.post(f'{BASE}/auth/login', json={'email':'admin@rental.com','password':'admin'})
token = r.json()['accessToken']
headers = {'Authorization': f'Bearer {token}'}

# 看看所有任务
r = requests.get(f'{BASE}/tasks?pageSize=100', headers=headers)
tasks = r.json()['list']
print(f'总任务数: {len(tasks)}')
for t in tasks:
    a = t.get('assignee') or {}
    print(f'  {t["taskNo"]} type={t["type"]} status={t["status"]} assigneeId={t.get("assigneeId")} assignee={a.get("name","N/A")}')

print()

# 维修员登录看看
r = requests.post(f'{BASE}/auth/login', json={'email':'worker@rental.com','password':'worker'})
worker_token = r.json()['accessToken']
worker_headers = {'Authorization': f'Bearer {worker_token}'}
worker_user = r.json()['user']
print(f'维修员: {worker_user["name"]} id={worker_user["id"]}')

# 维修员的任务（不带视图角色过滤）
r = requests.get(f'{BASE}/tasks?pageSize=100', headers=worker_headers)
wt = r.json()
print(f'  维修员任务数(自己的token): {wt["total"]}')
for t in wt['list']:
    print(f'    {t["taskNo"]} type={t["type"]} status={t["status"]}')

# 管理员视图切换到维修员
r = requests.get(f'{BASE}/tasks?pageSize=100&viewRole=MAINTENANCE_WORKER', headers=headers)
wt2 = r.json()
print(f'  管理员切换到维修员视图: {wt2["total"]}')
