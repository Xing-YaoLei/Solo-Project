#!/usr/bin/env python3
import urllib.request
import urllib.parse
import json
import subprocess

BASE = "http://localhost:8000/api"

def post(path, data, headers=None, form=False):
    hdrs = headers or {}
    if form:
        body = urllib.parse.urlencode(data).encode()
        hdrs["Content-Type"] = "application/x-www-form-urlencoded"
    else:
        body = json.dumps(data).encode()
        hdrs["Content-Type"] = "application/json"
    req = urllib.request.Request(BASE + path, data=body, headers=hdrs, method="POST")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def get(path, headers=None):
    req = urllib.request.Request(BASE + path, headers=headers or {})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def login(u, p):
    r = post("/auth/login", {"username": u, "password": p}, form=True)
    return r["access_token"]

admin_tok = login("admin", "admin123")
headers = {"Authorization": f"Bearer {admin_tok}"}

all_sp = get("/study-progress", headers)
target = None
for p in all_sp:
    if p["completion_rate"] < 30:
        target = p
        break

print(f"测试进度: id={target['id']} 完成率={target['completion_rate']}% 当前风险={target['risk_level']}")

# 重置到 normal
subprocess.run(['psql', '-U', 'postgres', '-d', 'edu_question_bank', '-c',
                f"UPDATE study_progresses SET risk_level='normal' WHERE id={target['id']}"],
               capture_output=True, text=True)
after_reset = get(f"/study-progress/{target['id']}", headers)
print(f"重置后: risk={after_reset['risk_level']} 完成率={after_reset['completion_rate']}%")

# 执行评估
r = post(f"/study-progress/{target['id']}/assess-risk", {}, headers=headers)
print(f"评估结果: {r}")

final = get(f"/study-progress/{target['id']}", headers)
print(f"最终状态: risk={final['risk_level']}")

cr = final["completion_rate"]
if cr < 30:
    expected = "critical"
elif cr < 50:
    expected = "danger"
elif cr < 70:
    expected = "warning"
else:
    expected = "normal"

if final["risk_level"] == expected:
    print(f"✅ 通过！完成率 {cr}% 直接命中 {expected}（跳过中间等级）")
else:
    print(f"❌ 失败！期望 {expected} 实际 {final['risk_level']}")
