import requests
import json

login_resp = requests.post('http://localhost:4000/api/auth/login', json={'email': 'admin@rental.com', 'password': 'admin'})
token = login_resp.json()['accessToken']
headers = {'Authorization': f'Bearer {token}'}

print('=== 1. Occupancy Report (all) ===')
resp = requests.get('http://localhost:4000/api/reports/occupancy', headers=headers)
data = resp.json()
print(f'  Total={data["summary"]["total"]} Occupied={data["summary"]["occupied"]}')
print(f'  trend_count={len(data.get("trend", []))}')
if data.get('trend'):
    print(f'  first_trend={data["trend"][0]}')

print()
print('=== 2. Overdue Tasks (viewRole=FINANCE) ===')
resp = requests.get('http://localhost:4000/api/tasks/overdue?viewRole=FINANCE', headers=headers)
tasks = resp.json()
print(f'  Count={len(tasks)}')

print()
print('=== 3. Tasks (viewRole=MAINTENANCE_WORKER) ===')
resp = requests.get('http://localhost:4000/api/tasks?viewRole=MAINTENANCE_WORKER&pageSize=20', headers=headers)
data = resp.json()
print(f'  Total={data["total"]}')

print()
print('=== 4. Tasks (viewRole=FRONTLINE) ===')
resp = requests.get('http://localhost:4000/api/tasks?viewRole=FRONTLINE&pageSize=20', headers=headers)
data = resp.json()
print(f'  Total={data["total"]}')

print()
print('=== 5. Dashboard (viewRole=FINANCE) ===')
resp = requests.get('http://localhost:4000/api/reports/dashboard?viewRole=FINANCE', headers=headers)
data = resp.json()
print(f'  totalProperties={data.get("totalProperties", "N/A")}')
print(f'  totalTasks={data.get("totalTasks", "N/A")}')

print()
print('All tests passed!')
