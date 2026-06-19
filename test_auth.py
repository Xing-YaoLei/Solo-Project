#!/usr/bin/env python3
import subprocess
import json
import urllib.parse

BASE = "http://localhost:4321"

def curl(url):
    r = subprocess.run(["curl", "-s", url], capture_output=True, text=True)
    return r.stdout

def curl_with_code(url):
    r = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", url], capture_output=True, text=True)
    return r.stdout

print("=== Step 1: 生成 viewer 分享 token ===")
r = subprocess.run(
    ["curl", "-s", "-X", "POST", f"{BASE}/api/share",
     "-H", "Content-Type: application/json",
     "-d", json.dumps({
         "allowedRole": "viewer",
         "scope": ["dashboard:view", "inventory:view", "quotes:view", "inspection:view"],
         "expiresIn": 86400
     })],
    capture_output=True, text=True
)
data = json.loads(r.stdout)
token = data["token"]
sig = data["signature"]
scope = data["scope"]
print(f"服务端过滤后 scope: {scope}")
print(f"token: {token[:20]}...")
print()

print("=== Step 2: 用 shareToken 调用各 API ===")
qs = f"shareToken={urllib.parse.quote(token)}&sig={urllib.parse.quote(sig)}"

print("--- /api/dashboard (有权限, 应200) ---")
print(f"HTTP {curl_with_code(f'{BASE}/api/dashboard?{qs}')}")

print("--- /api/workorders/trend (dashboard有权限) ---")
d = json.loads(curl(f"{BASE}/api/workorders/trend?days=7&{qs}"))
print(f"返回数据点: {len(d)}")

print("--- /api/inventory (viewer无权限, 应返回 []) ---")
print(curl(f"{BASE}/api/inventory?{qs}"))

print("--- /api/quotes (viewer无权限, 应返回 []) ---")
print(curl(f"{BASE}/api/quotes?{qs}"))

print("--- /api/inspections (viewer无权限, 应返回 []) ---")
print(curl(f"{BASE}/api/inspections?{qs}"))

print()
print("=== Step 3: 客户端伪造 scope 参数应被忽略 ===")
print("--- /api/quotes 带 scope=quotes:view 伪造参数 (仍应返回 []) ---")
print(curl(f"{BASE}/api/quotes?{qs}&scope=quotes%3Aview"))
