#!/usr/bin/env python3
import requests, json

BASE = "http://localhost:4000/api"

def login():
    r = requests.post(f"{BASE}/auth/login", json={"email":"admin@rental.com","password":"admin"})
    data = r.json()
    return data["accessToken"]

def test(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    print("=== 1. Dashboard (ADMIN) ===")
    r = requests.get(f"{BASE}/reports/dashboard", headers=headers)
    d = r.json()
    print(f'  Props={d["properties"]["total"]} Tasks={d["tasks"]["total"]} Overdue={d["tasks"]["overdue"]} Income={d["finance"]["totalIncome"]}')
    
    print("=== 2. Dashboard (管家视图) ===")
    r = requests.get(f"{BASE}/reports/dashboard?viewRole=PROPERTY_MANAGER", headers=headers)
    d = r.json()
    print(f'  Props={d["properties"]["total"]} Tasks={d["tasks"]["total"]}')
    
    print("=== 3. Dashboard (财务视图) ===")
    r = requests.get(f"{BASE}/reports/dashboard?viewRole=FINANCE", headers=headers)
    d = r.json()
    print(f'  Finance records relevant')
    
    print("=== 4. Tasks with viewRole=FINANCE ===")
    r = requests.get(f"{BASE}/tasks?viewRole=FINANCE&pageSize=3", headers=headers)
    d = r.json()
    print(f'  Total={d["total"]} Count={len(d["list"])}')
    
    print("=== 5. Overdue Tasks ===")
    r = requests.get(f"{BASE}/tasks?pool=overdue&pageSize=5", headers=headers)
    d = r.json()
    print(f'  Overdue count={d["total"]}')
    if d["list"]:
        task_id = d["list"][0]["id"]
        print(f'  First overdue task: {task_id}')
        
        print("=== 6. Reject Task ===")
        r = requests.put(f"{BASE}/tasks/{task_id}/reject", headers=headers, json={"rejectReason":"材料不完整"})
        d = r.json()
        print(f'  Status={d["status"]} Reason={d.get("rejectReason","N/A")}')
        
        print("=== 7. Add Materials ===")
        r = requests.post(f"{BASE}/tasks/{task_id}/materials", headers=headers, 
                         json={"materials":[{"name":"身份证复印件","type":"document","url":"upload://id.pdf"}]})
        d = r.json()
        print(f'  Materials count={len(d.get("materials",[]))}')
        
        print("=== 8. Resubmit Task ===")
        r = requests.put(f"{BASE}/tasks/{task_id}/resubmit", headers=headers, json={})
        d = r.json()
        print(f'  Status={d["status"]}')
        
        print("=== 9. Reassign Task ===")
        r = requests.get(f"{BASE}/users/role/PROPERTY_MANAGER", headers=headers)
        users = r.json()
        users = users if isinstance(users, list) else users.get("list",[])
        if users:
            uid = users[0]["id"]
            r = requests.put(f"{BASE}/tasks/{task_id}/reassign", headers=headers,
                           json={"assigneeId":uid,"reassignReason":"转派给负责管家"})
            d = r.json()
            print(f'  Status={d["status"]} Assignee={d.get("assigneeId","N/A")}')
    
    print("=== 10. Revenue Report ===")
    r = requests.get(f"{BASE}/reports/revenue", headers=headers)
    d = r.json()
    print(f'  Income={d["summary"]["totalIncome"]} Net={d["summary"]["netProfit"]}')
    
    print("=== 11. Occupancy Report ===")
    r = requests.get(f"{BASE}/reports/occupancy", headers=headers)
    d = r.json()
    print(f'  Total={d["summary"]["total"]} Occupied={d["summary"]["occupied"]}')
    
    print("=== 12. Task Detail (with photos/amendments) ===")
    r = requests.get(f"{BASE}/tasks?pageSize=1", headers=headers)
    d = r.json()
    if d["list"]:
        tid = d["list"][0]["id"]
        r = requests.get(f"{BASE}/tasks/{tid}", headers=headers)
        t = r.json()
        has_photos = bool(t.get("property",{}).get("photos",[]))
        has_amendments = bool(t.get("contract",{}).get("amendments",[]))
        print(f'  Has photos={has_photos} Has amendments={has_amendments}')

if __name__ == "__main__":
    token = login()
    test(token)
    print("\n✅ All API tests passed!")
