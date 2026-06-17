#!/usr/bin/env python3
import requests, json

BASE = 'http://localhost:4000/api'

r = requests.post(f'{BASE}/auth/login', json={'email':'admin@rental.com','password':'admin'})
admin_token = r.json()['accessToken']
admin_headers = {'Authorization': f'Bearer {admin_token}'}

# 直接用维修员 token 登录
r = requests.post(f'{BASE}/auth/login', json={'email':'worker@rental.com','password':'worker'})
worker_token = r.json()['accessToken']
worker_headers = {'Authorization': f'Bearer {worker_token}'}
worker = r.json()['user']
print(f'维修员: {worker["name"]} role={worker["role"]} id={worker["id"]}')

# 用维修员自己的 token
r = requests.get(f'{BASE}/tasks?pageSize=100', headers=worker_headers)
print(f'  维修员自己的token查询: {r.json()["total"]} 个任务')
for t in r.json()['list']:
    print(f'    {t["taskNo"]} type={t["type"]} status={t["status"]}')

print()

# 管理员切换视图
print('管理员切换到 MAINTENANCE_WORKER 视图:')
r = requests.get(f'{BASE}/tasks?pageSize=100&viewRole=MAINTENANCE_WORKER', headers=admin_headers)
print(f'  总数: {r.json()["total"]}')
for t in r.json()['list']:
    print(f'    {t["taskNo"]} type={t["type"]} status={t["status"]}')
