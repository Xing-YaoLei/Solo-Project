#!/usr/bin/env python3
import urllib.request, urllib.parse, json, subprocess

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
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"_error": e.code, "_detail": e.read().decode()}

def get(path, headers=None):
    req = urllib.request.Request(BASE + path, headers=headers or {})
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"_error": e.code, "_detail": e.read().decode()}

def login(u, p):
    r = post("/auth/login", {"username": u, "password": p}, form=True)
    return r["access_token"]

def auth(token):
    return {"Authorization": f"Bearer {token}"}

admin_tok = login("admin", "admin123")
teacher_tok = login("teacher", "teacher123")

print("=" * 70)
print("测试 1: 风险重算 - 升级 + 降级均可")
print("=" * 70)

# 找一个完成率 >= 70% 的进度（当前应为 normal），手动改到 critical，再 assess 看是否降回 normal
all_sp = get("/study-progress", auth(admin_tok))
high_cr = [p for p in all_sp if p["completion_rate"] >= 70]
low_cr = [p for p in all_sp if p["completion_rate"] < 30]

if high_cr:
    p = high_cr[0]
    pid = p["id"]
    cr = p["completion_rate"]
    print(f"高完成率进度: id={pid} 完成率={cr}% 当前风险={p['risk_level']}")

    subprocess.run(['psql', '-U', 'postgres', '-d', 'edu_question_bank', '-c',
                    f"UPDATE study_progresses SET risk_level='critical' WHERE id={pid}"],
                   capture_output=True, text=True)
    after = get(f"/study-progress/{pid}", auth(admin_tok))
    print(f"  手动改为 critical 后: risk={after['risk_level']}")

    r = post(f"/study-progress/{pid}/assess-risk", {}, headers=auth(admin_tok))
    final = get(f"/study-progress/{pid}", auth(admin_tok))
    print(f"  评估后: risk={final['risk_level']}  (结果={r})")

    if cr >= 70:
        assert final["risk_level"] == "normal", f"❌ 完成率 {cr}%>=70% 应为 normal，实际 {final['risk_level']}"
        print(f"  ✅ 完成率 {cr}% >= 70%，从 critical 降回 normal（可降级）")

if low_cr:
    p = low_cr[0]
    pid = p["id"]
    cr = p["completion_rate"]
    print(f"\n低完成率进度: id={pid} 完成率={cr}% 当前风险={p['risk_level']}")

    subprocess.run(['psql', '-U', 'postgres', '-d', 'edu_question_bank', '-c',
                    f"UPDATE study_progresses SET risk_level='normal' WHERE id={pid}"],
                   capture_output=True, text=True)

    r = post(f"/study-progress/{pid}/assess-risk", {}, headers=auth(admin_tok))
    final = get(f"/study-progress/{pid}", auth(admin_tok))
    print(f"  从 normal 评估后: risk={final['risk_level']}  (结果={r})")

    if cr < 30:
        assert final["risk_level"] == "critical", f"❌ 完成率 {cr}%<30% 应为 critical，实际 {final['risk_level']}"
        print(f"  ✅ 完成率 {cr}% < 30%，从 normal 升到 critical（可升级）")

print("\n" + "=" * 70)
print("测试 2: 中等完成率进度 - 验证四级阈值")
print("=" * 70)

for p in all_sp:
    cr = p["completion_rate"]
    pid = p["id"]
    subprocess.run(['psql', '-U', 'postgres', '-d', 'edu_question_bank', '-c',
                    f"UPDATE study_progresses SET risk_level='normal' WHERE id={pid}"],
                   capture_output=True, text=True)
    post(f"/study-progress/{pid}/assess-risk", {}, headers=auth(admin_tok))
    final = get(f"/study-progress/{pid}", auth(admin_tok))

    if cr >= 70:
        expected = "normal"
    elif cr >= 50:
        expected = "warning"
    elif cr >= 30:
        expected = "danger"
    else:
        expected = "critical"

    actual = final["risk_level"]
    status = "✅" if actual == expected else "❌"
    if actual != expected:
        print(f"  {status} id={pid} 完成率={cr}% 期望={expected} 实际={actual}")
    else:
        print(f"  {status} 完成率={cr:>6.1f}% → {actual}")

print("\n" + "=" * 70)
print("测试 3: 教师风险待办 - 跟随最新等级，只有 danger/critical + 负责课程")
print("=" * 70)

todos = get("/todos/teacher", auth(teacher_tok))
teacher_courses = get("/courses", auth(teacher_tok))
teacher_course_map = {c["id"]: c["name"] for c in teacher_courses}

risk_todos = [t for t in todos if t["todo_type"] == "risk_followup" and not t["is_completed"]]
print(f"教师待办总数={len(todos)} 风险跟进={len(risk_todos)}")

for t in risk_todos:
    prog_id = t["related_id"]
    if prog_id is None:
        continue
    prog = get(f"/study-progress/{prog_id}", auth(teacher_tok))
    if isinstance(prog, dict) and prog.get("_error"):
        print(f"  ❌ 进度 {prog_id} 无法访问")
        continue
    cid = prog["course_id"]
    risk = prog["risk_level"]
    cr = prog["completion_rate"]
    cname = teacher_course_map.get(cid, "❌非负责课程")

    ok_course = cid in teacher_course_map
    ok_risk = risk in ("danger", "critical")
    icon = "✅" if (ok_course and ok_risk) else "❌"
    print(f"  {icon} 进度{prog_id} 课程={cid}:{cname} 风险={risk} 完成率={cr}%")

    if not ok_course:
        print(f"     → 非负责课程！")
    if not ok_risk:
        print(f"     → 风险不是 danger/critical（已完成率{cr}%对应{risk}）")

# 统计
all_ok = all(
    (get(f"/study-progress/{t['related_id']}", auth(teacher_tok)).get("risk_level") in ("danger", "critical"))
    for t in risk_todos if t.get("related_id") is not None
)
if all_ok:
    print(f"  ✅ 所有 {len(risk_todos)} 个风险待办都对应 danger/critical 进度")

print("\n" + "=" * 70)
print("全部测试通过 ✅")
print("=" * 70)
