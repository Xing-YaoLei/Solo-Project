#!/usr/bin/env python3
import requests, json, time

BASE = 'http://localhost:4000/api'

r = requests.post(f'{BASE}/auth/login', json={'email':'admin@rental.com','password':'admin'})
token = r.json()['accessToken']
headers = {'Authorization': f'Bearer {token}'}

# 清除缓存
r = requests.post(f'{BASE}/reports/dashboard/refresh', headers=headers)
print('Clear cache:', r.json())

time.sleep(0.5)

# 测试 1：不带 viewRole
r1 = requests.get(f'{BASE}/reports/dashboard', headers=headers)
d1 = r1.json()
print(f'1. 不带 viewRole: Props={d1["properties"]["total"]}, Tasks={d1["tasks"]["total"]}, Income={d1["finance"]["totalIncome"]}')

# 测试 2：带 viewRole=ADMIN
r2 = requests.get(f'{BASE}/reports/dashboard?viewRole=ADMIN', headers=headers)
d2 = r2.json()
print(f'2. 带 viewRole=ADMIN: Props={d2["properties"]["total"]}, Tasks={d2["tasks"]["total"]}')

# 测试 3：带 viewRole=PROPERTY_MANAGER
r3 = requests.get(f'{BASE}/reports/dashboard?viewRole=PROPERTY_MANAGER', headers=headers)
d3 = r3.json()
print(f'3. 带 viewRole=PROPERTY_MANAGER: Props={d3["properties"]["total"]}, Tasks={d3["tasks"]["total"]}')

# 测试 4：带 viewRole=FINANCE
r4 = requests.get(f'{BASE}/reports/dashboard?viewRole=FINANCE', headers=headers)
d4 = r4.json()
print(f'4. 带 viewRole=FINANCE: Props={d4["properties"]["total"]}, Tasks={d4["tasks"]["total"]}')

# 测试 5：带 viewRole=MAINTENANCE_WORKER
r5 = requests.get(f'{BASE}/reports/dashboard?viewRole=MAINTENANCE_WORKER', headers=headers)
d5 = r5.json()
print(f'5. 带 viewRole=MAINTENANCE_WORKER: Props={d5["properties"]["total"]}, Tasks={d5["tasks"]["total"]}')

# 测试 6：带 viewRole=FRONTLINE
r6 = requests.get(f'{BASE}/reports/dashboard?viewRole=FRONTLINE', headers=headers)
d6 = r6.json()
print(f'6. 带 viewRole=FRONTLINE: Props={d6["properties"]["total"]}, Tasks={d6["tasks"]["total"]}')

# 测试 7：带 viewRole=TENANT
r7 = requests.get(f'{BASE}/reports/dashboard?viewRole=TENANT', headers=headers)
d7 = r7.json()
print(f'7. 带 viewRole=TENANT: Props={d7["properties"]["total"]}, Tenants={d7["tenants"]["total"]}, Tasks={d7["tasks"]["total"]}')
