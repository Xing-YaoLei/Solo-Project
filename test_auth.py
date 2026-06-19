#!/usr/bin/env python3
import subprocess
import json
import urllib.parse

BASE = "http://localhost:4321"

def curl(url):
    r = subprocess.run(["curl", "-s", url], capture_output=True, text=True)
    return r.stdout

def curl_code(url):
    r = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", url], capture_output=True, text=True)
    return r.stdout

print("=== Step 1: Generate viewer share token ===")
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
persisted = data.get("persisted", False)
print(f"Server-filtered scope: {scope}")
print(f"Persisted: {persisted}")
print()

qs_full = f"shareToken={urllib.parse.quote(token)}&sig={urllib.parse.quote(sig)}"
qs_token_only = f"shareToken={urllib.parse.quote(token)}"

print("=== Scenario A: token + sig (signature mode) ===")
print(f"  dashboard: HTTP {curl_code(f'{BASE}/api/dashboard?{qs_full}')}")
print(f"  inventory: {curl(f'{BASE}/api/inventory?{qs_full}')}")
print(f"  quotes:    {curl(f'{BASE}/api/quotes?{qs_full}')}")
print(f"  inspect:   {curl(f'{BASE}/api/inspections?{qs_full}')}")
print()

print("=== Scenario B: token only, no sig (persistence mode) ===")
print(f"  dashboard: HTTP {curl_code(f'{BASE}/api/dashboard?{qs_token_only}')}")
print(f"  inventory: {curl(f'{BASE}/api/inventory?{qs_token_only}')}")
print(f"  quotes:    {curl(f'{BASE}/api/quotes?{qs_token_only}')}")
print(f"  inspect:   {curl(f'{BASE}/api/inspections?{qs_token_only}')}")
print()

print("=== Scenario C: no token (normal admin) ===")
print(f"  dashboard: HTTP {curl_code(f'{BASE}/api/dashboard')}")
inv = json.loads(curl(f"{BASE}/api/inventory"))
qt = json.loads(curl(f"{BASE}/api/quotes"))
insp = json.loads(curl(f"{BASE}/api/inspections"))
print(f"  inventory: {len(inv)} items")
print(f"  quotes:    {len(qt)} items")
print(f"  inspect:   {len(insp)} items")
print()

print("=== Scenario D: fake scope param should be ignored ===")
print(f"  quotes with scope=quotes:view: {curl(f'{BASE}/api/quotes?{qs_full}&scope=quotes%3Aview')}")
