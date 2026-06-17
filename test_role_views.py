#!/usr/bin/env python3
import requests, json, time

BASE = 'http://localhost:4000/api'

def test_user(email, password, label):
    r = requests.post(f'{BASE}/auth/login', json={'email': email, 'password': password})
    data = r.json()
    token = data['accessToken']
    user = data['user']
    headers = {'Authorization': f'Bearer {token}'}
    
    # 清除缓存
    requests.post(f'{BASE}/reports/dashboard/refresh', headers=headers)
    time.sleep(0.2)
    
    # Dashboard
    r = requests.get(f'{BASE}/reports/dashboard', headers=headers)
    d = r.json()
    
    # Tasks
    r = requests.get(f'{BASE}/tasks?pageSize=5', headers=headers)
    t = r.json()
    
    print(f'\n=== {label} ({user["role"]}) ===')
    print(f'  房源: {d["properties"]["total"]}, 租客: {d["tenants"]["total"]}')
    print(f'  任务: {d["tasks"]["total"]}, 逾期: {d["tasks"]["overdue"]}')
    print(f'  收入: {d["finance"]["totalIncome"]}')
    print(f'  Tasks API: {t["total"]} 条')

# 测试不同角色
test_user('admin@rental.com', 'admin', '管理员')
test_user('manager@rental.com', 'manager', '管家')
test_user('finance@rental.com', 'finance', '财务')
test_user('worker@rental.com', 'worker', '维修员')
test_user('frontline@rental.com', 'frontline', '一线')
test_user('tenant@rental.com', 'tenant', '租客')
