import requests

BASE_URL = "http://localhost:3001/api"

login_resp = requests.post(
    f"{BASE_URL}/auth/login",
    json={"phone": "13800000001", "password": "123456"}
)
token = login_resp.json()["token"]
headers = {"Authorization": f"Bearer {token}"}
print("Login OK, token:", token[:30] + "...")

overdue_resp = requests.get(f"{BASE_URL}/todo-pool/overdue", headers=headers)
overdue_list = overdue_resp.json()
print("Overdue count:", len(overdue_list))
cid = overdue_list[0]["id"]
print("Complaint:", overdue_list[0]["code"], overdue_list[0]["status"])

print()
print("=== supplement:")
r = requests.post(f"{BASE_URL}/complaints/{cid}/supplement", json={"content": "test"}, headers=headers)
d = r.json()
print("status:", d.get("status"))

print()
print("=== reject:")
r = requests.post(f"{BASE_URL}/complaints/{cid}/reject", json={"reason": "test"}, headers=headers)
d = r.json()
print("status:", d.get("status"))

print()
users = requests.get(f"{BASE_URL}/users", headers=headers).json()
op = [u for u in users if u["role"] == "OPERATOR"][0]
print("=== reassign to:", op["name"])
r = requests.post(f"{BASE_URL}/complaints/{cid}/reassign", json={"toUserId": op["id"], "reason": "test"}, headers=headers)
d = r.json()
print("status:", d.get("status"))
print("owner:", d.get("ownerName"))

print()
print("=== DONE ===")
